import { Injectable, InternalServerErrorException, UnsupportedMediaTypeException } from '@nestjs/common';
import { StorageProvider } from './interfaces/storage-provider.interface';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { S3StorageProvider } from './providers/s3-storage.provider';
import * as crypto from 'crypto';
import * as path from 'path';

export interface FileData {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class StorageService {
  private provider: StorageProvider;
  private readonly MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

  constructor() {
    // Select provider via ENV
    const providerType = process.env.STORAGE_PROVIDER || 'local';

    switch (providerType) {
      case 's3':
      case 'minio':
      case 'r2':
        this.provider = new S3StorageProvider();
        break;
      case 'local':
      default:
        this.provider = new LocalStorageProvider();
        break;
    }
  }

  async uploadFile(file: FileData, folder: string, isPrivate = false) {
    const extension = path.extname(file.originalname);
    this.validateMimeType(file.mimetype, extension);
    this.validateSize(file.size);

    const hash = this.generateHash(file.buffer);
    const uniqueFilename = `${hash}${extension}`;
    const filePath = path.join(folder, uniqueFilename).replace(/\\/g, '/'); // Normalize path

    const url = await this.provider.upload(file.buffer, filePath, file.mimetype, isPrivate);

    let thumbnailUrl: string | null = null;
    // We do not extract thumbnails right now, so frontend will fall back to original image url or show icon for videos

    return {
      url,
      hash,
      extension,
      size: file.size,
      mimeType: file.mimetype,
      thumbnailUrl,
    };
  }

  async deleteFile(filePath: string) {
    await this.provider.delete(filePath);
  }

  async generateSignedUrl(filePath: string, expiresIn = 3600) {
    return this.provider.generateSignedUrl(filePath, expiresIn);
  }

  private validateMimeType(mimeType: string, extension: string) {
    if (mimeType.startsWith('video/') || mimeType.startsWith('image/')) {
      return;
    }
    
    const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv'];
    if (videoExts.includes(extension.toLowerCase())) {
      return;
    }

    const allowed = [
      'application/pdf',
    ];
    if (!allowed.includes(mimeType)) {
      throw new UnsupportedMediaTypeException('Invalid file format');
    }
  }

  private validateSize(size: number) {
    if (size > this.MAX_SIZE) {
      throw new InternalServerErrorException('File exceeds maximum allowed size');
    }
  }

  private generateHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}
