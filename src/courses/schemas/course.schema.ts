import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CourseDocument = Course & Document;
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type Language = 'french' | 'english' | 'german' | 'kiswahili';

@Schema({ timestamps: true })
export class Course {
  @Prop({ required: true }) title: string;
  @Prop({ required: true, enum: ['french','english','german','kiswahili'] }) language: Language;
  @Prop({ required: true }) description: string;
  @Prop({ type: [String], enum: ['A1','A2','B1','B2','C1','C2'], default: [] }) levels: CEFRLevel[];
  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] }) teacherIds: Types.ObjectId[];
  @Prop({ default: true }) isActive: boolean;
}
export const CourseSchema = SchemaFactory.createForClass(Course);
