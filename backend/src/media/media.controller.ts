import { Controller, Post, Req, UseGuards, Get, Query, BadRequestException, Delete, Param } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { MediaRepository } from './repositories/media.repository';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MediaService } from './media.service';

@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
  constructor(
    private readonly storageService: StorageService,
    private readonly mediaRepository: MediaRepository,
    private readonly mediaService: MediaService
  ) {}

  @Get()
  async getMedia(@Req() req: any, @Query() query: any) {
    const user = req.user;
    let tenantId = user?.tenantId || user?.tenant;
    if (!tenantId) {
      const tenant = await this.mediaRepository['prisma'].tenant.findFirst();
      tenantId = tenant?.id;
    }
    const barberId = user?.role === "BARBER" ? await this.mediaRepository['prisma'].barber.findFirst({ where: { userId: user.id } }).then(b => b?.id) : undefined;
    return this.mediaService.findAll(tenantId, query, barberId);
  }

  @Post('upload')
  @Roles('SUPER_ADMIN', 'ADMIN', 'OWNER', 'BARBER', 'EMPLOYEE')
  async uploadFile(@Req() req: any) {
    console.log('--- UPLOAD ROUTE HIT ---');
    const user = req.user;
    
    let tenantId = user?.tenantId || user?.tenant;
    if (!tenantId) {
      const tenant = await this.mediaRepository['prisma'].tenant.findFirst();
      tenantId = tenant?.id;
    }
    
    const data = await req.file();
    if (!data) {
      throw new BadRequestException('No file uploaded');
    }

    const buffer = await data.toBuffer({ limits: { fileSize: 2 * 1024 * 1024 * 1024 } } as any);
    const folderField = data.fields?.folder;
    const folder = folderField ? (folderField as any).value : 'misc';

    const fileData = {
      buffer,
      originalname: data.filename,
      mimetype: data.mimetype,
      size: buffer.length
    };
    
    // 1. Process via StorageService Pipeline (Validation, Hashing, Upload, Thumbnails)
    const processedMedia = await this.storageService.uploadFile({
      buffer: fileData.buffer,
      originalname: fileData.originalname,
      mimetype: fileData.mimetype,
      size: fileData.size
    }, folder || 'misc');

    // 2. Check if hash already exists in DB to prevent duplicates
    let mediaRecord = await this.mediaRepository.findMediaByHash(processedMedia.hash, tenantId);

    // 3. Save to database if it's new
    if (!mediaRecord) {
      mediaRecord = await this.mediaRepository.createMedia({
        tenantId: tenantId,
        name: fileData.originalname,
        originalName: fileData.originalname,
        mimeType: processedMedia.mimeType,
        extension: processedMedia.extension,
        size: processedMedia.size,
        url: processedMedia.url,
        thumbnailUrl: processedMedia.thumbnailUrl,
        hash: processedMedia.hash,
        uploadedById: user.sub,
        type: processedMedia.mimeType.startsWith('video') ? 'VIDEO' 
            : processedMedia.mimeType.startsWith('image') ? 'IMAGE' 
            : processedMedia.mimeType.includes('pdf') ? 'PDF' : 'DOCUMENT'
      });
    }

    return mediaRecord;
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'OWNER')
  async deleteMedia(@Req() req: any, @Param('id') id: string) {
    const user = req.user;
    let tenantId = user?.tenantId || user?.tenant;
    if (!tenantId) {
      const tenant = await this.mediaRepository['prisma'].tenant.findFirst();
      tenantId = tenant?.id;
    }

    const media = await this.mediaRepository['prisma'].media.findUnique({
      where: { id }
    });

    if (!media) {
      throw new BadRequestException('Media not found');
    }

    if (media.tenantId !== tenantId) {
      throw new BadRequestException('Insufficient permissions');
    }

    // Delete from DB first
    try {
      await this.mediaRepository['prisma'].media.delete({
        where: { id }
      });
    } catch (err: any) {
      if (err.code === 'P2003') {
        throw new BadRequestException('Esta mídia está em uso por outros registros (serviço, produto, etc) e não pode ser excluída.');
      }
      throw new BadRequestException('Erro ao excluir mídia. ' + (err.message || ''));
    }

    // Attempt to physically delete the file ONLY after successful DB deletion
    try {
      if (media.url) {
        // url is /uploads/filename
        const filePath = media.url.replace('/uploads/', '');
        await this.storageService.deleteFile(filePath);
      }
    } catch (err) {
      console.error('Failed to delete physical file:', err);
    }

    return { success: true };
  }
}
