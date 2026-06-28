import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type SessionDocument = Session & Document;
@Schema({ timestamps: true })
export class Session {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) learnerId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) teacherId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Course', required: true }) courseId: Types.ObjectId;
  @Prop({ required: true }) scheduledAt: Date;
  @Prop({ default: 60 }) duration: number;
  @Prop() zoomLink?: string;
  @Prop({ enum: ['booked','completed','cancelled'], default: 'booked' }) status: string;
  @Prop() notes?: string;
}
export const SessionSchema = SchemaFactory.createForClass(Session);
