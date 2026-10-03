import { IsEnum, IsMongoId, IsString } from 'class-validator';

export class CoursePaymentDto {
  @IsString()
  phoneNumber: string;

  @IsMongoId()
  courseId: string;

  @IsEnum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
  level: string;
}

export class StripeCoursePaymentDto {
  @IsMongoId()
  courseId: string;

  @IsEnum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
  level: string;
}