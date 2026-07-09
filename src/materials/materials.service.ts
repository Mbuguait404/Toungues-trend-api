import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Material, MaterialDocument } from './schemas/material.schema';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectModel(Material.name) private model: Model<MaterialDocument>,
    private config: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.config.get('cloudinary.cloudName'),
      api_key: this.config.get('cloudinary.apiKey'),
      api_secret: this.config.get('cloudinary.apiSecret'),
    });
  }

  findAll(courseId?: string) { 
    const query = courseId ? { courseId } : {};
    return this.model.find(query).sort({ createdAt: -1 }).populate('uploadedBy', 'name email avatarUrl'); 
  }

  findMyMaterials(userId: string) {
    return this.model.find({ uploadedBy: userId }).sort({ createdAt: -1 }).populate('uploadedBy', 'name email avatarUrl');
  }

  findByModule(moduleId: string) { return this.model.find({ moduleId }).sort({ createdAt: 1 }); }

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

  async incrementView(id: string) {
    return this.model.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }, { new: true });
  }
}
