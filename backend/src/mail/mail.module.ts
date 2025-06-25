import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { join } from 'path';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        // Use the environment variable or fallback
        const templatePath = config.get('MAIL_TEMPLATES_PATH') || 'src/mail/templates';
        const templatesDir = join(process.cwd(), templatePath);
        
        console.log(`Using email templates from: ${templatesDir}`);
        
        return {
          transport: {
            host: config.get('MAIL_HOST'),
            port: config.get('MAIL_PORT'),
            secure: false,
            auth: {
              user: config.get('MAIL_USER'),
              pass: config.get('MAIL_PASS'),
            },
          },
          defaults: {
            from: `"Notes App" <${config.get('MAIL_USER')}>`,
          },
          template: {
            dir: templatesDir,
            adapter: new EjsAdapter(),
            options: {
              strict: false, // Set to false to be less strict with errors
            },
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}