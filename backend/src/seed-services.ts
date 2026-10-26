import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Services and Assigning Admin Roles ---');
  
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error('No tenant found');

  const barber = await prisma.barber.findFirst();
  console.log(`Using Tenant: ${tenant.name} (${tenant.id})`);
  console.log(`Using Barber: ${barber?.id || 'none'}`);

  // 1. Ensure Categories
  const categoriesData = [
    { name: 'Cabelo', description: 'Cortes clássicos, modernos e acabamentos', displayOrder: 1 },
    { name: 'Barba', description: 'Barboterapia, alinhamento e cuidados com a barba', displayOrder: 2 },
    { name: 'Combos & Especiais', description: 'Pacotes completos para cuidar do visual', displayOrder: 3 },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const existing = await prisma.serviceCategory.findFirst({
      where: { name: cat.name, tenantId: tenant.id }
    });
    if (existing) {
      categories[cat.name] = existing.id;
    } else {
      const created = await prisma.serviceCategory.create({
        data: {
          name: cat.name,
          description: cat.description,
          displayOrder: cat.displayOrder,
          tenantId: tenant.id,
        }
      });
      categories[cat.name] = created.id;
    }
  }

  // 2. Services Data
  const servicesData = [
    {
      name: 'Corte Tradicional / Social',
      description: 'Corte clássico com tesoura e máquina, finalizado com produtos premium.',
      duration: 30,
      price: 45.00,
      categoryName: 'Cabelo',
    },
    {
      name: 'Degradê / Fade Navalhado',
      description: 'Fade moderno com transição perfeita na navalha e finalização impecável.',
      duration: 45,
      price: 50.00,
      categoryName: 'Cabelo',
    },
    {
      name: 'Barba Terapia Completa',
      description: 'Toalha quente com óleos essenciais, massagem facial, alinhamento na navalha e pós-barba.',
      duration: 35,
      price: 35.00,
      categoryName: 'Barba',
    },
    {
      name: 'Pezinho / Acabamento',
      description: 'Alinhamento dos contornos do cabelo e nuca com navalha.',
      duration: 15,
      price: 20.00,
      categoryName: 'Cabelo',
    },
    {
      name: 'Combo Cabelo + Barba Terapia',
      description: 'Corte completo à sua escolha + barboterapia completa relaxante.',
      duration: 60,
      price: 75.00,
      categoryName: 'Combos & Especiais',
    },
    {
      name: 'Sobrancelha na Navalha',
      description: 'Design e alinhamento masculino na navalha.',
      duration: 15,
      price: 15.00,
      categoryName: 'Cabelo',
    },
    {
      name: 'Platinado / Pigmentação',
      description: 'Descoloração global ou pigmentação de barba/cabelo para disfarçar falhas.',
      duration: 90,
      price: 90.00,
      categoryName: 'Combos & Especiais',
    },
  ];

  for (const s of servicesData) {
    const existing = await prisma.service.findFirst({
      where: { name: s.name, tenantId: tenant.id }
    });

    if (!existing) {
      await prisma.service.create({
        data: {
          name: s.name,
          description: s.description,
          duration: s.duration,
          price: s.price,
          categoryId: categories[s.categoryName],
          tenantId: tenant.id,
          barberId: barber?.id || null,
          isActive: true,
        }
      });
      console.log(`Created service: ${s.name} (R$ ${s.price})`);
    } else {
      console.log(`Service already exists: ${s.name}`);
    }
  }

  // 3. Ensure SUPER_ADMIN role for jackson.tcrx@gmail.com as well
  const superAdminRole = await prisma.role.findFirst({ where: { name: 'SUPER_ADMIN' } });
  if (superAdminRole) {
    const emailsToMakeAdmin = ['admin@imperio.system', 'admin@imperio.com', 'jackson.tcrx@gmail.com'];
    for (const email of emailsToMakeAdmin) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await prisma.userRole.upsert({
          where: {
            userId_roleId: {
              userId: user.id,
              roleId: superAdminRole.id,
            }
          },
          update: {},
          create: {
            userId: user.id,
            roleId: superAdminRole.id,
          }
        });
        console.log(`Granted SUPER_ADMIN to ${email}`);
      }
    }
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
