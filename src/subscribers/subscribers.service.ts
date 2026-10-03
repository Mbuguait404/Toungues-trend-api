import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { Subscriber, SubscriberDocument } from './schemas/subscriber.schema';

export interface SubscribeResult {
  subscriber: SubscriberDocument;
  created: boolean;
}

@Injectable()
export class SubscribersService {
  constructor(
    @InjectModel(Subscriber.name)
    private readonly subscriberModel: Model<SubscriberDocument>,
  ) {}

  /**
   * Idempotent subscribe — re-subscribing an existing address is not an error,
   * it just returns the original record. Honeypot hits are swallowed silently so
   * bots get no signal that they were detected.
   */
  async subscribe(dto: CreateSubscriberDto): Promise<SubscribeResult> {
    if (dto.website) {
      const decoy = await this.subscriberModel
        .findOneAndUpdate(
          { email: 'honeypot@invalid.local' },
          { $setOnInsert: { email: 'honeypot@invalid.local' } },
          { upsert: true, new: true },
        )
        .exec();
      return { subscriber: decoy, created: false };
    }

    const existing = await this.subscriberModel.findOne({ email: dto.email }).exec();
    if (existing) return { subscriber: existing, created: false };

    const subscriber = await this.subscriberModel.create({ email: dto.email });
    return { subscriber, created: true };
  }

  async findAll(page = 1, limit = 100): Promise<SubscriberDocument[]> {
    return this.subscriberModel
      .find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .exec();
  }

  async count(): Promise<number> {
    return this.subscriberModel.countDocuments().exec();
  }

  async remove(id: string): Promise<SubscriberDocument> {
    const subscriber = await this.subscriberModel.findByIdAndDelete(id).exec();
    if (!subscriber) throw new NotFoundException('Subscriber not found');
    return subscriber;
  }
}