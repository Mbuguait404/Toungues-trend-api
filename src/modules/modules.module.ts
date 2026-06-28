import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModulesController } from './modules.controller';
import { ModulesService } from './modules.service';
import { CourseModule, CourseModuleSchema } from './schemas/module.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: CourseModule.name, schema: CourseModuleSchema }])],
  controllers: [ModulesController],
  providers: [ModulesService],
  exports: [ModulesService],
})
export class ModulesModule {}
