import { IsString, IsEnum, IsNumber, IsOptional, IsArray, IsBoolean, IsMongoId, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

class ModulePartDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsEnum(['free', 'premium'])
  @IsOptional()
  accessType?: 'free' | 'premium';
}

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
  @ValidateNested({ each: true })
  @Type(() => ModulePartDto)
  @IsOptional()
  parts?: ModulePartDto[];

  @IsEnum(['free', 'premium'])
  @IsOptional()
  accessType?: 'free' | 'premium';

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
