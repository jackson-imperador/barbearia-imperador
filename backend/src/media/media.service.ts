import { Injectable, NotFoundException } from '@nestjs/common';
import { MediaRepository } from './repositories/media.repository';
import { LocalStorageService } from './providers/local-storage.service';
import { ImageProcessorService } from './services/image-processor.service';
import { VideoProcessorService } from './services/video-processor.service';
import { MulterFile } from './storage.interface';
import { CreateFolderDto } from './dto/create-folder.dto';
import { MoveMediaDto } from './dto/move-media.dto';
import { RenameMediaDto } from './dto/rename-media.dto';
import { MediaQueryDto } from './dto/media-query.dto';
import { MediaType } from '@prisma/client';

@Injectable()
export class MediaService {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly storage: LocalStorageService,
    private readonly imageProcessor: ImageProcessorService,
    private readonly videoProcessor: VideoProcessorService,
  ) {}

  async createFolder(tenantId: string, dto: CreateFolderDto) {
    if (dto.parentId) {
      const parent = await this.mediaRepository.findFolder(dto.parentId, tenantId);
      if (!parent) throw new NotFoundException('Parent folder not found');
    }

    return this.mediaRepository.createFolder({
      tenantId,
      name: dto.name,
      parentId: dto.parentId,
    });
  }

  async uploadSingle(tenantId: string, userId: string, file: MulterFile, folderId?: string, isPrivate: boolean = false) {
    if (folderId) {
      const folder = await this.mediaRepository.findFolder(folderId, tenantId);
      if (!folder) throw new NotFoundException('Folder not found');
    }

    const type = this.determineType(file.mimetype);
    const extension = file.originalname.split('.').pop() || '';
    const name = file.originalname.replace(`.${extension}`, '');
    const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
    const storagePath = `${tenantId}/${uniqueFileName}`;

    let processedBuffer = file.buffer;
    let width = null;
    let height = null;
    let duration = null;
    let thumbnailUrl = null;

    if (type === 'IMAGE') {
      const processed = await this.imageProcessor.process(file);
      processedBuffer = processed.buffer;
      width = processed.width;
      height = processed.height;
      file.mimetype = processed.mimeType;

      const thumb = await this.imageProcessor.generateThumbnail(file);
      const thumbPath = `${tenantId}/thumb-${uniqueFileName}`;
      await this.storage.upload({ ...file, buffer: thumb.buffer } as any, thumbPath, isPrivate);
      thumbnailUrl = this.storage.getUrl(thumbPath);
    } else if (type === 'VIDEO') {
      const meta = await this.videoProcessor.extractMetadata(file);
      width = meta.width;
      height = meta.height;
      duration = meta.duration;

      const thumb = await this.videoProcessor.generateThumbnail(file);
      const thumbPath = `${tenantId}/thumb-${uniqueFileName}.jpg`;
      await this.storage.upload({ ...file, buffer: thumb.buffer } as any, thumbPath, isPrivate);
      thumbnailUrl = this.storage.getUrl(thumbPath);
    }

    await this.storage.upload({ ...file, buffer: processedBuffer } as any, storagePath, isPrivate);
    const url = this.storage.getUrl(storagePath);

    return this.mediaRepository.createMedia({
      tenantId,
      folderId,
      name,
      originalName: file.originalname,
      mimeType: file.mimetype,
      extension,
      size: processedBuffer.length,
      width,
      height,
      duration,
      url,
      thumbnailUrl,
      visibility: isPrivate ? 'PRIVATE' : 'PUBLIC',
      type,
      uploadedById: userId,
    });
  }

  async uploadMultiple(tenantId: string, userId: string, files: MulterFile[], folderId?: string, isPrivate: boolean = false) {
    const results = [];
    for (const file of files) {
      results.push(await this.uploadSingle(tenantId, userId, file, folderId, isPrivate));
    }
    return results;
  }

  private determineType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType.startsWith('video/')) return 'VIDEO';
    if (mimeType.startsWith('audio/')) return 'AUDIO';
    if (mimeType === 'application/pdf') return 'PDF';
    return 'DOCUMENT';
  }

  async findAll(tenantId: string, query: MediaQueryDto, barberId?: string) {
    const pageNum = Number(query.page) || 1;
    const limitNum = Number(query.limit) || 50;
    const { folderId, type, search } = query;
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = { tenantId, deletedAt: null };
    if (barberId) whereClause.barberId = barberId;
    if (folderId !== undefined) whereClause.folderId = folderId === 'root' ? null : folderId;
    if (type) whereClause.type = type;
    if (search) whereClause.name = { contains: search, mode: 'insensitive' };

    const [total, items] = await Promise.all([
      this.mediaRepository.countMedia(whereClause),
      this.mediaRepository.findManyMedia(whereClause, skip, limitNum),
    ]);

    return {
      data: items,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    };
  }

  async rename(id: string, tenantId: string, dto: RenameMediaDto) {
    const media = await this.mediaRepository.findMedia(id, tenantId);
    if (!media) throw new NotFoundException('Media not found');
    return this.mediaRepository.updateMedia(id, { name: dto.name });
  }

  async move(id: string, tenantId: string, dto: MoveMediaDto) {
    const media = await this.mediaRepository.findMedia(id, tenantId);
    if (!media) throw new NotFoundException('Media not found');

    if (dto.folderId) {
      const folder = await this.mediaRepository.findFolder(dto.folderId, tenantId);
      if (!folder) throw new NotFoundException('Destination folder not found');
    }

    return this.mediaRepository.updateMedia(id, { folderId: dto.folderId || null });
  }

  async remove(id: string, tenantId: string) {
    const media = await this.mediaRepository.findMediaWithDeleted(id, tenantId);
    if (!media) throw new NotFoundException('Media not found');

    return this.mediaRepository.updateMedia(id, { deletedAt: new Date() });
  }

  async restore(id: string, tenantId: string) {
    const media = await this.mediaRepository.findMediaWithDeleted(id, tenantId);
    if (!media) throw new NotFoundException('Media not found');

    return this.mediaRepository.updateMedia(id, { deletedAt: null });
  }
}
