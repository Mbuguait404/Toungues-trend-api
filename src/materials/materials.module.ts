import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { Material, MaterialSchema } from './schemas/material.schema';
import { CourseModule, CourseModuleSchema } from '../modules/schemas/module.schema';
import { CourseAccessModule } from '../common/course-access.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Material.name, schema: MaterialSchema },
      { name: CourseModule.name, schema: CourseModuleSchema },
    ]),
    CourseAccessModule,
    MulterModule.register({ dest: '/tmp/uploads' }),
  ],
  controllers: [MaterialsController],
  providers: [MaterialsService],
  exports: [MaterialsService],
})
export class MaterialsModule {}
