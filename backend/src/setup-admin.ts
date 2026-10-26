import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking Database Users ---');
  const allUsers = await prisma.user.findMany({
    include: {
      userRoles: {
        include: { role: true }
      }
    }
  });

  console.log(`Found ${allUsers.length} users:`);
  for (const u of allUsers) {
    console.log(`- ${u.email} (Name: ${u.firstName} ${u.lastName}, Roles: ${u.userRoles.map(r => r.role.name).join(', ')})`);
  }

  // Get or find tenant
  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Imperio Barber HQ',
        domain: 'imperio.admin'
      }
    });
  }

  // Ensure SUPER_ADMIN and ADMIN roles exist
  let superAdminRole = await prisma.role.findFirst({ where: { name: 'SUPER_ADMIN' } });
  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: { name: 'SUPER_ADMIN', description: 'System Administrator' }
    });
  }

  const hashAdmin123 = await argon2.hash('admin123');
  const emailsToSetup = ['admin@imperio.com', 'admin@imperio.system'];

  for (const email of emailsToSetup) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash: hashAdmin123,
        isActive: true,
        deletedAt: null,
      },
      create: {
        email,
        firstName: 'Admin',
        lastName: 'Imperio',
        passwordHash: hashAdmin123,
        isActive: true,
        tenantId: tenant.id,
      }
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: superAdminRole.id
        }
      },
      update: {},
      create: {
        userId: user.id,
        roleId: superAdminRole.id
      }
    });

    console.log(`Successfully configured user ${email} with password 'admin123'`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
