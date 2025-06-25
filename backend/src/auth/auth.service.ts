import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;

    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      }).catch(error => {
        this.logger.error(`Database error checking existing user: ${error.message}`, error.stack);
        throw new InternalServerErrorException('Database error occurred');
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }

      // Hash password
      let hashedPassword;
      try {
        hashedPassword = await bcrypt.hash(password, 10);
      } catch (hashError) {
        this.logger.error(`Password hashing error: ${hashError.message}`, hashError.stack);
        throw new InternalServerErrorException('Error processing password');
      }

      // Create user
      let user;
      try {
        user = await this.prisma.user.create({
          data: {
            email,
            password: hashedPassword,
          },
        });
        this.logger.log(`User created successfully: ${user.id}`);
      } catch (dbError) {
        if (dbError instanceof PrismaClientKnownRequestError) {
          if (dbError.code === 'P2002') {
            throw new ConflictException('Email already in use');
          }
        }
        this.logger.error(`User creation error: ${dbError.message}`, dbError.stack);
        throw new InternalServerErrorException('Failed to create user');
      }
      
      // Generate JWT token
      let token;
      try {
        token = this.jwtService.sign({
          sub: user.id,
          email: user.email,
        });
        this.logger.log('JWT token generated successfully');
      } catch (tokenError) {
        this.logger.error(`Token generation error: ${tokenError.message}`, tokenError.stack);
        // Don't throw here - we can still return the user data without a token
        // The client can request a new token via login
        return {
          message: 'Registration successful, but token generation failed. Please login.',
          user: {
            id: user.id,
            email: user.email,
          }
        };
      }

      // Return successful response with token
      return {
        message: 'Registration successful',
        accessToken: token,
        user: {
          id: user.id,
          email: user.email,
        }
      };
    } catch (error) {
      // Already handled specific errors will be rethrown
      if (error instanceof ConflictException || 
          error instanceof InternalServerErrorException || 
          error instanceof BadRequestException) {
        throw error;
      }
      
      // For unexpected errors, log and return a generic error
      this.logger.error(
        `Unexpected registration error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException('Registration failed due to an unexpected error');
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    try {
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email },
      }).catch(error => {
        this.logger.error(`Database error finding user: ${error.message}`, error.stack);
        throw new InternalServerErrorException('Database error occurred');
      });

      // Check if user exists
      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Verify password
      let passwordMatches;
      try {
        passwordMatches = await bcrypt.compare(password, user.password);
      } catch (compareError) {
        this.logger.error(`Password comparison error: ${compareError.message}`, compareError.stack);
        throw new InternalServerErrorException('Error processing authentication');
      }

      if (!passwordMatches) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Generate JWT token
      let token;
      try {
        token = this.jwtService.sign({
          sub: user.id,
          email: user.email,
        });
      } catch (tokenError) {
        this.logger.error(`Token generation error during login: ${tokenError.message}`, tokenError.stack);
        throw new InternalServerErrorException('Failed to generate authentication token');
      }

      return {
        accessToken: token,
        user: {
          id: user.id,
          email: user.email,
        },
      };
    } catch (error) {
      // Already handled specific errors will be rethrown
      if (error instanceof UnauthorizedException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      
      // For unexpected errors, log and return a generic error
      this.logger.error(`Unexpected login error: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Login failed due to an unexpected error');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    try {
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email },
      }).catch(error => {
        this.logger.error(`Database error finding user: ${error.message}`, error.stack);
        throw new InternalServerErrorException('Database error occurred');
      });

      if (!user) {
        // For security reasons, don't reveal if email exists or not
        return {
          message: 'If your email exists in our system, you will receive a password reset link.',
        };
      }

      // Generate password reset token
      let token;
      try {
        token = this.jwtService.sign(
          { sub: user.id, email: user.email, type: 'password-reset' },
          { expiresIn: '1h' }
        );
      } catch (tokenError) {
        this.logger.error(`Token generation error during password reset: ${tokenError.message}`, tokenError.stack);
        throw new InternalServerErrorException('Failed to generate reset token');
      }

      // Send password reset email
      try {
        await this.mailService.sendPasswordReset(user, token);
        this.logger.log(`Password reset email sent to ${user.email}`);
      } catch (mailError) {
        this.logger.error(`Error sending password reset email: ${mailError.message}`, mailError.stack);
        throw new InternalServerErrorException('Failed to send password reset email');
      }

      return {
        message: 'If your email exists in our system, you will receive a password reset link.',
      };
    } catch (error) {
      // Already handled specific errors will be rethrown
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      
      // For unexpected errors, log and return a generic error
      this.logger.error(`Unexpected error during forgot password: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Password reset request failed due to an unexpected error');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;

    try {
      
      // Verify token
      let payload;
      try {
        payload = this.jwtService.verify(token);
      } catch (tokenError) {
        this.logger.warn(`Invalid reset token: ${tokenError.message}`);
        throw new UnauthorizedException('Invalid or expired token');
      }

      if (payload.type !== 'password-reset') {
        this.logger.warn(`Wrong token type: ${payload.type}`);
        throw new UnauthorizedException('Invalid token');
      }

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      }).catch(error => {
        this.logger.error(`Database error finding user: ${error.message}`, error.stack);
        throw new InternalServerErrorException('Database error occurred');
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Hash new password
      let hashedPassword;
      try {
        hashedPassword = await bcrypt.hash(password, 10);
      } catch (hashError) {
        this.logger.error(`Password hashing error: ${hashError.message}`, hashError.stack);
        throw new InternalServerErrorException('Error processing password');
      }

      // Update user password
      try {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });
        this.logger.log(`Password updated for user: ${user.id}`);
      } catch (dbError) {
        this.logger.error(`Error updating password in database: ${dbError.message}`, dbError.stack);
        throw new InternalServerErrorException('Failed to update password');
      }

      return {
        message: 'Password reset successful. Please login with your new password.',
      };
    } catch (error) {
      // Already handled specific errors will be rethrown
      if (error instanceof BadRequestException || 
          error instanceof UnauthorizedException || 
          error instanceof NotFoundException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      
      // For unexpected errors, log and return a generic error
      this.logger.error(`Unexpected error during password reset: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Password reset failed due to an unexpected error');
    }
  }

  async getMe(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, createdAt: true, updatedAt: true },
      }).catch(error => {
        this.logger.error(`Database error finding user profile: ${error.message}`, error.stack);
        throw new InternalServerErrorException('Database error occurred');
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      // Already handled specific errors will be rethrown
      if (error instanceof NotFoundException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      
      // For unexpected errors, log and return a generic error
      this.logger.error(`Unexpected error retrieving user profile: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve user profile');
    }
  }
}
