import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  enrol(@CurrentUser() user: any, @Body() body: { courseId: string; level: string }) {
    return this.enrollmentsService.enrol(user.sub, body.courseId, body.level);
  }

  @Get('me')
  myEnrollments(@CurrentUser() user: any) {
    return this.enrollmentsService.findMyEnrollments(user.sub);
  }

  @UseGuards(RolesGuard) @Roles('TEACHER', 'ADMIN')
  @Get('my-learners')
  myLearners(@CurrentUser() user: any) {
    return this.enrollmentsService.findMyLearners(user.sub);
  }

  @UseGuards(RolesGuard) @Roles('ADMIN')
  @Get()
  findAll(@Query() query: any) { return this.enrollmentsService.findAll(query); }

  @UseGuards(RolesGuard) @Roles('ADMIN')
  @Get('by-course/:courseId')
  findByCourse(@Param('courseId') courseId: string) {
    return this.enrollmentsService.findByCourse(courseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.enrollmentsService.findById(id); }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.enrollmentsService.updateStatus(id, status);
  }
}
