import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Enrollment, EnrollmentDocument } from './schemas/enrollment.schema';

@Injectable()
export class EnrollmentsService {
  constructor(@InjectModel(Enrollment.name) private model: Model<EnrollmentDocument>) {}

  async enrol(userId: string, courseId: string, level: string) {
    const exists = await this.model.findOne({ userId, courseId, status: { $ne: 'completed' } });
    if (exists) throw new ConflictException('Already enrolled in this course');
    return this.model.create({ userId, courseId, level });
  }

  findMyEnrollments(userId: string) {
    return this.model.find({ userId }).populate('courseId', 'title language').exec();
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
}
