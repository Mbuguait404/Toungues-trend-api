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

  findByModule(moduleId: string) { return this.model.find({ moduleId }).sort({ createdAt: 1 }); }

  async upload(file: Express.Multer.File, dto: any, uploadedBy: string) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `tongues-trend/materials/${dto.courseId}`,
      resource_type: 'auto',
    });
    return this.model.create({
      ...dto, uploadedBy,
      url: result.secure_url,
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
