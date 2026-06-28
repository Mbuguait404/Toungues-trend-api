import { Controller, Post, Get, Body, Query, Headers, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Post('mpesa/initiate')
  initiateMpesa(@CurrentUser() user: any, @Body() dto: any) {
    return this.paymentsService.initiateMpesa(user.sub, dto);
  }

  @Post('mpesa/callback')
  mpesaCallback(@Body() body: any) { return this.paymentsService.handleMpesaCallback(body); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Post('stripe/intent')
  stripeIntent(@CurrentUser() user: any, @Body() dto: any) {
    return this.paymentsService.createStripeIntent(user.sub, dto);
  }

  @Post('stripe/webhook')
  stripeWebhook(@Req() req: Request & { rawBody?: Buffer }, @Headers('stripe-signature') sig: string) {
    if (!req.rawBody) return { received: true };
    return this.paymentsService.handleStripeWebhook(req.rawBody, sig);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get('me')
  myPayments(@CurrentUser() user: any) { return this.paymentsService.findMyPayments(user.sub); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMIN')
  @Get()
  findAll(@Query() query: any) { return this.paymentsService.findAll(query); }
}
