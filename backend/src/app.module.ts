import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validate } from './config/env.validation';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Infrastructure (Global)
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';

// Features
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RbacModule } from './rbac/rbac.module';
import { BarbersModule } from './barbers/barbers.module';
import { ServicesModule } from './services/services.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { MediaModule } from './media/media.module';
import { ProductsModule } from './products/products.module';
import { CoursesModule } from './courses/courses.module';
import { CmsModule } from './cms/cms.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PaymentsModule } from './payments/payments.module';
import { StoreModule } from './store/store.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { InsightsModule } from './insights/insights.module';
import { CouponsModule } from './coupons/coupons.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    // Config (global, must be first)
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 1000,
    }]),
    EventEmitterModule.forRoot(),

    // Infrastructure (global providers)
    PrismaModule,
    StorageModule,

    // Health
    HealthModule,

    // Auth & Access Control
    AuthModule,
    UsersModule,
    RbacModule,

    // Core Barber Features
    BarbersModule,
    ServicesModule,
    AppointmentsModule,
    SchedulingModule,
    WhatsappModule,

    // Media & Files
    MediaModule,

    // Business Features
    ProductsModule,
    CoursesModule,
    CmsModule,
    DashboardModule,
    PaymentsModule,
    StoreModule,
    SubscriptionsModule,
    LoyaltyModule,
    InsightsModule,
    CouponsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
