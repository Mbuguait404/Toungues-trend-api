import { IsBoolean, IsMongoId, IsNumber, IsOptional } from 'class-validator';

export class UpdateProgressDto {
  @IsMongoId()
  moduleId: string;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @IsOptional()
  @IsNumber()
  score?: number;
}
