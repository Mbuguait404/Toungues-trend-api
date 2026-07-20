import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsMongoId, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QuizQuestionDto {
  @IsString()
  questionText: string;

  @IsArray()
  @IsString({ each: true })
  options: string[];

  @IsNumber()
  correctIndex: number;

  @IsString()
  @IsOptional()
  explanation?: string;
}

export class CreateQuizDto {
  @IsMongoId()
  moduleId: string;

  @IsString()
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions: QuizQuestionDto[];

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  passScore?: number;
}
