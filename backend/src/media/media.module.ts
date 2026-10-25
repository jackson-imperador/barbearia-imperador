import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaRepository } from './repositories/media.repository';

import { MediaService } from './media.service';
import { LocalStorageService } from './providers/local-storage.service';
import { ImageProcessorService } from './services/image-processor.service';
import { VideoProcessorService } from './services/video-processor.service';

// MediaController uses StorageService (from @Global StorageModule)
// and MediaRepository — providing local dependencies
@Module({
  controllers: [MediaController],
  providers: [
    MediaRepository, 
    MediaService,
    LocalStorageService,
    ImageProcessorService,
    VideoProcessorService
  ],
  exports: [MediaRepository, MediaService],
})
export class MediaModule {}

