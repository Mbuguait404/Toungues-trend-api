import { IsString, IsEnum, IsOptional, IsMongoId } from 'class-validator';

const MATERIAL_TYPES = ['pdf', 'audio', 'video', 'quiz', 'youtube'] as const;

export class CreateMaterialDto {
  @IsString()
  title: string;

  @IsEnum(MATERIAL_TYPES)
  @IsOptional()
  type?: string;

  @IsMongoId()
  @IsOptional()
  courseId?: string;

  @IsMongoId()
  @IsOptional()
  moduleId?: string;

  @IsString()
  @IsOptional()
  youtubeUrl?: string;
}
