export interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
  fieldname?: string;
  encoding?: string;
}

export interface StorageProvider {
  upload(file: MulterFile, path: string, isPrivate: boolean): Promise<string>;
  delete(path: string): Promise<void>;
  getUrl(path: string): string;
}
