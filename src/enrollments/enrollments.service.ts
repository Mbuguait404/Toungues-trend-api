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
    const course = await this.coursesService.findById(cid.toString());
    if (!course || !course.isActive) throw new NotFoundException('Course not found');
    const exists = await this.model.findOne({ userId: uid, courseId: cid, level, status: { $ne: 'completed' } });
    if (exists) return exists;
    return this.model.create({
      userId: uid,
      courseId: cid,
      level,
      accessStatus: course.accessType === 'free' ? 'free' : 'preview',
    });
  }

  async grantPaidAccess(enrollmentId: string) {
    const enrollment = await this.model.findByIdAndUpdate(
      enrollmentId,
      { $set: { accessStatus: 'paid', paidAt: new Date(), status: 'active' } },
      { new: true },
    );
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }

  async findMyEnrollments(userId: string) {
    const uid = new Types.ObjectId(userId);
    const rows = (await this.model
      .find({ userId: uid })
      .lean()
      .exec()) as any[];

    await this.attachCourseRefs(rows);

    const enriched: any[] = [];
    for (const e of rows) {
      const courseId = e.courseId?._id ?? e.courseId;
      if (!courseId) continue; // course reference could not be resolved
      const total = await this.modulesService.countByCourse(String(courseId), e.level);
      enriched.push({
        ...e,
        totalModules: total,
        completedModulesCount: (e.completedModules ?? []).length,
      });
    }
    return enriched;
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

  findByCourse(courseId: string) {
    return this.model.find({ courseId: new Types.ObjectId(courseId) })
      .populate('userId', 'name email avatarUrl country isActive')
      .populate('courseId', 'title language')
      .sort({ startedAt: -1 })
      .exec();
  }

  findById(id: string) { return this.model.findById(id).populate('courseId userId'); }

  async findByIdForUser(id: string, userId: string, role: string) {
    const enrollment = await this.model.findById(id).populate('courseId userId');
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    const ownerId = (enrollment.userId as any)?._id?.toString() ?? enrollment.userId.toString();
    if (role !== 'ADMIN' && ownerId !== userId) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }

  /**
   * Resolves `courseId` references without Mongoose's populate().
   *
   * populate() builds an `_id: { $in: [...] }` filter and casts every value, so a
   * single legacy row holding a non-ObjectId (e.g. the language string "english")
   * makes the whole query throw a CastError. Here we only pass values that are
   * genuinely ObjectIds, and unresolvable refs become null instead of 500ing.
   */
  private async attachCourseRefs<T extends { courseId: unknown }>(rows: T[]): Promise<T[]> {
    const rawId = (row: T) =>
      row.courseId && typeof row.courseId === 'object' && '_id' in (row.courseId as object)
        ? (row.courseId as { _id: unknown })._id
        : row.courseId;

    const isObjectId = (v: unknown) =>
      v instanceof Types.ObjectId ||
      (typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v));

    const ids = [...new Set(rows.map((r) => String(rawId(r) ?? '')).filter(isObjectId))];
    const courses = ids.length ? await this.coursesService.findByIds(ids) : [];
    const byId = new Map(courses.map((c: any) => [String(c._id), c]));

    for (const row of rows) {
      const id = String(rawId(row) ?? '');
      row.courseId = (isObjectId(id) ? byId.get(id) : null) as T['courseId'];
    }

    return rows;
  }

  findAll(query: any = {}) {
    const { status, page = 1, limit = 20 } = query;
    const filter: any = {};
    if (status) filter.status = status;
    return this.model
      .find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('userId', 'name email avatarUrl country isActive')
      .lean()
      .exec()
      .then((rows) => this.attachCourseRefs(rows as any[]));
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
      partId: { $exists: false },
      materialId: { $exists: false },
    });

    const completedModuleIds = await this.progressModel.find({
      enrollmentId: enrollment._id,
      isCompleted: true,
      partId: { $exists: false },
      materialId: { $exists: false },
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
