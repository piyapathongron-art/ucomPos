import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface ProductCreateInput {
  productId: string;
  name: string;
  categoryId?: string | null;
  description?: string | null;
  qty: number;
  cost: number;
  price: number;
  isFavorite?: boolean;
}

export type ProductUpdateInput = Partial<ProductCreateInput> & { isActive?: boolean };

export async function listProducts(opts: {
  search?: string;
  categoryId?: string;
  favoritesOnly?: boolean;
  includeInactive?: boolean;
} = {}) {
  const where: Prisma.ProductWhereInput = {};

  if (!opts.includeInactive) where.isActive = true;
  if (opts.categoryId) where.categoryId = opts.categoryId;
  if (opts.favoritesOnly) where.isFavorite = true;
  if (opts.search) {
    where.OR = [
      { name: { contains: opts.search, mode: 'insensitive' } },
      { productId: { contains: opts.search, mode: 'insensitive' } },
    ];
  }

  return prisma.product.findMany({
    where,
    include: { category: { select: { id: true, name: true } } },
    orderBy: [{ isFavorite: 'desc' }, { name: 'asc' }],
  });
}

export async function getProduct(id: number) {
  return prisma.product.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true } } },
  });
}

export async function createProduct(input: ProductCreateInput) {
  return prisma.product.create({
    data: {
      productId: input.productId,
      name: input.name,
      categoryId: input.categoryId ?? null,
      description: input.description ?? null,
      qty: input.qty,
      cost: input.cost,
      price: input.price,
      isFavorite: input.isFavorite ?? false,
    },
    include: { category: { select: { id: true, name: true } } },
  });
}

export async function updateProduct(id: number, patch: ProductUpdateInput) {
  return prisma.product.update({
    where: { id },
    data: patch,
    include: { category: { select: { id: true, name: true } } },
  });
}

export async function softDeleteProduct(id: number) {
  return prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function bulkCreateProducts(products: ProductCreateInput[]) {
  const results = await prisma.$transaction(
    products.map((p) =>
      prisma.product.upsert({
        where: { productId: p.productId },
        update: {
          name: p.name,
          categoryId: p.categoryId ?? null,
          description: p.description ?? null,
          qty: { increment: p.qty },
          cost: p.cost,
          price: p.price,
        },
        create: {
          productId: p.productId,
          name: p.name,
          categoryId: p.categoryId ?? null,
          description: p.description ?? null,
          qty: p.qty,
          cost: p.cost,
          price: p.price,
          isFavorite: p.isFavorite ?? false,
        },
      })
    )
  );
  return results;
}
