import { Module } from '@nestjs/common';
import { CmsService } from './cms.service';
import { CmsController } from './cms.controller';
import { CmsRepository } from './repositories/cms.repository';

@Module({
  controllers: [CmsController],
  providers: [CmsService, CmsRepository],
  exports: [CmsService, CmsRepository],
})
export class CmsModule {}