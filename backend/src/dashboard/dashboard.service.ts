import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IDashboardRepository } from './repositories/dashboard.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    @Inject('DASHBOARD_REPOSITORY') private readonly dashboardRepository: IDashboardRepository,
    private readonly prisma: PrismaService
  ) {}

  async getBarberIdFromUserId(userId: string, tenantId: string): Promise<string | undefined> {
    const barber = await this.prisma.barber.findFirst({
      where: { userId, tenantId, deletedAt: null }
    });
    return barber?.id;
  }

  async getMetrics(tenantId: string, barberId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(startOfWeek.getDate() - today.getDay());

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(thirtyDaysAgo);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 30);

    const [
      revToday, revWeek, revMonth, prevMonth,
      appointmentsCount, totalCustomersCount, inactiveCustomersCount,
      transactionsToday, topBarberQuery, topServiceQuery
    ] = await Promise.all([
      this.dashboardRepository.getIncomeSum(tenantId, today, undefined, barberId),
      this.dashboardRepository.getIncomeSum(tenantId, startOfWeek, undefined, barberId),
      this.dashboardRepository.getIncomeSum(tenantId, startOfMonth, undefined, barberId),
      this.dashboardRepository.getIncomeSum(tenantId, sixtyDaysAgo, thirtyDaysAgo, barberId),
      
      this.dashboardRepository.getCompletedAppointmentsCount(tenantId, barberId),
      this.dashboardRepository.getTotalCustomersCount(tenantId, barberId),
      this.dashboardRepository.getInactiveCustomersCount(tenantId, thirtyDaysAgo, barberId),
      
      this.dashboardRepository.getTransactions(tenantId, 'INCOME', today, barberId),
      
      this.dashboardRepository.getTopBarber(tenantId, today, tomorrow),
      this.dashboardRepository.getTopService(tenantId, today, tomorrow, barberId)
    ]);

    let pixTotal = 0;
    transactionsToday.forEach(t => {
      if (t.paymentMethod === 'PIX') pixTotal += Number(t.amount);
    });

    const pixPercentage = revToday > 0 ? Math.round((pixTotal / revToday) * 100) : 0;
    const isAboveAverage = prevMonth > 0 && revMonth > prevMonth;
    const growthPercent = prevMonth > 0 ? Math.round(((revMonth - prevMonth) / prevMonth) * 100) : 0;

    let topBarberName = 'Nenhum';
    if (topBarberQuery) {
      topBarberName = `${topBarberQuery.user.firstName}`;
    }

    let topServiceName = 'Nenhum';
    let topServiceCount = 0;
    let topServicePercent = 0;
    if (topServiceQuery) {
      topServiceName = topServiceQuery.service.name;
      topServiceCount = topServiceQuery.count;
      const totalCompletedToday = transactionsToday.length; // Approximate
      topServicePercent = totalCompletedToday > 0 ? Math.round((topServiceCount / totalCompletedToday) * 100) : 0;
    }

    const insights = [
      `Hoje faturou R$ ${revToday.toFixed(2).replace('.', ',')}`,
      pixPercentage > 0 ? `PIX representa ${pixPercentage}% das vendas de hoje.` : 'Sem pagamentos via PIX hoje.',
      topBarberName !== 'Nenhum' ? `O barbeiro ${topBarberName} realizou mais atendimentos hoje.` : 'Nenhum atendimento finalizado hoje.',
      inactiveCustomersCount > 0 ? `${inactiveCustomersCount} clientes não voltam há mais de 30 dias.` : 'Todos os clientes ativos.',
      topServiceName !== 'Nenhum' ? `O serviço ${topServiceName} representa ${topServicePercent}% dos agendamentos de hoje.` : '',
      isAboveAverage ? `O faturamento do mês aumentou ${growthPercent}% em relação aos 30 dias anteriores.` : ''
    ].filter(Boolean);

    return {
      revenue: { today: revToday, week: revWeek, month: revMonth },
      ticketMedio: appointmentsCount > 0 ? (revMonth / appointmentsCount) : 0,
      insights
    };
  }

  async getCashRegister(tenantId: string, barberId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const transactions = await this.dashboardRepository.getTransactions(tenantId, undefined as any, today, barberId); // pass undefined for all types, wait need to handle it

    let received = 0;
    let cancelled = 0;
    let totalSales = 0;
    
    const paymentMethods: any = { PIX: 0, CREDIT: 0, DEBIT: 0, CASH: 0 };

    transactions.forEach(t => {
      const amount = Number(t.amount);
      if (t.type === 'INCOME') {
        received += amount;
        totalSales++;
        if (t.paymentMethod && paymentMethods[t.paymentMethod] !== undefined) {
          paymentMethods[t.paymentMethod] += amount;
        }
      } else if (t.type === 'REFUND') {
        cancelled += amount;
      }
    });

    const appointmentsToday = await this.dashboardRepository.getAppointments(tenantId, today, undefined, 'COMPLETED', barberId);
    const discounts = appointmentsToday.reduce((acc, app) => acc + (app.discount ? Number(app.discount) : 0), 0);

    return {
      dinheiro: paymentMethods.CASH,
      pix: paymentMethods.PIX,
      credito: paymentMethods.CREDIT,
      debito: paymentMethods.DEBIT,
      quantidadeVendas: totalSales,
      valorRecebido: received,
      descontos: discounts,
      cancelamentos: cancelled,
      totalLiquido: received - cancelled - discounts
    };
  }

  async getAgenda(tenantId: string, barberId?: string) {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await this.dashboardRepository.getAppointments(tenantId, today, tomorrow, undefined, barberId);

    let proximoCliente = null;
    let clienteAtrasado = null;
    let totalComparecimento = 0;
    let totalFaltas = 0;
    let somaAtrasosMinutos = 0;
    let quantidadeAtrasos = 0;

    appointments.forEach((app: any) => {
      if (app.status === 'COMPLETED' || app.status === 'CHECKED_IN' || app.status === 'IN_PROGRESS') {
        totalComparecimento++;
        if (app.checkedInAt && app.startDateTime) {
          const diffMs = app.checkedInAt.getTime() - app.startDateTime.getTime();
          if (diffMs > 0) {
            somaAtrasosMinutos += Math.floor(diffMs / 60000);
            quantidadeAtrasos++;
          }
        }
      } else if (app.status === 'NO_SHOW') {
        totalFaltas++;
      }

      if (!proximoCliente && app.startDateTime >= now && (app.status === 'PENDING' || app.status === 'CONFIRMED')) {
        proximoCliente = app;
      }
      if (!clienteAtrasado && app.startDateTime < now && (app.status === 'PENDING' || app.status === 'CONFIRMED')) {
        clienteAtrasado = app;
      }
    });

    const tempoMedioAtraso = quantidadeAtrasos > 0 ? Math.round(somaAtrasosMinutos / quantidadeAtrasos) : 0;
    const taxaComparecimento = (totalComparecimento + totalFaltas) > 0 ? Math.round((totalComparecimento / (totalComparecimento + totalFaltas)) * 100) : 100;
    const taxaFaltas = 100 - taxaComparecimento;

    const horarioLivreSeguinte = proximoCliente ? 
      new Date(proximoCliente.startDateTime.getTime() + 30 * 60000) : 
      new Date(now.getTime() + 30 * 60000);

    const busyBarberIds = appointments.filter((a: any) => a.status === 'IN_PROGRESS' || (a.startDateTime <= now && a.endDateTime >= now)).map((a: any) => a.barberId);
    const freeBarber = await this.dashboardRepository.getFreeBarber(tenantId, busyBarberIds);

    return {
      proximoCliente: proximoCliente ? proximoCliente.startDateTime : null,
      clienteAtrasado: clienteAtrasado ? clienteAtrasado.startDateTime : null,
      horarioLivreSeguinte,
      barbeiroDisponivelAgora: freeBarber ? `${freeBarber.user.firstName} ${freeBarber.user.lastName}` : null,
      tempoMedioAtraso,
      taxaComparecimento,
      taxaFaltas
    };
  }

  async getCrm(tenantId: string, barberId?: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const currentMonth = new Date().getMonth() + 1;

    const users = await this.dashboardRepository.getUsersForCrm(tenantId, barberId);

    let vips = 0;
    let recorrentes = 0;
    let inativos = 0;
    let novos = 0;
    let aniversariantes = 0;
    let compramProdutos = 0;

    users.forEach((user: any) => {
      const apptCount = user.appointments.length;
      if (apptCount === 0 && user.orders.length === 0) return;

      const lastAppt = apptCount > 0 ? user.appointments[0].startDateTime : null;
      let totalGasto = user.appointments.reduce((sum: number, a: any) => sum + (a.amountPaid ? Number(a.amountPaid) : 0), 0);
      totalGasto += user.orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);

      if (user.birthDate && (user.birthDate.getMonth() + 1) === currentMonth) aniversariantes++;
      if (user.orders.length > 0) compramProdutos++;

      if (apptCount === 1) novos++;
      if (apptCount >= 5 || totalGasto > 500) vips++;
      
      if (lastAppt && lastAppt < thirtyDaysAgo) inativos++;
      if (lastAppt && lastAppt >= thirtyDaysAgo && apptCount > 1) recorrentes++;
    });

    return {
      clientesVIP: vips,
      clientesRecorrentes: recorrentes,
      clientesInativos: inativos,
      clientesNovos: novos,
      clientesAniversariantes: aniversariantes,
      clientesCompramProdutos: compramProdutos
    };
  }

  async getDetailedFinancial(tenantId: string, period: string, barberId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let start = new Date(today.getFullYear(), today.getMonth(), 1);
    let end = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    if (period === 'Hoje') {
      start = new Date(today);
      end = new Date(today);
      end.setDate(end.getDate() + 1);
    } else if (period === 'Essa Semana') {
      start = new Date(today);
      start.setDate(start.getDate() - today.getDay());
      end = new Date(start);
      end.setDate(end.getDate() + 7);
    } else if (period === 'Este Mês') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    } else if (period === 'Mês Passado') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (period === 'Este Ano') {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear() + 1, 0, 1);
    }

    const txWhere: any = { tenantId, createdAt: { gte: start, lt: end } };
    const appWhere: any = { tenantId, startDateTime: { gte: start, lt: end } };

    if (barberId) {
      appWhere.barberId = barberId;
      
      const barberOrders = await this.prisma.order.findMany({
        where: { tenantId, barberId, createdAt: { gte: start, lt: end } },
        select: { id: true }
      });

      const barberCourses = await this.prisma.course.findMany({
        where: { tenantId, barberId },
        select: { title: true }
      });
      
      const orConditions: any[] = [ { appointment: { barberId } } ];
      barberOrders.forEach(o => {
         orConditions.push({ description: { contains: o.id } });
      });
      barberCourses.forEach(c => {
         orConditions.push({ description: { contains: `Curso: ${c.title}` } });
      });
      
      txWhere.OR = orConditions;
    }

    const transactions = await this.prisma.financialTransaction.findMany({
      where: txWhere,
      orderBy: { createdAt: 'desc' }
    });

    const appointments = await this.prisma.appointment.findMany({
      where: appWhere,
      include: { service: true }
    });

    let totalRevenue = 0;
    let servicesRevenue = 0;
    let productsRevenue = 0;
    let academyRevenue = 0;
    let predictedRevenue = 0;
    let qtySales = 0;
    let qtyCourses = 0;
    let qtyServices = 0;
    let qtyOrders = 0;

    const history = transactions.map(t => {
      let origin = 'Outros';
      if (t.description?.includes('Serviço') || t.appointmentId) {
        origin = 'Serviço/Corte';
        if (t.type === 'INCOME') {
            servicesRevenue += Number(t.amount);
            qtyServices++;
        }
      } else if (t.description?.includes('Order') || t.description?.includes('Store')) {
        origin = 'Produto';
        if (t.type === 'INCOME') {
            productsRevenue += Number(t.amount);
            qtyOrders++;
        }
      } else if (t.description?.includes('Academy') || t.description?.includes('Curso')) {
        origin = 'Curso';
        if (t.type === 'INCOME') {
            academyRevenue += Number(t.amount);
            qtyCourses++;
        }
      }

      if (t.type === 'INCOME') {
        totalRevenue += Number(t.amount);
        qtySales++;
      } else if (t.type === 'REFUND') {
        totalRevenue -= Number(t.amount);
      }

      return {
        id: t.id,
        date: t.createdAt,
        description: t.description || 'Sem descrição',
        origin,
        amount: Number(t.amount),
        type: t.type,
        paymentMethod: t.paymentMethod
      };
    });

    const scheduledAppointments = appointments.length;
    appointments.forEach(a => {
        if (a.status === 'PENDING' || a.status === 'CONFIRMED') {
            predictedRevenue += Number(a.service?.price || 0);
        }
    });

    return {
      totalRevenue: { value: totalRevenue },
      servicesRevenue: { value: servicesRevenue },
      productsRevenue: { value: productsRevenue },
      academyRevenue: { value: academyRevenue },
      predictedRevenue: { value: predictedRevenue },
      summary: { qtySales, qtyCourses, qtyServices, qtyOrders, scheduledAppointments },
      history
    };
  }

  async getRanking(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const [topBarbersData, topServicesData] = await Promise.all([
      this.dashboardRepository.getTopBarbers(tenantId, startOfMonth, endOfMonth, 5),
      this.dashboardRepository.getTopServices(tenantId, startOfMonth, endOfMonth, 5)
    ]);

    const topBarbers = topBarbersData.map(b => ({
      name: `${b.barber.user.firstName} ${b.barber.user.lastName}`,
      role: 'Barbeiro',
      value: `R$ ${(Number(b.revenue) || 0).toFixed(2).replace('.', ',')}`,
      score: b.count,
      avatar: b.barber.user.firstName.charAt(0).toUpperCase()
    }));

    const topServices = topServicesData.map(s => ({
      name: s.service.name,
      count: s.count,
      revenue: Number(s.revenue) || 0
    }));

    return { topBarbers, topServices };
  }

  async getGrowth(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const [revMonth, revPrevMonth, customersCount, prevCustomersCount] = await Promise.all([
      this.dashboardRepository.getIncomeSum(tenantId, startOfMonth),
      this.dashboardRepository.getIncomeSum(tenantId, startOfPrevMonth, startOfMonth),
      this.dashboardRepository.getTotalCustomersCount(tenantId),
      this.dashboardRepository.getTotalCustomersCount(tenantId) // We will use same count if we don't have historical snapshot
    ]);

    const monthlyGrowth = revPrevMonth > 0 ? ((revMonth - revPrevMonth) / revPrevMonth) * 100 : (revMonth > 0 ? 100 : 0);
    const newCustomers = customersCount - prevCustomersCount > 0 ? customersCount - prevCustomersCount : 0;

    return {
      monthlyGrowth: Number(monthlyGrowth.toFixed(1)),
      newCustomers
    };
  }

  async getCustomersList(tenantId: string, barberId?: string) {
    const customers = await this.dashboardRepository.getCustomersList(tenantId, barberId);
    
    return customers.map(c => {
      let ltv = c.appointments.reduce((sum: number, a: any) => sum + (a.amountPaid ? Number(a.amountPaid) : 0), 0);
      ltv += c.orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
      
      const lastVisit = c.appointments.length > 0 ? c.appointments[0].startDateTime : null;
      
      return {
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        birthDate: c.birthDate,
        isActive: c.isActive,
        subscription: c.subscription,
        ltv,
        lastVisit
      };
    });
  }

  async getCustomerProfile(tenantId: string, customerId: string, barberId?: string) {
    const c = await this.dashboardRepository.getCustomerProfile(tenantId, customerId, barberId);
    if (!c) return null;

    let ltv = c.appointments.reduce((sum: number, a: any) => sum + (a.amountPaid ? Number(a.amountPaid) : 0), 0);
    ltv += c.orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);

    const history = c.appointments.map((a: any) => ({
      date: a.startDateTime,
      service: a.service?.name || 'Serviço',
      amount: a.amountPaid ? Number(a.amountPaid) : 0,
      barber: a.barber?.user?.firstName || 'Barbeiro'
    }));

    const products: any[] = [];
    c.orders.forEach((o: any) => {
      o.items.forEach((item: any) => {
        products.push({ name: item.product?.name || 'Produto', date: o.createdAt });
      });
    });

    const apptCount = c.appointments.length;
    let frequency = 'Novo Cliente';
    if (apptCount > 3) {
      frequency = 'Cliente Assíduo';
    } else if (apptCount > 1) {
      frequency = 'Cliente Recorrente';
    }

    return {
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      birthDate: c.birthDate,
      ltv,
      lastVisit: c.appointments.length > 0 ? c.appointments[0].startDateTime : null,
      frequency,
      notes: 'Cliente prefere atendimento personalizado.', // Hardcoded since we don't have a notes field yet
      history,
      products,
      courses: [] // Hardcoded since enrollments are not strictly linked yet
    };
  }

  async createCustomer(tenantId: string, data: any) {
    const argon2 = await import('argon2');
    const prisma = (this.dashboardRepository as any).prisma;
    
    let customerRole = await prisma.role.findFirst({
      where: { name: 'CUSTOMER', tenantId }
    });
    
    if (!customerRole) {
      customerRole = await prisma.role.findFirst({
        where: { name: 'CUSTOMER' }
      });
    }

    const passwordHash = await argon2.hash(data.password || 'senha123');

    return prisma.user.create({
      data: {
        tenantId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        passwordHash,
        userRoles: {
          create: {
            roleId: customerRole?.id
          }
        }
      }
    });
  }

  async manualUpdateSubscription(tenantId: string, customerId: string, plan: string) {
    const prisma = (this.dashboardRepository as any).prisma;
    if (!plan || plan === 'COMUM') {
      return prisma.userSubscription.delete({
        where: { userId: customerId }
      }).catch(() => null);
    }
    
    const sub = await prisma.userSubscription.upsert({
      where: { userId: customerId },
      update: {
        plan,
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      create: {
        userId: customerId,
        plan,
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // Fetch prices dynamically from DB so the financial record is always accurate
    const settings = await prisma.siteSettings.findFirst({
      select: { vipPrataPrice: true, vipOuroPrice: true }
    });
    const amount = plan === 'VIP_PRATA'
      ? (settings?.vipPrataPrice ?? 120)
      : (settings?.vipOuroPrice ?? 150);

    await prisma.financialTransaction.create({
      data: {
        tenantId,
        amount: Number(amount),
        type: 'INCOME',
        paymentMethod: 'CASH',
        description: `Pagamento Manual Assinatura ${plan.replace('_', ' ')}`,
      }
    });

    return sub;
  }


  async toggleCustomerBan(tenantId: string, customerId: string, isActive: boolean) {
    const prisma = (this.dashboardRepository as any).prisma;
    const finalIsActive = isActive !== undefined ? isActive : false;
    return prisma.user.update({
      where: { id: customerId },
      data: { 
        isActive: finalIsActive,
        isManualBan: !finalIsActive 
      }
    });
  }
}
