import { Controller, UseGuards, Get, Post, Put, Delete, Param, Body, Query, Req, UnauthorizedException } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  
  private async getBarberId(req: any): Promise<string | undefined> {
    const roles = req.user?.roles || [];
    console.log('GETBARBERID CALLED! User ID:', req.user?.id, 'Roles:', roles);
    
    if (roles.includes('OWNER') || roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) {
      console.log('Is ADMIN/OWNER! Returning undefined.');
      return undefined;
    }
    const userId = req.user?.id || req.user?.sub;
    const barber = await this.prisma.barber.findUnique({ where: { userId } });
    if (barber) {
      console.log('Is BARBER! Returning barber.id:', barber.id);
      return barber.id;
    }
    console.log('Is NOT BARBER OR ADMIN! Returning UNAUTHORIZED_ACCESS.');
    return 'UNAUTHORIZED_ACCESS';
  }

  constructor(
    private readonly coursesService: CoursesService,
    private readonly prisma: PrismaService
  ) {}

  @Get()
  @Public()
  async findAll(@Req() req: any) {
    let tenantId = req.user?.tenantId;
    if (!tenantId) {
      const defaultTenant = await this.prisma.tenant.findFirst();
      tenantId = defaultTenant?.id;
    }
    return this.coursesService.findAllCourses(tenantId, false, req.user?.id);
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string, @Req() req: any) {
    let tenantId = req.user?.tenantId;
    if (!tenantId) {
      const defaultTenant = await this.prisma.tenant.findFirst();
      tenantId = defaultTenant?.id;
    }
    return this.coursesService.findOneCourse(id, tenantId, false, req.user?.id);
  }

  @Get('player/:id')
  async getLessonForPlayer(@Param('id') id: string, @Req() req: any) {
    if (!req.user || !req.user.id) throw new UnauthorizedException();
    return this.coursesService.getLessonForPlayer(id, req.user.id);
  }

  @Get('admin/list')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async findAllAdmin(@Req() req: any) {
    const barberId = await this.getBarberId(req);
    return this.coursesService.findAllCourses(req.user.tenantId, true, undefined, barberId);
  }

  @Get('admin/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async findOneAdmin(@Param('id') id: string, @Req() req: any) {
    const barberId = await this.getBarberId(req);
    return this.coursesService.findOneCourse(id, req.user.tenantId, true, undefined, barberId);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async createCourse(@Req() req: any) {
    const barberId = await this.getBarberId(req);
    return this.coursesService.createCourse(req.user.tenantId, req.body, barberId);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async updateCourse(@Param('id') id: string, @Req() req: any) {
    const barberId = await this.getBarberId(req);
    return this.coursesService.updateCourse(id, req.user.tenantId, req.body, barberId);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async deleteCourse(@Param('id') id: string, @Req() req: any) {
    const barberId = await this.getBarberId(req);
    return this.coursesService.deleteCourse(id, req.user.tenantId, barberId);
  }

  @Post(':courseId/modules')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async createModule(@Param('courseId') courseId: string, @Req() req: any) {
    const barberId = await this.getBarberId(req);
    return this.coursesService.createModule(req.user.tenantId, courseId, req.body, barberId);
  }

  @Put('modules/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async updateModule(@Param('id') id: string, @Req() req: any) {
    const barberId = await this.getBarberId(req);
    return this.coursesService.updateModule(id, req.user.tenantId, req.body, barberId);
  }

  @Delete('modules/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async deleteModule(@Param('id') id: string, @Req() req: any) {
    const barberId = await this.getBarberId(req);
    return this.coursesService.deleteModule(id, req.user.tenantId, barberId);
  }

  @Post('modules/:moduleId/lessons')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async createLesson(@Param('moduleId') moduleId: string, @Req() req: any) {
    const barberId = await this.getBarberId(req);
    return this.coursesService.createLesson(req.user.tenantId, moduleId, req.body, barberId);
  }

  @Put('lessons/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async updateLesson(@Param('id') id: string, @Req() req: any) {
    const barberId = await this.getBarberId(req);
    return this.coursesService.updateLesson(id, req.user.tenantId, req.body, barberId);
  }

  @Delete('lessons/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async deleteLesson(@Param('id') id: string, @Req() req: any) {
    const barberId = await this.getBarberId(req);
    return this.coursesService.deleteLesson(id, req.user.tenantId, barberId);
  }

  @Post('lessons/:lessonId/pdfs')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async addLessonPdf(@Param('lessonId') lessonId: string, @Body('mediaId') mediaId: string, @Req() req: any) {
    const barberId = await this.getBarberId(req);
    return this.coursesService.addLessonPdf(req.user.tenantId, lessonId, mediaId, barberId);
  }

  @Delete('pdfs/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'BARBER')
  async removeLessonPdf(@Param('id') id: string, @Req() req: any) {
    const barberId = await this.getBarberId(req);
    return this.coursesService.removeLessonPdf(id, req.user.tenantId, barberId);
  }
}
