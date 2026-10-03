import { IsString, IsEnum, IsArray, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsEnum(['french','english','german','kiswahili']) language: 'french' | 'english' | 'german' | 'kiswahili';
  @ApiProperty() @IsString() description: string;
  @ApiProperty({ isArray: true }) @IsArray() @IsEnum(['A1','A2','B1','B2','C1','C2'], { each: true }) levels: ('A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2')[];
  @ApiProperty({ enum: ['paid', 'free'], required: false, default: 'paid' })
  @IsEnum(['paid', 'free']) @IsOptional() accessType?: 'paid' | 'free';
  @ApiProperty({ required: false, minimum: 0 })
  @IsNumber() @Min(0) @IsOptional() price?: number;
  @ApiProperty({ enum: ['KES', 'EUR', 'CHF', 'USD'], required: false, default: 'KES' })
  @IsEnum(['KES', 'EUR', 'CHF', 'USD']) @IsOptional() currency?: 'KES' | 'EUR' | 'CHF' | 'USD';
}
