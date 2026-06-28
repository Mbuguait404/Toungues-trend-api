import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type MaterialDocument = Material & Document;
@Schema({ timestamps: true })
export class Material {
  @Prop({ type: Types.ObjectId, ref: 'CourseModule', required: true }) moduleId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Course', required: true }) courseId: Types.ObjectId;
  @Prop({ required: true }) title: string;
  @Prop({ required: true, enum: ['pdf','audio','video','quiz'] }) type: string;
  @Prop({ required: true }) url: string;
  @Prop() fileSize?: number;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) uploadedBy: Types.ObjectId;
  @Prop({ default: 0 }) viewCount: number;
}
export const MaterialSchema = SchemaFactory.createForClass(Material);
