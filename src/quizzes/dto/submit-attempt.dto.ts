import { IsArray, IsNumber } from 'class-validator';

export class SubmitAttemptDto {
  @IsArray()
  @IsNumber({}, { each: true })
  answers: number[];
}
