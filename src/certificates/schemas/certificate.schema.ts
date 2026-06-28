import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type CertificateDocument = Certificate & Document;
@Schema({ timestamps: true })
export class Certificate {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Course', required: true }) courseId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Enrollment', required: true }) enrollmentId: Types.ObjectId;
  @Prop({ required: true, enum: ['A1','A2','B1','B2','C1','C2'] }) level: string;
  @Prop({ required: true, unique: true }) verificationCode: string;
  @Prop({ required: true }) downloadUrl: string;
  @Prop({ default: Date.now }) issuedAt: Date;
}
export const CertificateSchema = SchemaFactory.createForClass(Certificate);
