import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import Stripe from 'stripe';
import { Payment, PaymentDocument } from './schemas/payment.schema';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe;

  constructor(
    @InjectModel(Payment.name) private model: Model<PaymentDocument>,
    private config: ConfigService,
  ) {
    this.stripe = new Stripe(this.config.get<string>('stripe.secretKey') as string, { apiVersion: '2023-10-16' as any });
  }

  async getMpesaToken(): Promise<string> {
    const key = this.config.get('mpesa.consumerKey');
    const secret = this.config.get('mpesa.consumerSecret');
    const env = this.config.get('mpesa.env');
    const baseUrl = env === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
    const auth = Buffer.from(`${key}:${secret}`).toString('base64');
    const { data } = await axios.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${auth}` } });
    return data.access_token;
  }

  async initiateMpesa(userId: string, dto: { phoneNumber: string; amount: number; courseTitle: string }) {
    const token = await this.getMpesaToken();
    const env = this.config.get('mpesa.env');
    const baseUrl = env === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
    const shortcode = this.config.get('mpesa.shortcode');
    const passkey = this.config.get('mpesa.passkey');
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const { data } = await axios.post(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: dto.amount,
      PartyA: dto.phoneNumber,
      PartyB: shortcode,
      PhoneNumber: dto.phoneNumber,
      CallBackURL: `${this.config.get('apiUrl')}/api/v1/payments/mpesa/callback`,
      AccountReference: 'TonguesTrend',
      TransactionDesc: `Course payment - ${dto.courseTitle}`,
    }, { headers: { Authorization: `Bearer ${token}` } });

    await this.model.create({
      userId, amount: dto.amount, currency: 'KES',
      method: 'mpesa', status: 'pending', reference: data.CheckoutRequestID,
    });
    return data;
  }

  async handleMpesaCallback(body: any) {
    const result = body.Body?.stkCallback;
    if (!result) return;
    const status = result.ResultCode === 0 ? 'success' : 'failed';
    await this.model.findOneAndUpdate(
      { reference: result.CheckoutRequestID },
      { status },
    );
  }

  async createStripeIntent(userId: string, dto: { amount: number; currency: string }) {
    const intent = await this.stripe.paymentIntents.create({
      amount: dto.amount * 100,
      currency: dto.currency.toLowerCase(),
      metadata: { userId },
    });
    await this.model.create({
      userId, amount: dto.amount, currency: dto.currency.toUpperCase(),
      method: 'stripe', status: 'pending', reference: intent.id,
    });
    return { clientSecret: intent.client_secret };
  }

  async handleStripeWebhook(payload: Buffer, signature: string) {
    const event = this.stripe.webhooks.constructEvent(
      payload, signature, this.config.get<string>('stripe.webhookSecret') as string,
    );
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      await this.model.findOneAndUpdate({ reference: intent.id }, { status: 'success' });
    }
  }

  findMyPayments(userId: string) { return this.model.find({ userId }).sort({ createdAt: -1 }); }

  findAll(query: any = {}) {
    const { status, method, page = 1, limit = 20 } = query;
    const filter: any = {};
    if (status) filter.status = status;
    if (method) filter.method = method;
    return this.model.find(filter).skip((page-1)*limit).limit(Number(limit))
      .populate('userId', 'name email').sort({ createdAt: -1 });
  }
}
