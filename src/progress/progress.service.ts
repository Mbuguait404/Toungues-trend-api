import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Progress, ProgressDocument } from './schemas/progress.schema';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { CourseAccessService } from '../common/course-access.service';
import { CourseModule, ModuleDocument } from '../modules/schemas/module.schema';
import { Material, MaterialDocument } from '../materials/schemas/material.schema';

@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
    @InjectModel(CourseModule.name) private modules: Model<ModuleDocument>,
    @InjectModel(Material.name) private materials: Model<MaterialDocument>,
    private enrollmentsService: EnrollmentsService,
    private courseAccess: CourseAccessService,
  ) {}

  async updateProgress(
    userId: string,
    enrollmentId: string,
    dto: UpdateProgressDto,
  ): Promise<Progress> {
    // Ensure enrollment belongs to user
    const enrollment = await this.enrollmentsService.findById(enrollmentId);
    const ownerId = (enrollment as any)?.userId?._id?.toString() ?? (enrollment as any)?.userId?.toString();
    if (!enrollment || ownerId !== userId) {
      throw new NotFoundException('Enrollment not found');
    }

    const enrollmentData = enrollment as any;
    const courseId = enrollmentData.courseId?._id?.toString() ?? enrollmentData.courseId.toString();
    const access = await this.courseAccess.getAccess(userId, 'LEARNER', courseId, enrollmentData.level);
    const module = await this.modules.findById(dto.moduleId).select('courseId accessType parts').lean();
    if (!module || module.courseId.toString() !== courseId) throw new NotFoundException('Module not found');
    if (access.level === 'locked' && module.accessType !== 'free') {
      throw new ForbiddenException('This course content is locked');
    }
    const updateData: any = {};
    if (dto.partId) {
      const part = module.parts?.find((item: any) => item._id?.toString() === dto.partId);
      if (!part) throw new NotFoundException('Lesson part not found');
      if (access.level !== 'full' && module.accessType !== 'free' && part.accessType !== 'free') {
        throw new ForbiddenException('This lesson part is locked');
      }
    }
    if (dto.materialId) {
      const material = await this.materials.findById(dto.materialId).lean();
      if (!material || material.moduleId?.toString() !== dto.moduleId) {
        throw new NotFoundException('Material not found');
      }
      const linkedFreePart = Boolean(material.partId && module.parts?.some(
        (part: any) => part._id?.toString() === material.partId?.toString() && part.accessType === 'free',
      ));
      if (access.level !== 'full' && module.accessType !== 'free' && material.accessType !== 'free' && !linkedFreePart) {
        throw new ForbiddenException('This learning resource is locked');
      }
      updateData.eventType = 'viewed';
    }

    if (dto.isCompleted !== undefined) {
      updateData.isCompleted = dto.isCompleted;
      if (dto.isCompleted) {
        updateData.completedAt = new Date();
      }
    }
    if (dto.score !== undefined) {
      updateData.score = dto.score;
    }
    if (dto.partId) updateData.eventType = dto.isCompleted ? 'completed' : 'viewed';

    const progress = await this.progressModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        enrollmentId: new Types.ObjectId(enrollmentId),
        moduleId: new Types.ObjectId(dto.moduleId),
        ...(dto.partId ? { partId: new Types.ObjectId(dto.partId) } : { partId: { $exists: false } }),
        ...(dto.materialId ? { materialId: new Types.ObjectId(dto.materialId) } : { materialId: { $exists: false } }),
      },
      {
        $set: updateData,
        $setOnInsert: {
          userId: new Types.ObjectId(userId),
          enrollmentId: new Types.ObjectId(enrollmentId),
          moduleId: new Types.ObjectId(dto.moduleId),
        },
      },
      { new: true, upsert: true },
    );

    // If marked as completed, update the overall enrollment progress
    if (dto.isCompleted && !dto.partId && !dto.materialId) {
      await this.enrollmentsService.updateProgress(enrollmentId);
    }

    return progress;
  }

  async getEnrollmentProgress(
    userId: string,
    enrollmentId: string,
  ): Promise<Progress[]> {
    return this.progressModel.find({
      userId: new Types.ObjectId(userId),
      enrollmentId: new Types.ObjectId(enrollmentId),
    }).exec();
  }
}
