import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CourseModule, ModuleDocument } from './schemas/module.schema';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { CourseAccessService, CourseAccessLevel } from '../common/course-access.service';

@Injectable()
export class ModulesService {
  constructor(
    @InjectModel(CourseModule.name) private model: Model<ModuleDocument>,
    private courseAccess: CourseAccessService,
  ) {}

  async findAll(courseId?: string, level?: string, userId?: string, role?: string) {
    const filter: any = {};
    if (courseId) filter.courseId = new Types.ObjectId(courseId);
    if (level) filter.level = level;
    if (role === 'LEARNER') filter.isPublished = true;
    const modules = await this.model.find(filter).sort({ level: 1, order: 1 })
      .populate('createdBy', 'name email avatarUrl');
    if (!userId || !role) return modules;
    return Promise.all(modules.map((module) => this.applyAccess(module, userId, role)));
  }

  async findById(id: string, userId?: string, role?: string) {
    const module = await this.model.findById(id).populate('createdBy', 'name email avatarUrl');
    if (!module || !userId || !role) return module;
    if (role === 'LEARNER' && module.isPublished === false) return null;
    return this.applyAccess(module, userId, role);
  }

  private async applyAccess(module: ModuleDocument, userId: string, role: string) {
    const moduleData = module.toObject() as any;
    const access = await this.courseAccess.getAccess(
      userId,
      role,
      String(module.courseId),
      module.level,
    );
    if (access.level === 'full' || module.accessType === 'free') {
      if (moduleData.parts?.length) {
        const { content, ...structuredModule } = moduleData;
        return { ...structuredModule, accessLevel: access.level, locked: false };
      }
      return { ...moduleData, accessLevel: access.level, locked: false };
    }

    const parts = (module.parts ?? []).map((part: any) => {
      if (part.accessType === 'free') return { ...part, locked: false };
      const { content, ...metadata } = part;
      return { ...metadata, locked: true };
    });
    const { content, notes, ...metadata } = moduleData;
    return {
      ...metadata,
      parts,
      accessLevel: access.level as CourseAccessLevel,
      locked: access.level === 'locked' || parts.every((part: any) => part.locked),
    };
  }

  async create(dto: CreateModuleDto, createdBy: string) {
    const hasFreePreview = await this.model.exists({
      courseId: new Types.ObjectId(dto.courseId),
      $or: [{ accessType: 'free' }, { 'parts.accessType': 'free' }],
    });
    const parts = (dto.parts ?? []).map((part, index) => ({
      ...part,
      order: part.order ?? index,
      accessType: part.accessType ?? (!hasFreePreview && index === 0 ? 'free' : 'premium'),
    }));
    return this.model.create({ ...dto, parts, createdBy });
  }

  update(id: string, dto: UpdateModuleDto) {
    return this.model.findByIdAndUpdate(id, dto, { new: true });
  }

  delete(id: string) {
    return this.model.findByIdAndDelete(id);
  }

  countByCourse(courseId: string, level?: string) {
    const filter: any = { courseId: new Types.ObjectId(courseId) };
    if (level) filter.level = level;
    return this.model.countDocuments(filter);
  }
}
