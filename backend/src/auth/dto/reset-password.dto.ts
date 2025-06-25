import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'Token must be a string' })
  @IsNotEmpty({ message: 'Token is required' })
  token: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @Matches(/^[0-9]{6}$/, {
    message: 'Password must be exactly 6 digits',
  })
  password: string;
}