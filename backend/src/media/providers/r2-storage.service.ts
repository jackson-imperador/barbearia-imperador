import { Injectable } from '@nestjs/common';
import { StorageProvider, MulterFile } from '../storage.interface';

@Injectable()
export class R2StorageService implements StorageProvider {
  async upload(file: MulterFile, filePath: string, isPrivate: boolean): Promise<string> {
    return `https://r2.cloudflare.com/bucket/${filePath}`;
  }

  async delete(filePath: string): Promise<void> {}

  getUrl(filePath: string): string {
    return `https://r2.cloudflare.com/bucket/${filePath}`;
  }
}
