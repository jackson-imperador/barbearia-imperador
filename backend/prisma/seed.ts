import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // 1. Create Tenant
  const tenant = await prisma.tenant.upsert({
    where: { domain: 'imperio.admin' },
    update: {},
    create: {
      name: 'Imperio Barber HQ',
      domain: 'imperio.admin',
    },
  });
  console.log(`Tenant created: ${tenant.name}`);

  // 2. Create Permissions
  const resources = ['users', 'roles', 'settings', 'appointments'];
  const actions = ['create', 'read', 'update', 'delete', 'manage'];

  const permissions = [];
  for (const resource of resources) {
    for (const action of actions) {
      const permission = await prisma.permission.upsert({
        where: {
          action_resource: { action, resource },
        },
        update: {},
        create: {
          action,
          resource,
          description: `Can ${action} ${resource}`,
        },
      });
      permissions.push(permission);
    }
  }
  console.log('Permissions created');

  // 3. Create Roles
  const rolesData = [
    { name: 'SUPER_ADMIN', description: 'System Administrator' },
    { name: 'ADMIN', description: 'Tenant Administrator' },
    { name: 'BARBER', description: 'Barber Professional' },
    { name: 'CUSTOMER', description: 'Customer' },
  ];

  const roles = [];
  for (const roleData of rolesData) {
    // SUPER_ADMIN is system-wide (tenantId: null), others belong to the tenant
    const tenantId = roleData.name === 'SUPER_ADMIN' ? null : tenant.id;
    
    let role = await prisma.role.findFirst({
      where: { name: roleData.name, tenantId },
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          name: roleData.name,
          description: roleData.description,
          tenantId,
        },
      });
    }
    roles.push(role);
  }
  console.log('Roles created');

  // 4. Assign Permissions to SUPER_ADMIN
  const superAdminRole = roles.find(r => r.name === 'SUPER_ADMIN');
  if (superAdminRole) {
    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      });
    }
  }
  console.log('Permissions assigned to SUPER_ADMIN');

  // 5. Create Super Admin User
  const dummyPasswordHash = await argon2.hash('admin123');  
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@imperio.system' },
    update: {},
    create: {
      email: 'admin@imperio.system',
      firstName: 'System',
      lastName: 'Administrator',
      passwordHash: dummyPasswordHash,
      tenantId: tenant.id,
    },
  });
  console.log(`Super Admin created: ${superAdmin.email}`);

  // 6. Assign Role to Super Admin
  if (superAdminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: superAdmin.id,
          roleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        userId: superAdmin.id,
        roleId: superAdminRole.id,
      },
    });
  }
  console.log('SUPER_ADMIN role assigned to Super Admin user');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
