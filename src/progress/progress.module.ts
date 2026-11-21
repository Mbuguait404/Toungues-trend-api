import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { Progress, ProgressSchema } from './schemas/progress.schema';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { CourseModule, CourseModuleSchema } from '../modules/schemas/module.schema';
import { CourseAccessModule } from '../common/course-access.module';
import { Material, MaterialSchema } from '../materials/schemas/material.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Progress.name, schema: ProgressSchema },
      { name: CourseModule.name, schema: CourseModuleSchema },
      { name: Material.name, schema: MaterialSchema },
    ]),
    EnrollmentsModule,
    CourseAccessModule,
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
