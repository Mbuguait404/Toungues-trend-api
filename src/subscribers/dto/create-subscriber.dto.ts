import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSubscriberDto {
  @IsEmail()
  email: string;

  /** Honeypot — bots fill hidden inputs, humans never see it. Checked in the service. */
  @IsString()
  @IsOptional()
  @MaxLength(200)
  website?: string;
}