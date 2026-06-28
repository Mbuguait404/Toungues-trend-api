import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum Role {
  LEARNER = 'LEARNER',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true }) name: string;
  @Prop({ required: true, unique: true, lowercase: true, index: true }) email: string;
  @Prop({ required: true, select: false }) password: string;
  @Prop({ required: true, enum: Role, default: Role.LEARNER }) role: Role;
  @Prop() avatarUrl?: string;
  @Prop() country?: string;
  @Prop() phone?: string;
  @Prop({ select: false }) refreshToken?: string;
  @Prop({ default: true }) isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
