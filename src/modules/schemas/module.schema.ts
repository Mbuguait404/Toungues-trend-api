import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type ModuleDocument = CourseModule & Document;
@Schema({ timestamps: true })
export class CourseModule {
  @Prop({ type: Types.ObjectId, ref: 'Course', required: true }) courseId: Types.ObjectId;
  @Prop({ required: true }) title: string;
  @Prop({ enum: ['A1','A2','B1','B2','C1','C2'], required: true }) level: string;
  @Prop({ required: true, default: 0 }) order: number;
  @Prop() description?: string;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) createdBy: Types.ObjectId;
}
export const CourseModuleSchema = SchemaFactory.createForClass(CourseModule);
