import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course, CourseDocument, Language } from './schemas/course.schema';
import { CreateCourseDto } from './dto/create-course.dto';

@Injectable()
export class CoursesService {
  constructor(@InjectModel(Course.name) private courseModel: Model<CourseDocument>) {}

  findAll() { return this.courseModel.find({ isActive: true }).populate('teacherIds', 'name email avatarUrl'); }
  findById(id: string) { return this.courseModel.findById(id).populate('teacherIds', 'name email avatarUrl'); }
  findByIds(ids: string[]) {
    return this.courseModel.find({ _id: { $in: ids } }).populate('teacherIds', 'name email avatarUrl');
  }
  findByLanguage(language: string) {
    const lang = language.toLowerCase() as Language;
    return this.courseModel.findOne({ language: lang, isActive: true }).populate('teacherIds', 'name email avatarUrl');
  }
  findByTeacher(teacherId: string) {
    return this.courseModel.find({ teacherIds: teacherId, isActive: true }).populate('teacherIds', 'name email avatarUrl');
  }
  async create(dto: CreateCourseDto) {
    const accessType = dto.accessType ?? 'paid';
    if (accessType === 'paid' && (dto.price == null || !Number.isSafeInteger(dto.price) || dto.price <= 0)) {
      throw new BadRequestException('A positive whole-number price is required for paid courses');
    }
    return this.courseModel.create({ ...dto, accessType, currency: dto.currency ?? 'KES' });
  }

  async update(id: string, dto: Partial<CreateCourseDto>) {
    const course = await this.courseModel.findById(id);
    if (!course) throw new NotFoundException('Course not found');

    const accessType = dto.accessType ?? course.accessType ?? 'paid';
    const price = dto.price ?? course.price;
    if (accessType === 'paid' && (price == null || !Number.isSafeInteger(price) || price <= 0)) {
      throw new BadRequestException('A positive whole-number price is required for paid courses');
    }
    return this.courseModel.findByIdAndUpdate(
      id,
      { ...dto, accessType },
      { new: true, runValidators: true },
    );
  }
  async assignTeacher(id: string, teacherId: string) {
    return this.courseModel.findByIdAndUpdate(id, { $addToSet: { teacherIds: teacherId } }, { new: true });
  }
  async removeTeacher(id: string, teacherId: string) {
    return this.courseModel.findByIdAndUpdate(id, { $pull: { teacherIds: teacherId } }, { new: true });
  }
  deactivate(id: string) { return this.courseModel.findByIdAndUpdate(id, { isActive: false }); }
}
