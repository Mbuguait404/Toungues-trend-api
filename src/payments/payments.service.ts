import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { randomUUID } from 'node:crypto';
import Stripe from 'stripe';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { CoursesService } from '../courses/courses.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Payment.name) private model: Model<PaymentDocument>,
    private config: ConfigService,
    private coursesService: CoursesService,
    private enrollmentsService: EnrollmentsService,
  ) {
    this.stripe = new Stripe(this.config.get<string>('stripe.secretKey') as string, { apiVersion: '2023-10-16' as any });
  }

  private getPayHeroHeaders() {
    const token = this.config.get<string>('payhero.authToken');
    if (!token) {
      throw new ServiceUnavailableException('PayHero is not configured');
    }

    return {
      Authorization: token.startsWith('Basic ') ? token : `Basic ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async initiatePayHero(userId: string, dto: { phoneNumber: string; courseId: string; level: string }) {
    if (!/^(?:\+?254|0)?[17]\d{8}$/.test(dto.phoneNumber)) {
      throw new BadRequestException('phoneNumber must be a valid Kenyan mobile number');
    }

    const course = await this.coursesService.findById(dto.courseId);
    if (!course || !course.isActive) throw new BadRequestException('Course is unavailable');
    if (course.accessType === 'free') throw new BadRequestException('This course does not require payment');
    if (!Number.isSafeInteger(course.price) || !course.price || course.price <= 0) {
      throw new ServiceUnavailableException('This course has no valid price configured');
    }
    if ((course.currency ?? 'KES') !== 'KES') {
      throw new BadRequestException('PayHero checkout is only available for KES-priced courses');
    }
    if (!course.levels.includes(dto.level as any)) throw new BadRequestException('Invalid course level');

    const channelId = Number(this.config.get<string>('payhero.channelId'));
    const apiUrl = this.config.get<string>('apiUrl')?.replace(/\/$/, '');
    if (!Number.isSafeInteger(channelId) || channelId <= 0 || !apiUrl) {
      throw new ServiceUnavailableException('PayHero is not fully configured');
    }
    const headers = this.getPayHeroHeaders();
    const enrollment = await this.enrollmentsService.enrol(userId, dto.courseId, dto.level);
    if (enrollment.accessStatus === 'paid' || enrollment.accessStatus === 'free' || !enrollment.accessStatus) {
      throw new BadRequestException('This enrollment already has full access');
    }

    const externalReference = randomUUID();
    const payment = await this.model.create({
      userId,
      courseId: course._id,
      enrollmentId: enrollment._id,
      level: dto.level,
      purchaseType: 'course',
      amount: course.price,
      currency: course.currency ?? 'KES',
      method: 'payhero',
      status: 'pending',
      reference: externalReference,
      externalReference,
    });

    try {
      const { data } = await axios.post('https://backend.payhero.co.ke/api/v2/payments', {
        amount: course.price,
        phone_number: dto.phoneNumber,
        channel_id: channelId,
        provider: 'm-pesa',
        external_reference: externalReference,
        customer_name: undefined,
        callback_url: `${apiUrl}/api/v1/payments/payhero/callback`,
      }, { headers });

      if (!data?.success || !data?.reference) {
        await this.model.findByIdAndUpdate(payment._id, { status: 'failed' });
        throw new ServiceUnavailableException('PayHero did not accept the payment request');
      }

      await this.model.findByIdAndUpdate(payment._id, {
        reference: data.reference,
        checkoutRequestId: data.CheckoutRequestID,
      });
      return { ...data, paymentId: payment._id.toString() };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response && error.response.status < 500) {
        await this.model.findByIdAndUpdate(payment._id, { status: 'failed' });
      }
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException('Unable to initiate payment with PayHero');
    }
  }

  async handlePayHeroCallback(body: any) {
    const callback = body?.response;
    const externalReference = callback?.ExternalReference;
    if (typeof externalReference !== 'string' || !externalReference) {
      throw new BadRequestException('Invalid PayHero callback');
    }

    const payment = await this.model.findOne({ externalReference });
    if (!payment) return { received: true };
    if (payment.status === 'success') {
      if (payment.enrollmentId) await this.enrollmentsService.grantPaidAccess(payment.enrollmentId.toString());
      return { received: true };
    }
    if (payment.status !== 'pending') return { received: true };
    if (callback.Amount == null || Number(callback.Amount) !== payment.amount) {
      throw new ServiceUnavailableException('PayHero callback amount does not match the expected amount');
    }

    const { data } = await axios.get('https://backend.payhero.co.ke/api/v2/transaction-status', {
      params: { reference: payment.reference },
      headers: this.getPayHeroHeaders(),
    });

    if (data?.reference !== payment.reference) {
      throw new ServiceUnavailableException('Could not verify PayHero transaction');
    }
    const confirmedAmount = data.amount ?? data.Amount;
    if (confirmedAmount != null && Number(confirmedAmount) !== payment.amount) {
      throw new ServiceUnavailableException('PayHero transaction amount does not match the expected amount');
    }

    const status = data.status === 'SUCCESS' ? 'success' : data.status === 'FAILED' ? 'failed' : null;
    if (status) {
      const result = await this.model.updateOne(
        { _id: payment._id, status: 'pending' },
        { status },
      );
      if (status === 'success' && payment.enrollmentId) {
        const current = result.modifiedCount
          ? { status: 'success' }
          : await this.model.findById(payment._id).select('status').lean();
        if (current?.status === 'success') {
          await this.enrollmentsService.grantPaidAccess(payment.enrollmentId.toString());
        }
      }
    }
    return { received: true };
  }

  async createStripeIntent(userId: string, dto: { courseId: string; level: string }) {
    const course = await this.coursesService.findById(dto.courseId);
    if (!course || !course.isActive || course.accessType === 'free') {
      throw new BadRequestException('Paid course not found');
    }
    if (!Number.isSafeInteger(course.price) || !course.price || course.price <= 0) {
      throw new ServiceUnavailableException('This course has no valid price configured');
    }
    if (!course.levels.includes(dto.level as any)) throw new BadRequestException('Invalid course level');
    const enrollment = await this.enrollmentsService.enrol(userId, dto.courseId, dto.level);
    if (enrollment.accessStatus === 'paid' || enrollment.accessStatus === 'free' || !enrollment.accessStatus) {
      throw new BadRequestException('This enrollment already has full access');
    }
    const intent = await this.stripe.paymentIntents.create({
      amount: course.price * 100,
      currency: (course.currency ?? 'KES').toLowerCase(),
      metadata: { userId, courseId: dto.courseId, enrollmentId: enrollment._id.toString() },
    });
    await this.model.create({
      userId,
      courseId: course._id,
      enrollmentId: enrollment._id,
      level: dto.level,
      purchaseType: 'course',
      amount: course.price,
      currency: course.currency ?? 'KES',
      method: 'stripe',
      status: 'pending',
      reference: intent.id,
    });
    return { clientSecret: intent.client_secret };
  }

  async handleStripeWebhook(payload: Buffer, signature: string) {
    const event = this.stripe.webhooks.constructEvent(
      payload, signature, this.config.get<string>('stripe.webhookSecret') as string,
    );
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const payment = await this.model.findOne({ reference: intent.id });
      if (payment?.status === 'pending') {
        await this.model.updateOne({ _id: payment._id, status: 'pending' }, { status: 'success' });
      }
      if (payment?.enrollmentId && (payment.status === 'pending' || payment.status === 'success')) {
        await this.enrollmentsService.grantPaidAccess(payment.enrollmentId.toString());
      }
    }
  }

  findMyPayments(userId: string) {
    return this.model.find({ userId }).populate('courseId', 'title language')
      .sort({ createdAt: -1 });
  }

  findMyPaymentById(id: string, userId: string) {
    return this.model.findOne({ _id: id, userId })
      .populate('courseId', 'title language');
  }

  findAll(query: any = {}) {
    const { status, method, page = 1, limit = 20 } = query;
    const filter: any = {};
    if (status) filter.status = String(status).toLowerCase();
    if (method) filter.method = String(method).toLowerCase();
    return this.model.find(filter).skip((page-1)*limit).limit(Number(limit))
      .populate('userId', 'name email')
      .populate('courseId', 'title language')
      .sort({ createdAt: -1 });
  }
}
