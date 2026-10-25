import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient({
  datasources: {
    db: { url: 'postgresql://postgres:postgres@localhost:5432/imperio_barber?schema=public' }
  }
});

async function check() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@imperio.system' }, include: { userRoles: true } });
  console.log('User:', user ? 'Found' : 'Not Found');
  if (user) {
    console.log('isActive:', user.isActive);
    console.log('deletedAt:', user.deletedAt);
    console.log('Roles:', user.userRoles.length);
    const isValid = await argon2.verify(user.passwordHash, 'Password123!');
    console.log('Password valid:', isValid);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
