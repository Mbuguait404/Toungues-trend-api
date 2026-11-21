import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from '../courses/schemas/course.schema';
import { Enrollment, EnrollmentDocument } from '../enrollments/schemas/enrollment.schema';

export type CourseAccessLevel = 'full' | 'preview' | 'locked';

@Injectable()
export class CourseAccessService {
  constructor(
    @InjectModel(Course.name) private courses: Model<CourseDocument>,
    @InjectModel(Enrollment.name) private enrollments: Model<EnrollmentDocument>,
  ) {}

  async getAccess(userId: string, role: string, courseId: string, level?: string) {
    if (role === 'ADMIN' || role === 'TEACHER') {
      return { level: 'full' as CourseAccessLevel, enrollmentId: undefined };
    }

    const course = await this.courses.findById(courseId).select('accessType').lean();
    if (course?.accessType === 'free') {
      return { level: 'full' as CourseAccessLevel, enrollmentId: undefined };
    }

    const enrollment = await this.enrollments.findOne({
      userId: new Types.ObjectId(userId),
      courseId: new Types.ObjectId(courseId),
      ...(level ? { level } : {}),
    }).select('_id accessStatus status').lean();

    if (!enrollment) return { level: 'preview' as CourseAccessLevel, enrollmentId: undefined };
    if (enrollment.status === 'paused') {
      return { level: 'locked' as CourseAccessLevel, enrollmentId: enrollment._id };
    }
    if (enrollment.accessStatus === 'paid' || enrollment.accessStatus === 'free') {
      return { level: 'full' as CourseAccessLevel, enrollmentId: enrollment._id };
    }
    if (enrollment.accessStatus === 'preview') {
      return { level: 'preview' as CourseAccessLevel, enrollmentId: enrollment._id };
    }

    // Existing active enrollments predate paid access and remain available.
    return { level: 'full' as CourseAccessLevel, enrollmentId: enrollment._id };
  }
}