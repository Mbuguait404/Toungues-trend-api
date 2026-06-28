import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type EnrollmentDocument = Enrollment & Document;
@Schema({ timestamps: true })
export class Enrollment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Course', required: true }) courseId: Types.ObjectId;
  @Prop({ enum: ['A1','A2','B1','B2','C1','C2'], required: true }) level: string;
  @Prop({ enum: ['active','paused','completed'], default: 'active' }) status: string;
  @Prop({ default: 0, min: 0, max: 100 }) progress: number;
  @Prop({ type: [Types.ObjectId], ref: 'CourseModule', default: [] }) completedModules: Types.ObjectId[];
  @Prop({ default: Date.now }) startedAt: Date;
  @Prop() completedAt?: Date;
}
export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
