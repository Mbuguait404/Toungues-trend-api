import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('modules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get('count')
  countByCourse(@Query('courseId') courseId: string, @Query('level') level?: string) {
    return this.modulesService.countByCourse(courseId, level);
  }

  @Get()
  findAll(@Query('courseId') courseId?: string, @Query('level') level?: string) {
    return this.modulesService.findAll(courseId, level);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.modulesService.findById(id); }

  @UseGuards(RolesGuard) @Roles('TEACHER', 'ADMIN')
  @Post()
  create(@Body() dto: CreateModuleDto, @CurrentUser() user: any) {
    return this.modulesService.create(dto, user.sub);
  }

  @UseGuards(RolesGuard) @Roles('TEACHER', 'ADMIN')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateModuleDto) {
    return this.modulesService.update(id, dto);
  }

  @UseGuards(RolesGuard) @Roles('ADMIN')
  @Delete(':id')
  delete(@Param('id') id: string) { return this.modulesService.delete(id); }
}
