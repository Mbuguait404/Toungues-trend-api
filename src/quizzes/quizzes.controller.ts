import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('quizzes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get('module/:moduleId')
  findByModule(@Param('moduleId') moduleId: string) {
    return this.quizzesService.findByModule(moduleId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quizzesService.findByIdForLearner(id);
  }

  @UseGuards(RolesGuard) @Roles('TEACHER', 'ADMIN')
  @Get(':id/full')
  findOneFull(@Param('id') id: string) {
    return this.quizzesService.findById(id);
  }

  @UseGuards(RolesGuard) @Roles('TEACHER', 'ADMIN')
  @Post()
  create(@Body() dto: CreateQuizDto, @CurrentUser() user: any) {
    return this.quizzesService.create(dto, user.sub);
  }

  @UseGuards(RolesGuard) @Roles('TEACHER', 'ADMIN')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateQuizDto>) {
    return this.quizzesService.update(id, dto);
  }

  @UseGuards(RolesGuard) @Roles('TEACHER', 'ADMIN')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.quizzesService.delete(id);
  }

  @Post(':id/submit')
  submitAttempt(
    @Param('id') id: string,
    @Body() dto: SubmitAttemptDto,
    @CurrentUser() user: any,
  ) {
    return this.quizzesService.submitAttempt(user.sub, id, dto);
  }

  @Get(':id/attempts')
  getAttempts(@Param('id') id: string, @CurrentUser() user: any) {
    return this.quizzesService.getAttempts(user.sub, id);
  }
}
