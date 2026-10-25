import { StorageProvider } from '../interfaces/storage-provider.interface';

// S3 Storage Provider stub (applicable to AWS, MinIO, Cloudflare R2, etc. via S3-compat)
export class S3StorageProvider implements StorageProvider {
  async upload(file: Buffer, filePath: string, mimeType: string, isPrivate = false): Promise<string> {
    return `https://s3.amazonaws.com/bucket/${filePath}`;
  }

  async download(filePath: string): Promise<Buffer> {
    return Buffer.from('');
  }

  async delete(filePath: string): Promise<void> {}

  async generateSignedUrl(filePath: string, expiresInSeconds: number): Promise<string> {
    return `https://s3.amazonaws.com/bucket/${filePath}?sig=XYZ`;
  }

  async copy(sourcePath: string, destinationPath: string): Promise<void> {}
  async move(sourcePath: string, destinationPath: string): Promise<void> {}
}
