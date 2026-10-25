import { Injectable } from '@nestjs/common';
import { StorageProvider, MulterFile } from '../storage.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalStorageService implements StorageProvider {
  async upload(file: MulterFile, filePath: string, isPrivate: boolean): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'uploads', path.dirname(filePath));
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const fullPath = path.join(process.cwd(), 'uploads', filePath);
    fs.writeFileSync(fullPath, file.buffer);
    return `/uploads/${filePath}`;
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(process.cwd(), 'uploads', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  getUrl(filePath: string): string {
    return `/uploads/${filePath}`;
  }
}
