import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuizAttemptDocument = QuizAttempt & Document;

@Schema({ timestamps: true })
export class QuizAttempt {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Quiz', required: true }) quizId: Types.ObjectId;
  @Prop({ type: [Number], default: [] }) answers: number[];
  @Prop({ default: 0 }) score: number;
  @Prop({ default: false }) passed: boolean;
  @Prop({ default: Date.now }) attemptedAt: Date;
}

export const QuizAttemptSchema = SchemaFactory.createForClass(QuizAttempt);
