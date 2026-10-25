import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface IDashboardRepository {
  getIncomeSum(tenantId: string, from: Date, to?: Date, barberId?: string): Promise<number>;
  getCompletedAppointmentsCount(tenantId: string, barberId?: string): Promise<number>;
  getTotalCustomersCount(tenantId: string, barberId?: string): Promise<number>;
  getInactiveCustomersCount(tenantId: string, inactiveSince: Date, barberId?: string): Promise<number>;
  getTransactions(tenantId: string, type: string, from: Date, barberId?: string): Promise<any[]>;
  getTopBarber(tenantId: string, from: Date, to: Date): Promise<any>;
  getTopService(tenantId: string, from: Date, to: Date, barberId?: string): Promise<any>;
  getTopBarbers(tenantId: string, from: Date, to: Date, take: number): Promise<any[]>;
  getTopServices(tenantId: string, from: Date, to: Date, take: number, barberId?: string): Promise<any[]>;
  getAppointments(tenantId: string, from: Date, to: Date, status?: string, barberId?: string): Promise<any[]>;
  getFreeBarber(tenantId: string, busyBarberIds: string[]): Promise<any>;
  getUsersForCrm(tenantId: string, barberId?: string): Promise<any[]>;
  getCustomersList(tenantId: string, barberId?: string): Promise<any[]>;
  getCustomerProfile(tenantId: string, customerId: string, barberId?: string): Promise<any>;
}

@Injectable()
export class DashboardRepository implements IDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getIncomeSum(tenantId: string, from: Date, to?: Date, barberId?: string): Promise<number> {
    const where: any = { tenantId, type: 'INCOME', createdAt: { gte: from } };
    if (to) where.createdAt.lt = to;
    
    if (barberId) {
      const barberOrders = await this.prisma.order.findMany({ where: { tenantId, barberId, createdAt: { gte: from, ...(to ? { lt: to } : {}) } }, select: { id: true } });
      const barberCourses = await this.prisma.course.findMany({ where: { tenantId, barberId }, select: { title: true } });
      
      const orConditions: any[] = [ { appointment: { barberId } } ];
      barberOrders.forEach(o => orConditions.push({ description: { contains: o.id } }));
      barberCourses.forEach(c => orConditions.push({ description: { contains: `Curso: ${c.title}` } }));
      
      where.OR = orConditions;
    }
    const agg = await this.prisma.financialTransaction.aggregate({ where, _sum: { amount: true } });
    const financialSum = agg._sum.amount ? Number(agg._sum.amount) : 0;

    // Se for barberId, já capturamos as orders na financialTransaction sum! 
    // Wait, if OWNER (barberId undefined), we also captured ALL orders in financialTransaction!
    // We should NOT add orderSum again! Because they are already in financialTransaction.
    return financialSum;
  }

  async getCompletedAppointmentsCount(tenantId: string, barberId?: string): Promise<number> {
    const where: any = { tenantId, status: 'COMPLETED' };
    if (barberId) where.barberId = barberId;
    return this.prisma.appointment.count({ where });
  }

  async getTotalCustomersCount(tenantId: string, barberId?: string): Promise<number> {
    const where: any = { tenantId, userRoles: { some: { role: { name: 'CUSTOMER' } } }, deletedAt: null };
    return this.prisma.user.count({ where });
  }

  async getInactiveCustomersCount(tenantId: string, inactiveSince: Date, barberId?: string): Promise<number> {
    const where: any = { 
      tenantId, 
      userRoles: { some: { role: { name: 'CUSTOMER' } } }, 
      deletedAt: null,
      appointments: { none: { startDateTime: { gte: inactiveSince } } }
    };
    return this.prisma.user.count({ where });
  }

  async getTransactions(tenantId: string, type: any, from: Date, barberId?: string): Promise<any[]> {
    const where: any = { tenantId, createdAt: { gte: from } };
    if (type !== undefined) where.type = type;
    
    if (barberId) {
      const barberOrders = await this.prisma.order.findMany({ where: { tenantId, barberId, createdAt: { gte: from } }, select: { id: true } });
      const barberCourses = await this.prisma.course.findMany({ where: { tenantId, barberId }, select: { title: true } });
      
      const orConditions: any[] = [ { appointment: { barberId } } ];
      barberOrders.forEach(o => orConditions.push({ description: { contains: o.id } }));
      barberCourses.forEach(c => orConditions.push({ description: { contains: `Curso: ${c.title}` } }));
      
      where.OR = orConditions;
    }
    return this.prisma.financialTransaction.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async getTopBarber(tenantId: string, from: Date, to: Date): Promise<any> {
    const query = await this.prisma.appointment.groupBy({ by: ['barberId'], where: { tenantId, startDateTime: { gte: from, lt: to }, status: 'COMPLETED' }, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 1 });
    if (query.length > 0) {
      return this.prisma.barber.findUnique({ where: { id: query[0].barberId }, include: { user: true } });
    }
    return null;
  }

  async getTopService(tenantId: string, from: Date, to: Date, barberId?: string): Promise<any> {
    const where: any = { tenantId, startDateTime: { gte: from, lt: to }, status: 'COMPLETED' };
    if (barberId) where.barberId = barberId;
    const query = await this.prisma.appointment.groupBy({ by: ['serviceId'], where, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 1 });
    if (query.length > 0) {
      const s = await this.prisma.service.findUnique({ where: { id: query[0].serviceId } });
      return { service: s, count: query[0]._count.id };
    }
    return null;
  }

  async getTopBarbers(tenantId: string, from: Date, to: Date, take: number): Promise<any[]> {
    const query = await this.prisma.appointment.groupBy({ by: ['barberId'], where: { tenantId, startDateTime: { gte: from, lt: to }, status: 'COMPLETED' }, _count: { id: true }, _sum: { amountPaid: true }, orderBy: { _count: { id: 'desc' } }, take });
    
    return Promise.all(query.map(async q => {
      const barber = await this.prisma.barber.findUnique({ where: { id: q.barberId }, include: { user: true } });
      return { barber, count: q._count.id, revenue: q._sum.amountPaid || 0 };
    }));
  }

  async getTopServices(tenantId: string, from: Date, to: Date, take: number, barberId?: string): Promise<any[]> {
    const where: any = { tenantId, startDateTime: { gte: from, lt: to }, status: 'COMPLETED' };
    if (barberId) where.barberId = barberId;
    const query = await this.prisma.appointment.groupBy({ by: ['serviceId'], where, _count: { id: true }, _sum: { amountPaid: true }, orderBy: { _count: { id: 'desc' } }, take });
    
    return Promise.all(query.map(async q => {
      const service = await this.prisma.service.findUnique({ where: { id: q.serviceId } });
      return { service, count: q._count.id, revenue: q._sum.amountPaid || 0 };
    }));
  }

  async getAppointments(tenantId: string, from: Date, to?: Date, status?: any, barberId?: string): Promise<any[]> {
    const where: any = { tenantId, startDateTime: { gte: from } };
    if (to) where.startDateTime.lt = to;
    if (status) where.status = status;
    if (barberId) where.barberId = barberId;
    return this.prisma.appointment.findMany({ where, include: { barber: { include: { user: true } } }, orderBy: { startDateTime: 'asc' } });
  }

  async getFreeBarber(tenantId: string, busyBarberIds: string[]): Promise<any> {
    return this.prisma.barber.findFirst({
      where: { tenantId, id: { notIn: busyBarberIds }, isActive: true },
      include: { user: true }
    });
  }

  async getUsersForCrm(tenantId: string, barberId?: string): Promise<any[]> {
    const where: any = { tenantId, userRoles: { some: { role: { name: 'CUSTOMER' } } } };
    
    // As per user request: "conexao direta entre owner, barbeiro colaborador e clientes"
    // We allow the barber to see all customers of the tenant, not just the ones they attended.
    // if (barberId) {
    //   where.appointments = { some: { barberId } };
    // }
    
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        birthDate: true,
        appointments: {
          where: barberId ? { tenantId, barberId, status: 'COMPLETED' } : { tenantId, status: 'COMPLETED' },
          orderBy: { startDateTime: 'desc' },
          select: { startDateTime: true, amountPaid: true }
        },
        orders: {
          where: barberId ? { tenantId, barberId, status: 'PAID' } : { tenantId, status: 'PAID' },
          select: { totalAmount: true }
        }
      }
    });
  }

  async getCustomersList(tenantId: string, barberId?: string): Promise<any[]> {
    const where: any = { tenantId, userRoles: { some: { role: { name: 'CUSTOMER' } } }, deletedAt: null };
    
    // As per user request: "os clientes da barbearia do imperador nao vieram pra o server do barbeiro colaborador"
    // We allow the barber to see all customers of the tenant, not just the ones they attended.
    // if (barberId) {
    //   where.appointments = { some: { barberId } };
    // }
    
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        birthDate: true,
        isActive: true,
        appointments: {
          where: barberId ? { tenantId, barberId, status: 'COMPLETED' } : { tenantId, status: 'COMPLETED' },
          orderBy: { startDateTime: 'desc' },
          take: 1,
          select: { startDateTime: true, amountPaid: true }
        },
        orders: {
          where: barberId ? { tenantId, barberId, status: 'PAID' } : { tenantId, status: 'PAID' },
          select: { totalAmount: true }
        },
        subscription: true
      }
    });
  }

  async getCustomerProfile(tenantId: string, customerId: string, barberId?: string): Promise<any> {
    const where: any = { id: customerId, tenantId, deletedAt: null };
    // As per user request: "conexao direta entre owner, barbeiro colaborador e clientes"
    // We allow the barber to see all customers of the tenant, not just the ones they attended.
    // if (barberId) {
    //   where.appointments = { some: { barberId } };
    // }
    return this.prisma.user.findFirst({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        birthDate: true,
        isActive: true,
        appointments: {
          where: barberId ? { tenantId, barberId, status: 'COMPLETED' } : { tenantId, status: 'COMPLETED' },
          orderBy: { startDateTime: 'desc' },
          select: { startDateTime: true, amountPaid: true, service: { select: { name: true } }, barber: { select: { user: { select: { firstName: true } } } } }
        },
        orders: {
          where: barberId ? { tenantId, barberId, status: 'PAID' } : { tenantId, status: 'PAID' },
          orderBy: { createdAt: 'desc' },
          select: { totalAmount: true, createdAt: true, items: { select: { product: { select: { name: true } } } } }
        },
        subscription: true
      }
    });
  }
}
