import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Enrollment, EnrollmentDocument } from './schemas/enrollment.schema';

@Injectable()
export class EnrollmentsService {
  constructor(@InjectModel(Enrollment.name) private model: Model<EnrollmentDocument>) {}

  async enrol(userId: string, courseId: string, level: string) {
    const uid = new Types.ObjectId(userId);
    const cid = new Types.ObjectId(courseId);
    const exists = await this.model.findOne({ userId: uid, courseId: cid, status: { $ne: 'completed' } });
    if (exists) throw new ConflictException('Already enrolled in this course');
    return this.model.create({ userId: uid, courseId: cid, level });
  }

  findMyEnrollments(userId: string) {
    const uid = new Types.ObjectId(userId);
    return this.model.find({ userId: uid }).populate('courseId', 'title language description').exec();
  }

  async findMyLearners(teacherId: string) {
    const enrollments = await this.model.find()
      .populate({
        path: 'courseId',
        match: { teacherIds: teacherId },
        select: 'title language'
      })
      .populate('userId', 'name email avatarUrl country isActive')
      .sort({ startedAt: -1 })
      .exec();

    // Only return enrollments for courses taught by this teacher
    return enrollments.filter(e => e.courseId !== null);
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
    // This is called by ProgressService when a module is completed.
    // Progress calculation could be implemented here if needed.
    return this.model.findById(id);
  }
}
