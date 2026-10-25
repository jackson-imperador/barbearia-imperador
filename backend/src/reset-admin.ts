import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:postgres@localhost:5432/imperio_barber?schema=public"
    }
  }
});

async function resetPassword() {
  const hash = await argon2.hash('Password123!');
  const result = await prisma.user.updateMany({
    where: { email: 'admin@imperio.system' },
    data: { passwordHash: hash }
  });
  console.log(`Password updated for admin@imperio.system to Password123! Modified: ${result.count}`);
}
resetPassword().catch(console.error).finally(() => prisma.$disconnect());
