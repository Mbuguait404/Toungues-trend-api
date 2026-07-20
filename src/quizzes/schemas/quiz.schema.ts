import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class QuizQuestion {
  @Prop({ required: true }) questionText: string;
  @Prop({ type: [String], required: true }) options: string[];
  @Prop({ required: true }) correctIndex: number;
  @Prop() explanation?: string;
}

const QuizQuestionSchema = SchemaFactory.createForClass(QuizQuestion);

export type QuizDocument = Quiz & Document;

@Schema({ timestamps: true })
export class Quiz {
  @Prop({ type: Types.ObjectId, ref: 'CourseModule', required: true }) moduleId: Types.ObjectId;
  @Prop({ required: true }) title: string;
  @Prop({ type: [QuizQuestionSchema], default: [] }) questions: QuizQuestion[];
  @Prop({ default: 70, min: 0, max: 100 }) passScore: number;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) createdBy: Types.ObjectId;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
