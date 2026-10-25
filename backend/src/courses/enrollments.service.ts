import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EnrollmentsRepository } from './repositories/enrollments.repository';
import { CoursesRepository } from './repositories/courses.repository';

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly enrollmentsRepository: EnrollmentsRepository,
    private readonly coursesRepository: CoursesRepository
  ) {}

  async getUserEnrollments(tenantId: string, studentId: string) {
    return this.enrollmentsRepository.findUserEnrollments(tenantId, studentId);
  }

  async getEnrollment(tenantId: string, studentId: string, courseId: string) {
    return this.enrollmentsRepository.findEnrollmentByCourse(tenantId, studentId, courseId);
  }

  async enroll(tenantId: string, studentId: string, courseId: string) {
    const existing = await this.enrollmentsRepository.findEnrollmentByCourse(tenantId, studentId, courseId);
    if (existing) {
      return existing; // Already enrolled
    }

    const course = await this.coursesRepository.findOneCourse(courseId, tenantId, false);
    if (!course) {
      throw new NotFoundException('Course not found or not published');
    }

    if (Number(course.price) > 0) {
      throw new ForbiddenException('This is a paid course. You must purchase it first.');
    }

    return this.enrollmentsRepository.enroll(tenantId, studentId, courseId);
  }

  async updateProgress(tenantId: string, studentId: string, courseId: string, lessonId: string, isCompleted: boolean, lastPosition: number) {
    const enrollment = await this.enrollmentsRepository.findEnrollmentByCourse(tenantId, studentId, courseId);
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return this.enrollmentsRepository.updateLessonProgress(tenantId, enrollment.id, lessonId, isCompleted, lastPosition);
  }
}