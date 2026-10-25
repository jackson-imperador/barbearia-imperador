import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CoursesRepository } from './repositories/courses.repository';
import { EnrollmentsRepository } from './repositories/enrollments.repository';

@Injectable()
export class CoursesService {
  constructor(
    private readonly coursesRepository: CoursesRepository,
    private readonly enrollmentsRepository: EnrollmentsRepository
  ) {}

  // Courses
  async findAllCourses(tenantId: string, isAdmin = false, userId?: string, barberId?: string | null) {
    const courses = await this.coursesRepository.findAllCourses(tenantId, isAdmin, barberId);
    
    if (!isAdmin) {
      for (const course of courses) {
        if (Number(course.price) > 0) {
          let isEnrolled = false;
          if (userId) {
            const enrollment = await this.enrollmentsRepository.findEnrollmentByCourse(tenantId, userId, course.id);
            if (enrollment) isEnrolled = true;
          }
          if (!isEnrolled) {
            course.modules.forEach(m => m.lessons.forEach(l => {
              l.video = null;
              l.videoId = null;
            }));
          }
        }
      }
    }
    return courses;
  }

  async findOneCourse(id: string, tenantId: string, isAdmin = false, userId?: string, barberId?: string | null) {
    const course = await this.coursesRepository.findOneCourse(id, tenantId, isAdmin);
    if (!course) return null;
    if (barberId !== undefined && course.barberId !== barberId) {
      throw new ForbiddenException('Forbidden: Course belongs to another user');
    }

    if (!isAdmin && Number(course.price) > 0) {
      let isEnrolled = false;
      if (userId) {
        const enrollment = await this.enrollmentsRepository.findEnrollmentByCourse(tenantId, userId, course.id);
        if (enrollment) isEnrolled = true;
      }
      if (!isEnrolled) {
        course.modules.forEach(m => m.lessons.forEach(l => {
          l.video = null;
          l.videoId = null;
        }));
      }
    }
    return course;
  }

  async createCourse(tenantId: string, data: any, barberId?: string | null) {
    return this.coursesRepository.createCourse({
      tenantId,
        ...(barberId ? { barberId } : {}),
      title: data.title,
      description: data.description,
      price: data.price ? parseFloat(data.price) : 0,
      promoPrice: data.promoPrice ? parseFloat(data.promoPrice) : null,
      isPublished: data.isPublished || false,
    });
  }

  async updateCourse(id: string, tenantId: string, data: any, barberId?: string | null) {
    const authCheck = await this.coursesRepository.verifyCourseOwnership(id, tenantId, barberId);
    if (authCheck.error === 'NOT_FOUND') throw new NotFoundException('Course not found');
    if (authCheck.error === 'FORBIDDEN') throw new ForbiddenException('Forbidden');

    const updateData: any = { ...data };
    if (data.price) updateData.price = parseFloat(data.price);
    if (data.promoPrice) updateData.promoPrice = parseFloat(data.promoPrice);

    await this.coursesRepository.updateCourse(id, tenantId, updateData);
    return this.findOneCourse(id, tenantId, true);
  }

  async deleteCourse(id: string, tenantId: string, barberId?: string | null) {
    const authCheck = await this.coursesRepository.verifyCourseOwnership(id, tenantId, barberId);
    if (authCheck.error === 'NOT_FOUND') throw new NotFoundException('Course not found');
    if (authCheck.error === 'FORBIDDEN') throw new ForbiddenException('Forbidden');

    return this.coursesRepository.deleteCourse(id, tenantId);
  }

  // Modules
  async createModule(tenantId: string, courseId: string, data: any, barberId?: string | null) {
    const authCheck = await this.coursesRepository.verifyCourseOwnership(courseId, tenantId, barberId);
    if (authCheck.error === 'NOT_FOUND') throw new NotFoundException('Course not found');
    if (authCheck.error === 'FORBIDDEN') throw new ForbiddenException('Forbidden');

    return this.coursesRepository.createModule({
      tenantId,
      courseId,
      title: data.title,
      description: data.description,
      displayOrder: data.displayOrder ? parseInt(data.displayOrder) : 0
    });
  }

  async updateModule(id: string, tenantId: string, data: any, barberId?: string | null) {
    const authCheck = await this.coursesRepository.verifyModuleOwnership(id, tenantId, barberId);
    if (authCheck.error === 'NOT_FOUND') throw new NotFoundException('Module not found');
    if (authCheck.error === 'FORBIDDEN') throw new ForbiddenException('Forbidden');

    const updateData: any = { ...data };
    if (data.displayOrder) updateData.displayOrder = parseInt(data.displayOrder);

    await this.coursesRepository.updateModule(id, tenantId, updateData);
    return this.coursesRepository.findModule(id, tenantId);
  }

  async deleteModule(id: string, tenantId: string, barberId?: string | null) {
    const authCheck = await this.coursesRepository.verifyModuleOwnership(id, tenantId, barberId);
    if (authCheck.error === 'NOT_FOUND') throw new NotFoundException('Module not found');
    if (authCheck.error === 'FORBIDDEN') throw new ForbiddenException('Forbidden');

    return this.coursesRepository.deleteModule(id, tenantId);
  }

  // Lessons
  async createLesson(tenantId: string, moduleId: string, data: any, barberId?: string | null) {
    const authCheck = await this.coursesRepository.verifyModuleOwnership(moduleId, tenantId, barberId);
    if (authCheck.error === 'NOT_FOUND') throw new NotFoundException('Module not found');
    if (authCheck.error === 'FORBIDDEN') throw new ForbiddenException('Forbidden');

    return this.coursesRepository.createLesson({
      tenantId,
      moduleId,
      title: data.title,
      description: data.description,
      videoId: data.videoId,
      displayOrder: data.displayOrder ? parseInt(data.displayOrder) : 0
    });
  }

  async updateLesson(id: string, tenantId: string, data: any, barberId?: string | null) {
    const authCheck = await this.coursesRepository.verifyLessonOwnership(id, tenantId, barberId);
    if (authCheck.error === 'NOT_FOUND') throw new NotFoundException('Lesson not found');
    if (authCheck.error === 'FORBIDDEN') throw new ForbiddenException('Forbidden');

    const updateData: any = { ...data };
    if (data.displayOrder) updateData.displayOrder = parseInt(data.displayOrder);

    await this.coursesRepository.updateLesson(id, tenantId, updateData);
    return this.coursesRepository.findLesson(id, tenantId);
  }

  async getLessonForPlayer(id: string, userId?: string) {
    const lesson = await this.coursesRepository.findLessonForPlayer(id);
    if (!lesson) throw new NotFoundException('Lesson not found');
    
    const course = lesson.module?.course;
    if (!course) throw new NotFoundException('Course not found');

    const isFree = Number(course.price) === 0;
    
    if (!isFree) {
      if (!userId) throw new ForbiddenException('Login required to view this lesson');
      const enrollment = await this.enrollmentsRepository.findEnrollmentByCourse(course.tenantId, userId, course.id);
      if (!enrollment) throw new ForbiddenException('You must be enrolled to view this lesson');
    }

    return lesson;
  }

  async deleteLesson(id: string, tenantId: string, barberId?: string | null) {
    const authCheck = await this.coursesRepository.verifyLessonOwnership(id, tenantId, barberId);
    if (authCheck.error === 'NOT_FOUND') throw new NotFoundException('Lesson not found');
    if (authCheck.error === 'FORBIDDEN') throw new ForbiddenException('Forbidden');

    return this.coursesRepository.deleteLesson(id, tenantId);
  }

  // Lesson PDFs
  async addLessonPdf(tenantId: string, lessonId: string, mediaId: string, barberId?: string | null) {
    const authCheck = await this.coursesRepository.verifyLessonOwnership(lessonId, tenantId, barberId);
    if (authCheck.error === 'NOT_FOUND') throw new NotFoundException('Lesson not found');
    if (authCheck.error === 'FORBIDDEN') throw new ForbiddenException('Forbidden');

    return this.coursesRepository.addLessonPdf({
      lessonId,
      mediaId,
      displayOrder: 0
    });
  }

  async removeLessonPdf(id: string, tenantId: string, barberId?: string | null) {
    const authCheck = await this.coursesRepository.verifyLessonPdfOwnership(id, tenantId, barberId);
    if (authCheck.error === 'NOT_FOUND') throw new NotFoundException('PDF not found');
    if (authCheck.error === 'FORBIDDEN') throw new ForbiddenException('Forbidden');

    return this.coursesRepository.removeLessonPdf(id);
  }
}