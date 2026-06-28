import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get('me')
  myCertificates(@CurrentUser() user: any) {
    return this.certificatesService.findMyCertificates(user.sub);
  }

  @Get('verify/:code')
  verify(@Param('code') code: string) { return this.certificatesService.verify(code); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMIN')
  @Get()
  findAll() { return this.certificatesService.findAll(); }
}
