import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  
  constructor(private mailerService: MailerService) {}

  async sendUserConfirmation(user: { email: string; id: string }, token: string) {
    const url = `http://localhost:4200/auth/confirm?token=${token}`;
    
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Welcome to Notes App! Confirm your Email',
        template: './confirmation',
        context: {
          name: user.email.split('@')[0],
          url,
        },
      });
      this.logger.log(`Confirmation email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Error sending confirmation email: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendPasswordReset(user: { email: string; id: string }, token: string) {
    const url = `http://localhost:4200/auth/reset-password?token=${token}`;

    try {
      this.logger.debug(`Sending password reset email to ${user.email} with context: ${JSON.stringify({
        name: user.email.split('@')[0],
        url
      })}`);
      
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Password Reset Request',
        template: 'password-reset', // Remove the './' prefix
        context: {
          name: user.email.split('@')[0],
          url,
        },
      });
      this.logger.log(`Password reset email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Error sending password reset email: ${error.message}`, error.stack);
      throw error;
    }
  }
}