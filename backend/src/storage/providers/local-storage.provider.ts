import { StorageProvider } from '../interfaces/storage-provider.interface';
import * as fs from 'fs';
import * as path from 'path';
import { InternalServerErrorException } from '@nestjs/common';

export class LocalStorageProvider implements StorageProvider {
  private readonly basePath = path.join(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  async upload(file: Buffer, filePath: string, mimeType: string, isPrivate = false): Promise<string> {
    const fullPath = path.join(this.basePath, filePath);
    const dir = path.dirname(fullPath);

    // Prevent path traversal
    if (!fullPath.startsWith(this.basePath)) {
      throw new InternalServerErrorException('Invalid path');
    }

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await fs.promises.writeFile(fullPath, file);
    return `/uploads/${filePath}`;
  }

  async download(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, filePath);
    return fs.promises.readFile(fullPath);
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, filePath);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  }

  async generateSignedUrl(filePath: string, expiresInSeconds: number): Promise<string> {
    // Local storage doesn't use signed URLs, fallback to direct path
    return `/api/media/private/${filePath}?expires=${Date.now() + expiresInSeconds * 1000}`;
  }

  async copy(sourcePath: string, destinationPath: string): Promise<void> {
    await fs.promises.copyFile(
      path.join(this.basePath, sourcePath),
      path.join(this.basePath, destinationPath),
    );
  }

  async move(sourcePath: string, destinationPath: string): Promise<void> {
    await fs.promises.rename(
      path.join(this.basePath, sourcePath),
      path.join(this.basePath, destinationPath),
    );
  }
}
