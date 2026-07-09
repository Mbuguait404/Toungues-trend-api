import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type MaterialDocument = Material & Document;
@Schema({ timestamps: true })
export class Material {
  @Prop({ type: Types.ObjectId, ref: 'CourseModule', required: false }) moduleId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Course', required: false }) courseId?: Types.ObjectId;
  @Prop({ required: true }) title: string;
  @Prop({ required: false, enum: ['pdf','audio','video','quiz','youtube'] }) type?: string;
  @Prop({ required: true }) fileUrl: string;
  @Prop({ required: false }) fileType?: string;
  @Prop() fileSize?: number;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) uploadedBy: Types.ObjectId;
  @Prop({ default: 0 }) viewCount: number;
}
export const MaterialSchema = SchemaFactory.createForClass(Material);
