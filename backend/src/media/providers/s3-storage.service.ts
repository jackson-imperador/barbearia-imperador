import { Injectable } from '@nestjs/common';
import { StorageProvider, MulterFile } from '../storage.interface';

@Injectable()
export class S3StorageService implements StorageProvider {
  async upload(file: MulterFile, filePath: string, isPrivate: boolean): Promise<string> {
    return `https://s3.amazonaws.com/bucket/${filePath}`;
  }

  async delete(filePath: string): Promise<void> {}

  getUrl(filePath: string): string {
    return `https://s3.amazonaws.com/bucket/${filePath}`;
  }
}
