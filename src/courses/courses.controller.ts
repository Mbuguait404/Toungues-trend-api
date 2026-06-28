import { Controller, Get, Post, Put, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get() findAll() { return this.coursesService.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.coursesService.findById(id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMIN')
  @Post() create(@Body() dto: CreateCourseDto) { return this.coursesService.create(dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMIN')
  @Put(':id') update(@Param('id') id: string, @Body() dto: CreateCourseDto) { return this.coursesService.update(id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMIN')
  @Patch(':id/teachers/add')
  addTeacher(@Param('id') id: string, @Body('teacherId') teacherId: string) {
    return this.coursesService.assignTeacher(id, teacherId);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMIN')
  @Patch(':id/teachers/remove')
  removeTeacher(@Param('id') id: string, @Body('teacherId') teacherId: string) {
    return this.coursesService.removeTeacher(id, teacherId);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMIN')
  @Delete(':id') deactivate(@Param('id') id: string) { return this.coursesService.deactivate(id); }
}
