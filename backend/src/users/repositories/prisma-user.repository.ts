import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IUserRepository } from './user.repository.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<any> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { userRoles: { include: { role: true } } },
    });
  }

  async findById(id: string): Promise<any> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });
  }

  async findByIdAndTenant(id: string, tenantId: string): Promise<any> {
    const record = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!record) throw new NotFoundException('Record not found');
    return record;
  }

  async findActiveById(id: string): Promise<any> {
    return this.prisma.user.findUnique({
      where: { id, isActive: true, deletedAt: null },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findAll(tenantId: string, paginationDto: PaginationDto, searchFields: string[] = []): Promise<any> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = { tenantId, deletedAt: null };

    if (search && searchFields.length > 0) {
      where.OR = searchFields.map(field => ({
        [field]: { contains: search, mode: 'insensitive' },
      }));
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(tenantId: string, data: any): Promise<any> {
    return this.prisma.user.create({
      data: { ...data, tenantId },
    });
  }

  async update(id: string, tenantId: string, data: any): Promise<any> {
    await this.findByIdAndTenant(id, tenantId);
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, tenantId: string): Promise<any> {
    await this.findByIdAndTenant(id, tenantId);
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async registerNewTenantAndUser(
    tenantName: string,
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    passwordHash: string,
  ): Promise<any> {
    return this.prisma.$transaction(async (prisma) => {
      const tenant = await prisma.tenant.create({
        data: { name: tenantName },
      });

      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          passwordHash,
          tenantId: tenant.id,
        },
      });

      const officialRoles = ['OWNER', 'BARBER', 'EMPLOYEE', 'CUSTOMER'];
      for (const roleName of officialRoles) {
        await prisma.role.upsert({
          where: { name_tenantId: { name: roleName, tenantId: tenant.id } },
          update: {},
          create: { name: roleName, tenantId: tenant.id },
        });
      }

      const customerRole = await prisma.role.findUnique({
        where: { name_tenantId: { name: 'CUSTOMER', tenantId: tenant.id } },
      });

      if (customerRole) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: customerRole.id,
          },
        });
      }

      return user;
    });
  }

  /**
   * Register a customer in the EXISTING (main) barbershop tenant.
   * This is the correct registration flow for a single-tenant barbershop app.
   * Unlike registerNewTenantAndUser(), this does NOT create a new tenant,
   * so all customers are visible to the admin panel under the same tenant.
   */
  async registerCustomerInExistingTenant(
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    passwordHash: string,
  ): Promise<any> {
    return this.prisma.$transaction(async (prisma) => {
      // Find the main/first tenant (the barbershop)
      const mainTenant = await prisma.tenant.findFirst({
        orderBy: { createdAt: 'asc' }
      });

      if (!mainTenant) {
        throw new Error('No tenant found. Please set up the barbershop first.');
      }

      // NOVO: Validação rígida contra duplicidade de e-mail e telefone normalizados
      // Mesmo que o banco tenha telefones não padronizados, essa query remove caracteres não numéricos antes de comparar.
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPhone = phone ? phone.replace(/\D/g, '') : '';
      
      const duplicates: any[] = await prisma.$queryRaw`
        SELECT id FROM users
        WHERE "tenantId" = ${mainTenant.id}
        AND (
          LOWER("email") = ${normalizedEmail}
          OR (
            "phone" IS NOT NULL
            AND "phone" != ''
            AND REGEXP_REPLACE("phone", '\\D', '', 'g') = ${normalizedPhone}
            AND ${normalizedPhone} != ''
          )
        )
        LIMIT 1
      `;

      if (duplicates && duplicates.length > 0) {
        // We throw an exact user-friendly message as requested.
        // It should be caught by NestJS exception filters and returned as 400 or 401.
        // Using UnauthorizedException because it aligns with Auth rules, or BadRequestException.
        // We'll throw a standard Error that we can catch or let NestJS handle.
        // To be safer and return a proper HTTP response, we should import BadRequestException or UnauthorizedException.
        // Since PrismaUserRepository imports NotFoundException, we can use an exception from @nestjs/common.
        throw new BadRequestException('Já existe uma conta cadastrada com estes dados. Acesse sua conta existente ou recupere sua senha.');
      }

      // Find the CUSTOMER role for this tenant
      const customerRole = await prisma.role.findFirst({
        where: { name: 'CUSTOMER', tenantId: mainTenant.id }
      });

      if (!customerRole) {
        throw new Error(`CUSTOMER role not found for tenant ${mainTenant.id}`);
      }

      // Create the user in the MAIN tenant
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          passwordHash,
          tenantId: mainTenant.id,
          userRoles: {
            create: { roleId: customerRole.id }
          }
        },
      });

      return user;
    });
  }

  async getDashboardData(userId: string): Promise<any> {

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        appointments: {
          orderBy: { startDateTime: 'desc' },
          take: 10,
          include: { barber: true, service: true },
        },
        favorites: {
          include: { product: true },
        },
        subscription: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const recommendedProducts = await this.prisma.product.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    const u: any = user;

    return {
      history: u.appointments,
      lastAppointment: u.appointments.length > 0 ? u.appointments[0] : null,
      wallet: u.walletBalance,
      cashback: u.cashbackBalance,
      loyalty: {
        points: u.points,
        level: u.loyaltyLevel,
      },
      clubeImperio: u.subscription,
      favoriteProducts: u.favorites ? u.favorites.map((f: any) => f.product) : [],
      recommendedProducts,
    };
  }
}


