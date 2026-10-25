import { Injectable } from '@nestjs/common';
import { MulterFile } from '../storage.interface';

@Injectable()
export class VideoProcessorService {
  async extractMetadata(file: MulterFile): Promise<{ duration: number; width: number; height: number }> {
    return { duration: 0, width: 1920, height: 1080 };
  }

  async generateThumbnail(file: MulterFile): Promise<{ buffer: Buffer; mimeType: string }> {
    return { buffer: Buffer.from('fallback_video_thumb'), mimeType: 'image/jpeg' };
  }
}
