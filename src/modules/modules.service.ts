import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CourseModule, ModuleDocument } from './schemas/module.schema';

@Injectable()
export class ModulesService {
  constructor(@InjectModel(CourseModule.name) private model: Model<ModuleDocument>) {}

  findAll(query: any = {}) {
    const filter: any = {};
    if (query.courseId) filter.courseId = query.courseId;
    if (query.level) filter.level = query.level;
    return this.model.find(filter).sort({ level: 1, order: 1 });
  }
  findById(id: string) { return this.model.findById(id); }
  create(dto: any, createdBy: string) { return this.model.create({ ...dto, createdBy }); }
  update(id: string, dto: any) { return this.model.findByIdAndUpdate(id, dto, { new: true }); }
  delete(id: string) { return this.model.findByIdAndDelete(id); }
  countByCourse(courseId: string) { return this.model.countDocuments({ courseId }); }
}
