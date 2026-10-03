import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InquiryDocument = Inquiry & Document;

export enum InquiryStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  SPAM = 'SPAM',
}

@Schema({ timestamps: true })
export class Inquiry {
  @Prop({ required: true, trim: true }) name: string;
  @Prop({ required: true, trim: true, lowercase: true }) email: string;
  @Prop({ required: true, trim: true }) subject: string;
  @Prop({ required: true, trim: true }) message: string;
  @Prop({ enum: InquiryStatus, default: InquiryStatus.NEW, index: true })
  status: InquiryStatus;
  @Prop({ default: '' }) adminNotes: string;
  @Prop() respondedAt?: Date;
}

export const InquirySchema = SchemaFactory.createForClass(Inquiry);

InquirySchema.index({ createdAt: -1 });