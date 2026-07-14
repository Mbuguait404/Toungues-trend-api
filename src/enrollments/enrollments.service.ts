import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Enrollment, EnrollmentDocument } from './schemas/enrollment.schema';
import { Progress, ProgressDocument } from '../progress/schemas/progress.schema';
import { ModulesService } from '../modules/modules.service';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name) private model: Model<EnrollmentDocument>,
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
    private modulesService: ModulesService,
    private coursesService: CoursesService,
  ) {}

  async enrol(userId: string, courseId: string, level: string) {
    let cid: Types.ObjectId;
    if (Types.ObjectId.isValid(courseId)) {
      cid = new Types.ObjectId(courseId);
    } else {
      const course = await this.coursesService.findByLanguage(courseId);
      if (!course) throw new BadRequestException(`Invalid course identifier: ${courseId}`);
      cid = course._id as Types.ObjectId;
    }

    const uid = new Types.ObjectId(userId);
    const exists = await this.model.findOne({ userId: uid, courseId: cid, status: { $ne: 'completed' } });
    if (exists) throw new ConflictException('Already enrolled in this course');
    return this.model.create({ userId: uid, courseId: cid, level });
  }

  findMyEnrollments(userId: string) {
    const uid = new Types.ObjectId(userId);
    return this.model.find({ userId: uid }).populate('courseId', 'title language description').exec();
  }

  async findMyLearners(teacherId: string) {
    const teacherCourses = await this.coursesService.findByTeacher(teacherId);
    const courseIds = teacherCourses.map(c => c._id);
    if (courseIds.length === 0) return [];

    return this.model.find({ courseId: { $in: courseIds } })
      .populate('userId', 'name email avatarUrl country isActive')
      .populate('courseId', 'title language')
      .sort({ startedAt: -1 })
      .exec();
  }

  findById(id: string) { return this.model.findById(id).populate('courseId userId'); }

  findAll(query: any = {}) {
    const { status, page = 1, limit = 20 } = query;
    const filter: any = {};
    if (status) filter.status = status;
    return this.model.find(filter).skip((page-1)*limit).limit(Number(limit)).populate('userId courseId');
  }

  async updateStatus(id: string, status: string) {
    return this.model.findByIdAndUpdate(id, { status }, { new: true });
  }

  async markModuleComplete(enrollmentId: string, moduleId: string, totalModules: number) {
    const enrollment = await this.model.findById(enrollmentId);
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (!enrollment.completedModules.some(m => m.toString() === moduleId)) {
      enrollment.completedModules.push(moduleId as any);
    }
    enrollment.progress = Math.round((enrollment.completedModules.length / totalModules) * 100);
    if (enrollment.progress >= 100) {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
    }
    return enrollment.save();
  }

  async updateProgress(id: string) {
    const enrollment = await this.model.findById(id);
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const totalModules = await this.modulesService.countByCourse(enrollment.courseId.toString());
    const completedCount = await this.progressModel.countDocuments({
      enrollmentId: enrollment._id,
      isCompleted: true,
    });

    const completedModuleIds = await this.progressModel.find({
      enrollmentId: enrollment._id,
      isCompleted: true,
    }).distinct('moduleId');

    enrollment.completedModules = completedModuleIds;
    enrollment.progress = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

    if (enrollment.progress >= 100) {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
    }

    return enrollment.save();
  }
}
