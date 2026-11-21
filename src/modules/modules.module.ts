import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModulesController } from './modules.controller';
import { ModulesService } from './modules.service';
import { CourseModule, CourseModuleSchema } from './schemas/module.schema';
import { CourseAccessModule } from '../common/course-access.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CourseModule.name, schema: CourseModuleSchema }]),
    CourseAccessModule,
  ],
  controllers: [ModulesController],
  providers: [ModulesService],
  exports: [ModulesService],
})
export class ModulesModule {}
