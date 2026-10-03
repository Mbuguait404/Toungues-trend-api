import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
export type ModuleDocument = CourseModule & Document;

const ModulePartSchema = new MongooseSchema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  order: { type: Number, required: true, default: 0 },
  accessType: { type: String, enum: ['free', 'premium'], default: 'premium' },
});

export interface ModulePart {
  _id?: Types.ObjectId;
  title: string;
  content: string;
  order: number;
  accessType: 'free' | 'premium';
}

@Schema({ timestamps: true })
export class CourseModule {
  @Prop({ type: Types.ObjectId, ref: 'Course', required: true }) courseId: Types.ObjectId;
  @Prop({ required: true }) title: string;
  @Prop({ enum: ['A1','A2','B1','B2','C1','C2'], required: true }) level: string;
  @Prop({ required: true, default: 0 }) order: number;
  @Prop() description?: string;
  @Prop() content?: string;
  @Prop({ type: [ModulePartSchema], default: [] }) parts: ModulePart[];
  @Prop({ enum: ['free', 'premium'], default: 'premium' }) accessType: 'free' | 'premium';
  @Prop({ type: [String], default: [] }) objectives: string[];
  @Prop({ default: 0 }) estimatedDuration: number;
  @Prop({ type: [Types.ObjectId], ref: 'CourseModule', default: [] }) prerequisiteModuleIds: Types.ObjectId[];
  @Prop() coverImageUrl?: string;
  @Prop() notes?: string;
  @Prop({ default: true }) isPublished: boolean;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) createdBy: Types.ObjectId;
}
export const CourseModuleSchema = SchemaFactory.createForClass(CourseModule);
