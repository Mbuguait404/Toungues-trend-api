import { IsString, IsEnum, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsEnum(['french','english','german','kiswahili']) language: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty({ isArray: true }) @IsArray() levels: string[];
}
