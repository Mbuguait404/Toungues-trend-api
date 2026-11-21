import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import axios from 'axios';
import { PaymentsService } from './payments.service';
import { PaymentDocument } from './schemas/payment.schema';

describe('PaymentsService PayHero', () => {
  const model = {
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn(),
  };
  const config = {
    get: jest.fn((key: string) => ({
      'stripe.secretKey': 'sk_test_placeholder',
      'payhero.authToken': 'Basic rotated-token',
      'payhero.channelId': '123',
      apiUrl: 'https://api.example.com',
    })[key]),
  };
  const coursesService = {
    findById: jest.fn().mockResolvedValue({
      _id: 'course-id',
      title: 'French',
      accessType: 'paid',
      price: 100,
      currency: 'KES',
      levels: ['A1'],
      isActive: true,
    }),
  };
  const enrollmentsService = {
    enrol: jest.fn().mockResolvedValue({ _id: 'enrollment-id', accessStatus: 'preview' }),
    grantPaidAccess: jest.fn(),
  };
  let service: PaymentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PaymentsService(
      model as unknown as Model<PaymentDocument>,
      config as unknown as ConfigService,
      coursesService as any,
      enrollmentsService as any,
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it('creates a pending PayHero payment and sends its external reference', async () => {
    model.create.mockResolvedValue({ _id: 'payment-id' });
    model.findByIdAndUpdate.mockResolvedValue({});
    jest.spyOn(axios, 'post').mockResolvedValue({
      data: { success: true, reference: 'payhero-reference', CheckoutRequestID: 'checkout-id' },
    } as never);

    await service.initiatePayHero('user-id', {
      phoneNumber: '0712345678',
      courseId: 'course-id',
      level: 'A1',
    });

    const payment = model.create.mock.calls[0][0];
    const [, request, options] = (axios.post as jest.Mock).mock.calls[0];
    expect(payment).toMatchObject({
      method: 'payhero',
      status: 'pending',
      currency: 'KES',
      amount: 100,
      courseId: 'course-id',
      enrollmentId: 'enrollment-id',
    });
    expect(request.external_reference).toBe(payment.externalReference);
    expect(request.callback_url).toBe('https://api.example.com/api/v1/payments/payhero/callback');
    expect(options.headers.Authorization).toBe('Basic rotated-token');
    expect(model.findByIdAndUpdate).toHaveBeenCalledWith('payment-id', {
      reference: 'payhero-reference',
      checkoutRequestId: 'checkout-id',
    });
  });

  it('verifies callback status with PayHero before updating the payment', async () => {
    model.findOne.mockResolvedValue({
      _id: 'payment-id',
      reference: 'payhero-reference',
      amount: 100,
      enrollmentId: 'enrollment-id',
      status: 'pending',
    });
    model.updateOne.mockResolvedValue({ modifiedCount: 1 });
    jest.spyOn(axios, 'get').mockResolvedValue({
      data: { reference: 'payhero-reference', status: 'SUCCESS' },
    } as never);

    await service.handlePayHeroCallback({
      response: { ExternalReference: 'external-reference', Amount: 100, ResultCode: 0 },
    });

    expect(axios.get).toHaveBeenCalledWith(
      'https://backend.payhero.co.ke/api/v2/transaction-status',
      expect.objectContaining({ params: { reference: 'payhero-reference' } }),
    );
    expect(model.updateOne).toHaveBeenCalledWith(
      { _id: 'payment-id', status: 'pending' },
      { status: 'success' },
    );
    expect(enrollmentsService.grantPaidAccess).toHaveBeenCalledWith('enrollment-id');
  });

  it('rejects a callback whose amount differs from the stored price', async () => {
    model.findOne.mockResolvedValue({
      _id: 'payment-id',
      reference: 'payhero-reference',
      amount: 100,
      status: 'pending',
    });

    await expect(service.handlePayHeroCallback({
      response: { ExternalReference: 'external-reference', Amount: 1 },
    })).rejects.toThrow('PayHero callback amount does not match the expected amount');

    expect(model.updateOne).not.toHaveBeenCalled();
  });

  it('marks the payment failed when PayHero rejects the request', async () => {
    model.create.mockResolvedValue({ _id: 'payment-id' });
    model.findByIdAndUpdate.mockResolvedValue({});
    jest.spyOn(axios, 'post').mockResolvedValue({ data: { success: false } } as never);

    await expect(service.initiatePayHero('user-id', {
      phoneNumber: '0712345678',
      courseId: 'course-id',
      level: 'A1',
    })).rejects.toThrow('PayHero did not accept the payment request');

    expect(model.findByIdAndUpdate).toHaveBeenCalledWith('payment-id', { status: 'failed' });
  });
});