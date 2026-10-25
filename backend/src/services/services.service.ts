import { ForbiddenException } from '@nestjs/common';
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { ReorderDto } from './dto/reorder.dto';
import { IServicesRepository, SERVICES_REPOSITORY } from './repositories/services.repository.interface';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(
    @Inject(SERVICES_REPOSITORY)
    private readonly repository: IServicesRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getDefaultTenantId(): Promise<string> {
    const adminRole = await this.prisma.role.findFirst({ where: { name: 'SUPER_ADMIN' } });
    if (adminRole?.tenantId) return adminRole.tenantId;
    const tenant = await this.prisma.tenant.findFirst();
    return tenant?.id || '';
  }

  async create(tenantId: string, dto: CreateServiceDto, barberId?: string | null) {
    const category = await this.repository.findCategory(dto.categoryId, tenantId);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const { imageUrl, ...createData } = dto;

    let imageId: string | null = null;
    if (imageUrl) {
      const media = await this.prisma.media.findFirst({ where: { url: imageUrl, tenantId } });
      if (media) {
        imageId = media.id;
      } else {
        const newMedia = await this.prisma.media.create({
          data: {
            url: imageUrl,
            name: 'Service Image',
            tenant: { connect: { id: tenantId } },
            mimeType: 'image/jpeg',
            originalName: 'service-image.jpg',
            extension: '.jpg',
            size: 0,
          }
        });
        imageId = newMedia.id;
      }
    }

    return this.repository.create({
      ...(barberId ? { barberId } : {}),
      tenantId,
      ...createData,
      ...(imageId ? { imageId } : {}),
    });
  }

  async findAll(tenantId: string, query: ServiceQueryDto, isCustomer: boolean = false, barberId?: string | null) {
    const { page = 1, limit = 50, search, categoryId, isActive } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      tenantId,
      deletedAt: null,
    };

    if (barberId) {
      whereClause.OR = [
        { barberId: null },
        { barberId }
      ];
    }

    if (isCustomer) {
      whereClause.isActive = true;
      whereClause.category = { isActive: true, deletedAt: null };
    } else if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (search) {
      whereClause.name = { contains: search, mode: 'insensitive' };
    }

    const [total, services] = await Promise.all([
      this.repository.count(whereClause),
      this.repository.findMany(
        whereClause,
        skip,
        limit,
        {
          category: { select: { id: true, name: true, isActive: true } },
          image: true,
        },
        [{ category: { displayOrder: 'asc' } }, { displayOrder: 'asc' }],
      ),
    ]);

    const mappedServices = services.map(s => {
      let isActive = s.isActive;
      // If it's a global service and the requesting user is a barber, check if they disabled it
      if (!s.barberId && barberId && (s as any).disabledByBarberIds?.includes(barberId)) {
        isActive = false;
      }
      return {
        ...s,
        isActive,
        imageUrl: (s as any).image?.url || null
      };
    });

    return {
      data: mappedServices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string, isCustomer: boolean = false, barberId?: string | null) {
    const whereClause: any = { id, tenantId, deletedAt: null, ...(barberId ? { barberId } : {}) };
    if (isCustomer) {
      whereClause.isActive = true;
    }

    const service = await this.repository.findFirst(whereClause, {
      category: true,
      image: true,
      appointments: {
        where: { status: 'COMPLETED' },
        include: {
          barber: {
            include: {
              user: true,
              photo: true,
            }
          },
          customer: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true }
          }
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      }
    });

    if (!service || (isCustomer && !(service as any).category?.isActive)) {
      throw new NotFoundException('Service not found');
    }

    // Extract barbers from appointments (unique)
    const barbersMap = new Map();
    const reviews = [];
    
    if ((service as any).appointments) {
      for (const appt of (service as any).appointments) {
        if (appt.barber && !barbersMap.has(appt.barber.id)) {
          barbersMap.set(appt.barber.id, {
            id: appt.barber.id,
            name: `${appt.barber.user?.firstName} ${appt.barber.user?.lastName}`,
            photo: appt.barber.photo?.url || null,
            bio: appt.barber.bio,
          });
        }
      }
    }
    
    // Fetch related services
    const relatedServices = await this.repository.findMany(
      { categoryId: service.categoryId, tenantId, id: { not: id }, deletedAt: null, isActive: true },
      0,
      4,
      { image: true },
      [{ displayOrder: 'asc' }]
    );

    return {
      ...service,
      imageUrl: (service as any).image?.url || null,
      barbers: Array.from(barbersMap.values()),
      reviews,
      relatedServices,
    };
  }

  async update(id: string, tenantId: string, dto: UpdateServiceDto, barberId?: string | null) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service || service.deletedAt) throw new NotFoundException('Service not found');
    if (service.tenantId !== tenantId) throw new ForbiddenException('Forbidden');

    // If barber is trying to update a global service (or someone else's service)
    if (barberId && service.barberId !== barberId) {
      // Allow ONLY toggling isActive for global services (or tenant services) by a barber
      const updatingOnlyIsActive = Object.keys(dto).length === 1 && 'isActive' in dto;
      
      if (!service.barberId && updatingOnlyIsActive) {
        // Toggle the barber in disabledByBarberIds
        let newDisabledBy = [...service.disabledByBarberIds];
        if (dto.isActive) {
          // Remove from disabled
          newDisabledBy = newDisabledBy.filter(id => id !== barberId);
        } else {
          // Add to disabled
          if (!newDisabledBy.includes(barberId)) {
            newDisabledBy.push(barberId);
          }
        }
        return this.repository.update(id, { disabledByBarberIds: newDisabledBy });
      }

      throw new ForbiddenException('Acesso negado: Você só pode editar seus próprios serviços ou ativar/desativar serviços globais para si.');
    }

    if (dto.categoryId) {
      const category = await this.repository.findCategory(dto.categoryId, tenantId);
      if (!category) throw new NotFoundException('Category not found');
    }

    const { imageUrl, ...updateData } = dto;
    
    let imageIdUpdate: { imageId?: string | null } = {};
    if (imageUrl !== undefined) {
      if (imageUrl === '') {
        imageIdUpdate = { imageId: null };
      } else {
        const media = await this.prisma.media.findFirst({ where: { url: imageUrl, tenantId } });
        if (media) {
          imageIdUpdate = { imageId: media.id };
        } else {
          const newMedia = await this.prisma.media.create({
            data: {
              url: imageUrl,
              name: 'Service Image',
              tenant: { connect: { id: tenantId } },
              mimeType: 'image/jpeg',
              originalName: 'service-image.jpg',
              extension: '.jpg',
              size: 0,
            }
          });
          imageIdUpdate = { imageId: newMedia.id };
        }
      }
    }

    return this.repository.update(id, { ...updateData, ...imageIdUpdate });
  }

  async remove(id: string, tenantId: string, barberId?: string | null) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service || service.deletedAt) throw new NotFoundException('Service not found');
    if (service.tenantId !== tenantId) throw new ForbiddenException('Forbidden');
    if (barberId && service.barberId !== barberId) throw new ForbiddenException('Acesso negado: Você não pode excluir este serviço.');

    return this.repository.update(id, { deletedAt: new Date(), isActive: false });
  }

  async reorder(tenantId: string, dto: ReorderDto, barberId?: string | null) {
    await this.repository.reorder(tenantId, dto.items);
    return { message: 'Services reordered successfully' };
  }
}

