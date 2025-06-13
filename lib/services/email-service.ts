export interface EmailService {
    sendVerificationEmail(email: string, subject: string, body: string): Promise<void>;
}

export class EmailServiceImpl implements EmailService {
    constructor() {}

    async sendVerificationEmail(email: string, verificationUrl: string): Promise<void> {
        await this.sendEmail(email, 'email-verification', {
            verifyUrl: verificationUrl,
        });
    }

    // TODO: Implement this with a real email service (SendGrid, Mailgun, etc.)
    private async sendEmail(email: string, template: string, dynamicTemplateData: Record<string, string>): Promise<void> {
        try {
            console.log(`Sending email to ${email} with template ${template} and dynamicTemplateData ${dynamicTemplateData}`);
            return;
        } catch(error) {
            console.error(error);
            throw error;
        }
    }
}