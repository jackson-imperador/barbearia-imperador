import { Controller, UseGuards, Get, Post, Put, Param, Body, Req } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get()
  async getMyEnrollments(@Req() req: any) {
    return this.enrollmentsService.getUserEnrollments(req.user.tenantId, req.user.id);
  }

  @Get(':courseId')
  async getEnrollment(@Param('courseId') courseId: string, @Req() req: any) {
    return this.enrollmentsService.getEnrollment(req.user.tenantId, req.user.id, courseId);
  }

  @Post(':courseId')
  async enroll(@Param('courseId') courseId: string, @Req() req: any) {
    return this.enrollmentsService.enroll(req.user.tenantId, req.user.id, courseId);
  }

  @Put(':courseId/lessons/:lessonId/progress')
  async updateProgress(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() data: { isCompleted: boolean; lastPosition: number },
    @Req() req: any
  ) {
    return this.enrollmentsService.updateProgress(
      req.user.tenantId,
      req.user.id,
      courseId,
      lessonId,
      data.isCompleted,
      data.lastPosition || 0
    );
  }
}
