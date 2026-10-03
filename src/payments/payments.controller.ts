import { Controller, Post, Get, Body, Query, Headers, Req, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CoursePaymentDto, StripeCoursePaymentDto } from './dto/course-payment.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Post('payhero/initiate')
  initiatePayHero(@CurrentUser() user: any, @Body() dto: CoursePaymentDto) {
    return this.paymentsService.initiatePayHero(user.sub, dto);
  }

  @Post('payhero/callback')
  payHeroCallback(@Body() body: any) { return this.paymentsService.handlePayHeroCallback(body); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Post('stripe/intent')
  stripeIntent(@CurrentUser() user: any, @Body() dto: StripeCoursePaymentDto) {
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

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get(':id')
  myPayment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentsService.findMyPaymentById(id, user.sub);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMIN')
  @Get()
  findAll(@Query() query: any) { return this.paymentsService.findAll(query); }
}
