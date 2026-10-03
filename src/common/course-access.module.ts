import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema } from '../courses/schemas/course.schema';
import { Enrollment, EnrollmentSchema } from '../enrollments/schemas/enrollment.schema';
import { CourseAccessService } from './course-access.service';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Course.name, schema: CourseSchema },
    { name: Enrollment.name, schema: EnrollmentSchema },
  ])],
  providers: [CourseAccessService],
  exports: [CourseAccessService],
})
export class CourseAccessModule {}