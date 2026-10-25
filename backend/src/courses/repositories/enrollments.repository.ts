import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EnrollmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserEnrollments(tenantId: string, studentId: string) {
    return this.prisma.enrollment.findMany({
      where: { tenantId, studentId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  include: { video: true }
                }
              }
            }
          }
        },
        lessonProgress: true
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async findEnrollmentByCourse(tenantId: string, studentId: string, courseId: string) {
    return this.prisma.enrollment.findFirst({
      where: { tenantId, studentId, courseId },
      include: { lessonProgress: true }
    });
  }

  async enroll(tenantId: string, studentId: string, courseId: string) {
    return this.prisma.enrollment.create({
      data: {
        tenantId,
        studentId,
        courseId,
        progress: 0,
        isCompleted: false
      }
    });
  }

  async updateLessonProgress(tenantId: string, enrollmentId: string, lessonId: string, isCompleted: boolean, lastPosition: number) {
    // Upsert lesson progress
    const progress = await this.prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId,
          lessonId
        }
      },
      create: {
        tenantId,
        enrollmentId,
        lessonId,
        isCompleted,
        lastPosition
      },
      update: {
        isCompleted,
        lastPosition
      }
    });

    // Recalculate total course progress
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            modules: {
              include: { lessons: true }
            }
          }
        },
        lessonProgress: true
      }
    });

    if (enrollment && enrollment.course) {
      let totalLessons = 0;
      enrollment.course.modules.forEach(m => totalLessons += m.lessons.length);

      const completedLessons = enrollment.lessonProgress.filter(p => p.isCompleted).length;
      let progressPercentage = 0;
      if (totalLessons > 0) {
        progressPercentage = (completedLessons / totalLessons) * 100;
      }

      const isCourseCompleted = totalLessons > 0 && completedLessons === totalLessons;

      await this.prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          progress: progressPercentage,
          isCompleted: isCourseCompleted
        }
      });
    }

    return progress;
  }
}
