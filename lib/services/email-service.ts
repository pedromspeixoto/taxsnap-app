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

export interface EmailService {
    sendVerificationEmail(email: string, verificationUrl: string): Promise<void>;
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

        this.sender = 'suporte@meuirs.pt';
    }

    async sendVerificationEmail(email: string, verificationUrl: string): Promise<void> {
        const personalization: Personalization = {
            email: email,
            data: {
                verifyUrl: verificationUrl,
            }
        };

        // Load HTML template from local file
        const templatePath = join(process.cwd(), 'lib', 'services', 'emails', 'email-verification.html');
        let htmlTemplate = readFileSync(templatePath, 'utf-8');

        // Replace template variables with actual values
        htmlTemplate = htmlTemplate.replace(/{{ email }}/g, email);
        htmlTemplate = htmlTemplate.replace(/{{ verifyUrl }}/g, verificationUrl);

        await this.sendSingleEmail(email, 'MeuIRS - Email Verification', TEMPLATE_VERIFICATION_ID, personalization, htmlTemplate);
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