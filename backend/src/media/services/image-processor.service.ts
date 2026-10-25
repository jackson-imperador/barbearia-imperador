import { Injectable } from '@nestjs/common';
import { MulterFile } from '../storage.interface';

@Injectable()
export class ImageProcessorService {
  async process(file: MulterFile): Promise<{ buffer: Buffer; width: number; height: number; mimeType: string }> {
    return {
      buffer: file.buffer,
      width: 800,
      height: 600,
      mimeType: 'image/webp',
    };
  }

  async generateThumbnail(file: MulterFile): Promise<{ buffer: Buffer; mimeType: string }> {
    return {
      buffer: file.buffer,
      mimeType: 'image/webp',
    };
  }
}
