import 'server-only';
import nodemailer, { Transporter } from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';

const TEMPLATE_VERIFICATION_ID = 'email-verification';

interface Personalization {
    email: string;
    data: {
        [key: string]: unknown;
    };
}

interface ContactFormData {
    userEmail: string;
    userId: string;
    subject: string;
    category: string;
    message: string;
    attachments: Array<{
        filename: string;
        content: string;
        contentType: string;
        size: number;
    }>;
}

export interface EmailService {
    sendVerificationEmail(email: string, verificationUrl: string): Promise<void>;
    sendPasswordResetEmail(email: string, resetUrl: string, locale?: string): Promise<void>;
    sendContactFormEmail(data: ContactFormData): Promise<void>;
}

export class EmailServiceImpl implements EmailService {
    private transporter: Transporter;
    private readonly sender: string;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        this.sender = process.env.SMTP_USER || 'info@irsimples.pt';
    }

    async sendVerificationEmail(email: string, verificationUrl: string, locale: string = 'pt'): Promise<void> {
        // Validate the URL before sending
        try {
            new URL(verificationUrl);
        } catch {
            console.error('Invalid verification URL provided:', verificationUrl);
            throw new Error('Invalid verification URL');
        }

        const personalization: Personalization = {
            email: email,
            data: {
                verifyUrl: verificationUrl,
            }
        };
        

        // Load HTML template from local file
        let templatePath = '';
        if (locale === 'pt') {
            templatePath = join(process.cwd(), 'lib', 'services', 'emails', 'email-verification-pt.html');
        } else {
            templatePath = join(process.cwd(), 'lib', 'services', 'emails', 'email-verification-en.html');
        }
        let htmlTemplate = readFileSync(templatePath, 'utf-8');

        // Replace template variables with actual values
        htmlTemplate = htmlTemplate.replace(/{{ email }}/g, email);
        htmlTemplate = htmlTemplate.replace(/{{ verifyUrl }}/g, verificationUrl);

        // Log the final HTML for debugging (remove in production)
        console.log('Email template after replacement:', {
            email,
            verificationUrl,
            containsVerifyUrl: htmlTemplate.includes(verificationUrl),
            containsPlaceholder: htmlTemplate.includes('{{ verifyUrl }}')
        });

        if (locale === 'pt') {
            await this.sendSingleEmail(email, 'IRSimples - Verificar o seu email', TEMPLATE_VERIFICATION_ID, personalization, htmlTemplate);
        } else {
            await this.sendSingleEmail(email, 'IRSimples - Verify your email', TEMPLATE_VERIFICATION_ID, personalization, htmlTemplate);
        }
    }

    async sendPasswordResetEmail(email: string, resetUrl: string, locale: string = 'pt'): Promise<void> {
        // Validate the URL before sending
        try {
            new URL(resetUrl);
        } catch {
            console.error('Invalid reset URL provided:', resetUrl);
            throw new Error('Invalid reset URL');
        }

        const personalization: Personalization = {
            email: email,
            data: {
                resetUrl: resetUrl,
            }
        };

        // Load HTML template from local file
        let templatePath = '';
        if (locale === 'pt') {
            templatePath = join(process.cwd(), 'lib', 'services', 'emails', 'password-reset-pt.html');
        } else {
            templatePath = join(process.cwd(), 'lib', 'services', 'emails', 'password-reset-en.html');
        }
        let htmlTemplate = readFileSync(templatePath, 'utf-8');

        // Replace template variables with actual values
        htmlTemplate = htmlTemplate.replace(/{{ email }}/g, email);
        htmlTemplate = htmlTemplate.replace(/{{ resetUrl }}/g, resetUrl);

        // Log the final HTML for debugging (remove in production)
        console.log('Password reset email template after replacement:', {
            email,
            resetUrl,
            containsResetUrl: htmlTemplate.includes(resetUrl),
            containsPlaceholder: htmlTemplate.includes('{{ resetUrl }}')
        });

        if (locale === 'pt') {
            await this.sendSingleEmail(email, 'IRSimples - Redefinir a sua palavra-passe', 'password-reset', personalization, htmlTemplate);
        } else {
            await this.sendSingleEmail(email, 'IRSimples - Reset your password', 'password-reset', personalization, htmlTemplate);
        }
    }

    async sendContactFormEmail(data: ContactFormData): Promise<void> {
        const { userEmail, userId, subject, category, message, attachments } = data;

        // Load HTML template from local file
        const templatePath = join(process.cwd(), 'lib', 'services', 'emails', 'contact-form.html');
        let htmlTemplate = readFileSync(templatePath, 'utf-8');

        // Build attachment section HTML if there are attachments
        const attachmentSection = attachments.length > 0 ? `
        <div class="attachments">
            <div class="label">Attachments (${attachments.length}):</div>
            ${attachments.map(att => `
            <div class="attachment-item">
                <span>${att.filename}</span>
                <span>${(att.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            `).join('')}
        </div>
        ` : '';

        // Replace template variables with actual values
        htmlTemplate = htmlTemplate.replace(/{{ userEmail }}/g, userEmail);
        htmlTemplate = htmlTemplate.replace(/{{ userId }}/g, userId);
        htmlTemplate = htmlTemplate.replace(/{{ category }}/g, category.charAt(0).toUpperCase() + category.slice(1));
        htmlTemplate = htmlTemplate.replace(/{{ subject }}/g, subject);
        htmlTemplate = htmlTemplate.replace(/{{ message }}/g, message);
        htmlTemplate = htmlTemplate.replace(/{{ attachmentSection }}/g, attachmentSection);

        // Prepare attachments for nodemailer
        const emailAttachments = attachments.map(att => ({
            filename: att.filename,
            content: att.content,
            encoding: 'base64' as const,
            contentType: att.contentType,
        }));

        // Send email to support
        await this.transporter.sendMail({
            from: this.sender,
            to: this.sender, // Send to support email
            replyTo: userEmail, // Allow easy reply to user
            subject: `[Contact Form - ${category.toUpperCase()}] ${subject}`,
            html: htmlTemplate,
            attachments: emailAttachments,
        });
    }

    private async sendSingleEmail(email: string, subject: string, template: string, personalization: Personalization, htmlContent?: string): Promise<void> {
        if (!htmlContent) {
            throw new Error('HTML content is required');
        }

        try {
            console.log(`Sending email to ${email} with template ${template}`);
            const info = await this.transporter.sendMail({
                from: this.sender,
                to: personalization.email,                               
                subject: subject,
                html: htmlContent,                  
            });
            console.log(info);
            return;
        } catch(error) {
            console.error(error);
            throw error;
        }
    }
}