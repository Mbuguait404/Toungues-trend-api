import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Controller('enrollments/:enrollmentId/progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  getProgress(
    @CurrentUser('sub') userId: string,
    @Param('enrollmentId') enrollmentId: string,
  ) {
    return this.progressService.getEnrollmentProgress(userId, enrollmentId);
  }

  @Put()
  updateProgress(
    @CurrentUser('sub') userId: string,
    @Param('enrollmentId') enrollmentId: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.progressService.updateProgress(userId, enrollmentId, dto);
  }
}
