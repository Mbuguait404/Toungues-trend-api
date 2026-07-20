import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CourseModule, ModuleDocument } from './schemas/module.schema';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@Injectable()
export class ModulesService {
  constructor(@InjectModel(CourseModule.name) private model: Model<ModuleDocument>) {}

  findAll(courseId?: string, level?: string) {
    const filter: any = {};
    if (courseId) filter.courseId = new Types.ObjectId(courseId);
    if (level) filter.level = level;
    return this.model.find(filter).sort({ level: 1, order: 1 }).populate('createdBy', 'name email avatarUrl');
  }

  findById(id: string) {
    return this.model.findById(id).populate('createdBy', 'name email avatarUrl');
  }

  create(dto: CreateModuleDto, createdBy: string) {
    return this.model.create({ ...dto, createdBy });
  }

  update(id: string, dto: UpdateModuleDto) {
    return this.model.findByIdAndUpdate(id, dto, { new: true });
  }

  delete(id: string) {
    return this.model.findByIdAndDelete(id);
  }

  countByCourse(courseId: string, level?: string) {
    const filter: any = { courseId: new Types.ObjectId(courseId) };
    if (level) filter.level = level;
    return this.model.countDocuments(filter);
  }
}
