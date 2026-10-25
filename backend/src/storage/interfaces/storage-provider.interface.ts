export interface StorageProvider {
  upload(file: Buffer, path: string, mimeType: string, isPrivate?: boolean): Promise<string>;
  download(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
  generateSignedUrl(path: string, expiresInSeconds: number): Promise<string>;
  copy(sourcePath: string, destinationPath: string): Promise<void>;
  move(sourcePath: string, destinationPath: string): Promise<void>;
}
