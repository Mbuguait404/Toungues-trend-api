import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type PaymentDocument = Payment & Document;
@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Course' }) courseId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Enrollment' }) enrollmentId?: Types.ObjectId;
  @Prop() level?: string;
  @Prop({ enum: ['course'], default: 'course' }) purchaseType?: string;
  @Prop({ required: true }) amount: number;
  @Prop({ required: true, enum: ['KES','EUR','CHF','USD'] }) currency: string;
  @Prop({ required: true, enum: ['payhero','stripe'] }) method: string;
  @Prop({ required: true, enum: ['pending','success','failed'], default: 'pending' }) status: string;
  @Prop({ required: true }) reference: string;
  @Prop() externalReference?: string;
  @Prop() checkoutRequestId?: string;
  @Prop() receiptUrl?: string;
}
export const PaymentSchema = SchemaFactory.createForClass(Payment);
