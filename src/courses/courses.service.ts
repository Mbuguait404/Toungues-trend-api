import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course, CourseDocument, Language } from './schemas/course.schema';
import { CreateCourseDto } from './dto/create-course.dto';

@Injectable()
export class CoursesService {
  constructor(@InjectModel(Course.name) private courseModel: Model<CourseDocument>) {}

  findAll() { return this.courseModel.find({ isActive: true }).populate('teacherIds', 'name email avatarUrl'); }
  findById(id: string) { return this.courseModel.findById(id).populate('teacherIds', 'name email avatarUrl'); }
  findByLanguage(language: string) {
    const lang = language.toLowerCase() as Language;
    return this.courseModel.findOne({ language: lang, isActive: true }).populate('teacherIds', 'name email avatarUrl');
  }
  findByTeacher(teacherId: string) {
    return this.courseModel.find({ teacherIds: teacherId, isActive: true }).populate('teacherIds', 'name email avatarUrl');
  }
  create(dto: CreateCourseDto) { return this.courseModel.create(dto as any); }
  update(id: string, dto: Partial<CreateCourseDto>) {
    return this.courseModel.findByIdAndUpdate(id, dto, { new: true });
  }
  async assignTeacher(id: string, teacherId: string) {
    return this.courseModel.findByIdAndUpdate(id, { $addToSet: { teacherIds: teacherId } }, { new: true });
  }
  async removeTeacher(id: string, teacherId: string) {
    return this.courseModel.findByIdAndUpdate(id, { $pull: { teacherIds: teacherId } }, { new: true });
  }
  deactivate(id: string) { return this.courseModel.findByIdAndUpdate(id, { isActive: false }); }
}
