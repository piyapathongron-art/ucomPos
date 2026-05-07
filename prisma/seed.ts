import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv();

import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DIRECT_URL or DATABASE_URL must be set in .env.local');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const ALL_PERMISSIONS = [
  'pos',
  'services',
  'installments',
  'stock',
  'report',
  'users',
  'audit',
  'settings',
];

async function main() {
  console.log('Seeding database...');

  // Default categories
  const categories = [
    { name: 'ทั่วไป', order: 0 },
    { name: 'โทรศัพท์', order: 1 },
    { name: 'อุปกรณ์เสริม', order: 2 },
    { name: 'ซิมการ์ด', order: 3 },
    { name: 'บริการ', order: 4 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log(`Seeded ${categories.length} categories`);

  // Default users
  const adminPassword = await bcrypt.hash('1234', 10);
  const staffPassword = await bcrypt.hash('1234', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      name: 'เจ้าของร้าน',
      role: Role.ADMIN,
      permissions: ALL_PERMISSIONS,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { username: 'staff' },
    update: {},
    create: {
      username: 'staff',
      passwordHash: staffPassword,
      name: 'พนักงานขาย',
      role: Role.STAFF,
      permissions: ['pos', 'services', 'report'],
      isActive: true,
    },
  });

  console.log('Seeded default users (admin / staff, password: 1234)');

  // Sample inventory
  const phones = await prisma.category.findUnique({ where: { name: 'โทรศัพท์' } });
  const accessories = await prisma.category.findUnique({ where: { name: 'อุปกรณ์เสริม' } });
  const sims = await prisma.category.findUnique({ where: { name: 'ซิมการ์ด' } });

  const initialStock = [
    { productId: 'P-0001', name: 'Film U&i', categoryId: accessories?.id, qty: 10, cost: 19, price: 100 },
    { productId: 'P-0002', name: 'Film Focus', categoryId: accessories?.id, qty: 5, cost: 120, price: 350, isFavorite: true },
    { productId: 'P-0003', name: 'ชุดชาร์จ micro', categoryId: accessories?.id, qty: 8, cost: 30, price: 250 },
    { productId: 'MOB001', name: 'A36 5G', categoryId: phones?.id, qty: 2, cost: 9100, price: 11500, isFavorite: true },
    { productId: 'SIM001', name: 'Sim OTC', categoryId: sims?.id, qty: 20, cost: 29, price: 50 },
  ];

  for (const item of initialStock) {
    await prisma.product.upsert({
      where: { productId: item.productId },
      update: {},
      create: item,
    });
  }
  console.log(`Seeded ${initialStock.length} products`);

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
