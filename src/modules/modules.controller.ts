import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ModulesService } from './modules.service';
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

  @Get() findAll(@Query() query: any) { return this.modulesService.findAll(query); }
  @Get(':id') findOne(@Param('id') id: string) { return this.modulesService.findById(id); }

  @UseGuards(RolesGuard) @Roles('TEACHER', 'ADMIN')
  @Post() create(@Body() dto: any, @CurrentUser() user: any) { return this.modulesService.create(dto, user.sub); }

  @UseGuards(RolesGuard) @Roles('TEACHER', 'ADMIN')
  @Put(':id') update(@Param('id') id: string, @Body() dto: any) { return this.modulesService.update(id, dto); }

  @UseGuards(RolesGuard) @Roles('ADMIN')
  @Delete(':id') delete(@Param('id') id: string) { return this.modulesService.delete(id); }
}
