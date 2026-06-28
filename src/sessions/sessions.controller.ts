import { Controller, Post, Get, Patch, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get('availability')
  getAvailability(@Query('teacherId') teacherId: string, @Query('date') date: string) {
    return this.sessionsService.getAvailability(teacherId, date);
  }

  @Post('book')
  book(@CurrentUser() user: any, @Body() dto: any) {
    return this.sessionsService.book(user.sub, dto);
  }

  @Get('me')
  mySessions(@CurrentUser() user: any) { return this.sessionsService.findMySessions(user.sub); }

  @UseGuards(RolesGuard) @Roles('ADMIN')
  @Get()
  findAll(@Query() query: any) { return this.sessionsService.findAll(query); }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) { return this.sessionsService.cancel(id); }

  @UseGuards(RolesGuard) @Roles('TEACHER')
  @Put(':id/notes')
  addNotes(@Param('id') id: string, @Body('notes') notes: string) {
    return this.sessionsService.addNotes(id, notes);
  }
}
