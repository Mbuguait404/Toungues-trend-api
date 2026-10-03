import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Material, MaterialDocument } from './schemas/material.schema';
import { CourseModule, ModuleDocument } from '../modules/schemas/module.schema';
import { CourseAccessService } from '../common/course-access.service';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectModel(Material.name) private model: Model<MaterialDocument>,
    @InjectModel(CourseModule.name) private modules: Model<ModuleDocument>,
    private config: ConfigService,
    private courseAccess: CourseAccessService,
  ) {
    cloudinary.config({
      cloud_name: this.config.get('cloudinary.cloudName'),
      api_key: this.config.get('cloudinary.apiKey'),
      api_secret: this.config.get('cloudinary.apiSecret'),
    });
  }

  async findAll(courseId?: string, moduleId?: string, userId?: string, role?: string) {
    const query: any = {};
    if (courseId) query.courseId = courseId;
    if (moduleId) query.moduleId = moduleId;
    const materials = await this.model.find(query).sort({ createdAt: -1 })
      .populate('uploadedBy', 'name email avatarUrl');
    if (!userId || !role) return materials;
    return Promise.all(materials.map((material) => this.applyAccess(material, userId, role)));
  }

  findMyMaterials(userId: string) {
    return this.model.find({ uploadedBy: userId }).sort({ createdAt: -1 }).populate('uploadedBy', 'name email avatarUrl');
  }

  async findByModule(moduleId: string, userId?: string, role?: string) {
    const materials = await this.model.find({ moduleId }).sort({ createdAt: 1 });
    if (!userId || !role) return materials;
    return Promise.all(materials.map((material) => this.applyAccess(material, userId, role)));
  }

  private async applyAccess(material: MaterialDocument, userId: string, role: string) {
    const data = material.toObject() as any;
    if (role === 'ADMIN' || role === 'TEACHER') {
      return { ...data, fileUrl: this.getDownloadUrl(material), locked: false };
    }

    const parentModule = material.moduleId
      ? await this.modules.findById(material.moduleId).select('courseId level accessType parts isPublished').lean()
      : null;
    if (parentModule && !parentModule.isPublished) {
      return { ...data, fileUrl: undefined, locked: true };
    }
    if (material.accessType === 'free') {
      return { ...data, fileUrl: this.getDownloadUrl(material), locked: false };
    }
    const courseId = material.courseId?.toString() ?? parentModule?.courseId?.toString();
    if (!courseId) return { ...data, fileUrl: undefined, locked: true };

    const access = await this.courseAccess.getAccess(userId, role, courseId, parentModule?.level);
    const freePart = Boolean(material.partId && parentModule?.parts?.some(
      (part: any) => part._id?.toString() === material.partId?.toString() && part.accessType === 'free',
    ));
    const isLocked = access.level === 'locked' ||
      (access.level !== 'full' && parentModule?.accessType !== 'free' && !freePart);
    return { ...data, fileUrl: isLocked ? undefined : this.getDownloadUrl(material), locked: isLocked };
  }

  private getDownloadUrl(material: MaterialDocument) {
    if (!material.cloudinaryPublicId) return material.fileUrl;
    return cloudinary.utils.private_download_url(
      material.cloudinaryPublicId,
      material.cloudinaryFormat ?? '',
      {
        type: 'authenticated',
        resource_type: material.cloudinaryResourceType as 'image' | 'video' | 'raw' | undefined,
        expires_at: Math.floor(Date.now() / 1000) + 300,
        attachment: true,
      },
    );
  }

  async upload(file: Express.Multer.File | undefined, dto: any, uploadedBy: string) {
    if (!file && dto.youtubeUrl) {
      return this.model.create({
        ...dto,
        uploadedBy,
        type: 'youtube',
        fileUrl: dto.youtubeUrl,
        fileType: 'youtube',
      });
    }

    if (!file) throw new Error('File is required for non-youtube materials');

    const folderPath = dto.courseId ? `tongues-trend/materials/${dto.courseId}` : `tongues-trend/materials/general`;
    const result = await cloudinary.uploader.upload(file.path, {
      folder: folderPath,
      resource_type: 'auto',
      type: 'authenticated',
      access_mode: 'authenticated',
    });
    
    let derivedType = dto.type;
    if (!derivedType) {
      if (file.mimetype.includes('audio')) derivedType = 'audio';
      else if (file.mimetype.includes('video')) derivedType = 'video';
      else derivedType = 'pdf';
    }

    return this.model.create({
      ...dto, 
      uploadedBy,
      type: derivedType,
      fileUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
      cloudinaryFormat: result.format,
      cloudinaryResourceType: result.resource_type,
      fileType: file.mimetype,
      fileSize: result.bytes,
    });
  }

  update(id: string, dto: any) { return this.model.findByIdAndUpdate(id, dto, { new: true }); }

  async delete(id: string) {
    const material = await this.model.findByIdAndDelete(id);
    if (!material) throw new NotFoundException('Material not found');
    return material;
  }

  async incrementView(id: string, userId: string, role: string) {
    const material = await this.model.findById(id);
    if (!material) throw new NotFoundException('Material not found');
    const visible = await this.applyAccess(material, userId, role);
    if (visible.locked) throw new NotFoundException('Material not found');
    const updated = await this.model.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }, { new: true });
    return updated ? this.applyAccess(updated, userId, role) : null;
  }
}
