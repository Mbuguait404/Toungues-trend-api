import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { InquiryStatus } from '../schemas/inquiry.schema';

export class UpdateInquiryDto {
  @IsEnum(InquiryStatus)
  @IsOptional()
  status?: InquiryStatus;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  adminNotes?: string;
}