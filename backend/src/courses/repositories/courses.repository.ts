import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CoursesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async verifyCourseOwnership(courseId: string, tenantId: string, barberId?: string | null) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.tenantId !== tenantId) return { error: 'NOT_FOUND' };
    if (barberId !== undefined && course.barberId !== barberId) return { error: 'FORBIDDEN' };
    return { success: true, course };
  }

  async verifyModuleOwnership(moduleId: string, tenantId: string, barberId?: string | null) {
    const module = await this.prisma.courseModule.findUnique({ 
      where: { id: moduleId },
      include: { course: true }
    });
    if (!module || module.tenantId !== tenantId) return { error: 'NOT_FOUND' };
    if (barberId !== undefined && module.course.barberId !== barberId) return { error: 'FORBIDDEN' };
    return { success: true, module };
  }

  async verifyLessonOwnership(lessonId: string, tenantId: string, barberId?: string | null) {
    const lesson = await this.prisma.lesson.findUnique({ 
      where: { id: lessonId },
      include: { module: { include: { course: true } } }
    });
    if (!lesson || lesson.tenantId !== tenantId) return { error: 'NOT_FOUND' };
    if (barberId !== undefined && lesson.module.course.barberId !== barberId) return { error: 'FORBIDDEN' };
    return { success: true, lesson };
  }

  async verifyLessonPdfOwnership(pdfId: string, tenantId: string, barberId?: string | null) {
    const pdf = await this.prisma.lessonPdf.findUnique({
      where: { id: pdfId },
      include: { lesson: { include: { module: { include: { course: true } } } } }
    });
    if (!pdf || pdf.lesson.tenantId !== tenantId) return { error: 'NOT_FOUND' };
    if (barberId !== undefined && pdf.lesson.module.course.barberId !== barberId) return { error: 'FORBIDDEN' };
    return { success: true, pdf };
  }


  async findFirstTenant() {
    return this.prisma.tenant.findFirst();
  }

  async findAllCourses(tenantId: string, isAdmin = false, barberId?: string | null) {
    return this.prisma.course.findMany({
      where: { tenantId, ...(isAdmin ? {} : { isPublished: true }), ...(barberId !== undefined ? { barberId } : {}) },
      include: {
        image: true,
        modules: {
          include: {
            lessons: {
              include: { video: true, pdfs: { include: { media: true } } }
            }
          },
          orderBy: { displayOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOneCourse(id: string, tenantId: string, isAdmin = false, barberId?: string | null) {
    return this.prisma.course.findFirst({
      where: { id, tenantId, ...(isAdmin ? {} : { isPublished: true }), ...(barberId !== undefined ? { barberId } : {}) },
      include: {
        image: true,
        modules: {
          include: {
            lessons: {
              include: { video: true, pdfs: { include: { media: true } } },
              orderBy: { displayOrder: 'asc' }
            }
          },
          orderBy: { displayOrder: 'asc' }
        }
      },
    });
  }

  async createCourse(data: any) {
    return this.prisma.course.create({ data });
  }

  async updateCourse(id: string, tenantId: string, data: any) {
    return this.prisma.course.updateMany({
      where: { id, tenantId },
      data
    });
  }

  async deleteCourse(id: string, tenantId: string) {
    return this.prisma.course.deleteMany({
      where: { id, tenantId }
    });
  }

  async createModule(data: any) {
    return this.prisma.courseModule.create({ data });
  }

  async updateModule(id: string, tenantId: string, data: any) {
    return this.prisma.courseModule.updateMany({
      where: { id, tenantId },
      data
    });
  }
  
  async findModule(id: string, tenantId: string) {
    return this.prisma.courseModule.findFirst({ where: { id, tenantId } });
  }

  async deleteModule(id: string, tenantId: string) {
    return this.prisma.courseModule.deleteMany({
      where: { id, tenantId }
    });
  }

  async createLesson(data: any) {
    return this.prisma.lesson.create({ data });
  }

  async updateLesson(id: string, tenantId: string, data: any) {
    return this.prisma.lesson.updateMany({
      where: { id, tenantId },
      data
    });
  }

  async findLesson(id: string, tenantId: string) {
    return this.prisma.lesson.findFirst({ where: { id, tenantId } });
  }

  async findLessonForPlayer(id: string) {
    return this.prisma.lesson.findUnique({
      where: { id },
      include: {
        video: true,
        pdfs: { include: { media: true } },
        module: {
          include: {
            course: {
              include: {
                modules: {
                  include: {
                    lessons: true
                  }
                }
              }
            },
            lessons: { orderBy: { displayOrder: 'asc' }, include: { video: true } }
          }
        }
      }
    });
  }

  async deleteLesson(id: string, tenantId: string) {
    return this.prisma.lesson.deleteMany({
      where: { id, tenantId }
    });
  }

  async addLessonPdf(data: any) {
    return this.prisma.lessonPdf.create({
      data,
      include: { media: true }
    });
  }

  async removeLessonPdf(id: string) {
    return this.prisma.lessonPdf.delete({
      where: { id }
    });
  }
}
