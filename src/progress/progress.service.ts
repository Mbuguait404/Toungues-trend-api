import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Progress, ProgressDocument } from './schemas/progress.schema';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { EnrollmentsService } from '../enrollments/enrollments.service';

@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
    private enrollmentsService: EnrollmentsService,
  ) {}

  async updateProgress(
    userId: string,
    enrollmentId: string,
    dto: UpdateProgressDto,
  ): Promise<Progress> {
    // Ensure enrollment belongs to user
    const enrollment = await this.enrollmentsService.findById(enrollmentId);
    if (!enrollment || (enrollment as any).userId.toString() !== userId) {
      throw new NotFoundException('Enrollment not found');
    }

    const updateData: any = {};
    if (dto.isCompleted !== undefined) {
      updateData.isCompleted = dto.isCompleted;
      if (dto.isCompleted) {
        updateData.completedAt = new Date();
      }
    }
    if (dto.score !== undefined) {
      updateData.score = dto.score;
    }

    const progress = await this.progressModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        enrollmentId: new Types.ObjectId(enrollmentId),
        moduleId: new Types.ObjectId(dto.moduleId),
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
    if (dto.isCompleted) {
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
