import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';
import { Inquiry, InquiryDocument, InquiryStatus } from './schemas/inquiry.schema';

export interface InquiryFilters {
  status?: InquiryStatus;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class InquiriesService {
  constructor(
    @InjectModel(Inquiry.name)
    private readonly inquiryModel: Model<InquiryDocument>,
  ) {}

  async create(dto: CreateInquiryDto): Promise<InquiryDocument> {
    return this.inquiryModel.create(dto);
  }

  async findAll(filters: InquiryFilters = {}): Promise<InquiryDocument[]> {
    const { status, search, page = 1, limit = 50 } = filters;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ name: regex }, { email: regex }, { subject: regex }, { message: regex }];
    }

    return this.inquiryModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .exec();
  }

  async findOne(id: string): Promise<InquiryDocument> {
    const inquiry = await this.inquiryModel.findById(id).exec();
    if (!inquiry) throw new NotFoundException('Inquiry not found');
    return inquiry;
  }

  async update(id: string, dto: UpdateInquiryDto): Promise<InquiryDocument> {
    const update: Record<string, unknown> = { ...dto };
    if (dto.status === InquiryStatus.RESOLVED) {
      update.respondedAt = new Date();
    }

    const inquiry = await this.inquiryModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
    if (!inquiry) throw new NotFoundException('Inquiry not found');
    return inquiry;
  }

  async remove(id: string): Promise<InquiryDocument> {
    const inquiry = await this.inquiryModel.findByIdAndDelete(id).exec();
    if (!inquiry) throw new NotFoundException('Inquiry not found');
    return inquiry;
  }

  async countByStatus(): Promise<Record<InquiryStatus, number>> {
    const grouped = await this.inquiryModel
      .aggregate<{ _id: InquiryStatus; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ])
      .exec();

    const counts = {
      [InquiryStatus.NEW]: 0,
      [InquiryStatus.IN_PROGRESS]: 0,
      [InquiryStatus.RESOLVED]: 0,
      [InquiryStatus.SPAM]: 0,
    };
    for (const entry of grouped) {
      counts[entry._id] = entry.count;
    }
    return counts;
  }
}