import { Controller, Get, Post, Put, Delete, Param, Body, UploadedFile, UseInterceptors, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MaterialsService } from './materials.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('materials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get(':moduleId')
  findByModule(@Param('moduleId') moduleId: string) { return this.materialsService.findByModule(moduleId); }

  @UseGuards(RolesGuard) @Roles('TEACHER', 'ADMIN')
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File, @Body() dto: any, @CurrentUser() user: any) {
    return this.materialsService.upload(file, dto, user.sub);
  }

  @UseGuards(RolesGuard) @Roles('TEACHER', 'ADMIN')
  @Put(':id') update(@Param('id') id: string, @Body() dto: any) { return this.materialsService.update(id, dto); }

  @UseGuards(RolesGuard) @Roles('TEACHER', 'ADMIN')
  @Delete(':id') delete(@Param('id') id: string) { return this.materialsService.delete(id); }

  @Post(':id/view')
  incrementView(@Param('id') id: string) { return this.materialsService.incrementView(id); }
}
