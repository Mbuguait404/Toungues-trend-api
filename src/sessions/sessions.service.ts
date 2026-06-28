import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './schemas/session.schema';

@Injectable()
export class SessionsService {
  constructor(@InjectModel(Session.name) private model: Model<SessionDocument>) {}

  book(learnerId: string, dto: any) {
    return this.model.create({ learnerId, ...dto });
  }

  findMySessions(userId: string) {
    return this.model.find({
      $or: [{ learnerId: userId }, { teacherId: userId }],
      status: 'booked',
      scheduledAt: { $gte: new Date() },
    }).populate('learnerId teacherId courseId', 'name email language title').sort({ scheduledAt: 1 });
  }

  findAll(query: any = {}) {
    const { status, page = 1, limit = 20 } = query;
    const filter: any = {};
    if (status) filter.status = status;
    return this.model.find(filter).skip((page-1)*limit).limit(Number(limit))
      .populate('learnerId teacherId courseId', 'name email language title').sort({ scheduledAt: -1 });
  }

  getAvailability(teacherId: string, date: string) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 7);
    return this.model.find({ teacherId, scheduledAt: { $gte: start, $lte: end }, status: 'booked' });
  }

  async cancel(id: string) {
    const session = await this.model.findByIdAndUpdate(id, { status: 'cancelled' }, { new: true });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async addNotes(id: string, notes: string) {
    return this.model.findByIdAndUpdate(id, { notes, status: 'completed' }, { new: true });
  }
}
