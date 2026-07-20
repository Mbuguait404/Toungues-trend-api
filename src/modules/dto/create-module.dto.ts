import { IsString, IsEnum, IsNumber, IsOptional, IsArray, IsBoolean, IsMongoId } from 'class-validator';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export class CreateModuleDto {
  @IsMongoId()
  courseId: string;

  @IsString()
  title: string;

  @IsEnum(CEFR_LEVELS)
  level: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  objectives?: string[];

  @IsNumber()
  @IsOptional()
  estimatedDuration?: number;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  prerequisiteModuleIds?: string[];

  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
