import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { EnrollmentsService } from './enrollments.service';
import { CertificatesService } from './certificates.service';
import { CoursesRepository } from './repositories/courses.repository';
import { EnrollmentsRepository } from './repositories/enrollments.repository';
import { EnrollmentsController } from './enrollments.controller';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PaymentsModule],
  controllers: [CoursesController, EnrollmentsController],
  providers: [CoursesService, EnrollmentsService, CertificatesService, CoursesRepository, EnrollmentsRepository],
  exports: [CoursesService, CoursesRepository, EnrollmentsRepository],
})
export class CoursesModule {}