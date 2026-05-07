import { z } from 'zod';

// ============================================================
// AUTH VALIDATORS
// ============================================================

export const loginSchema = z.object({
  username: z.string().min(1, 'กรุณากรอกชื่อผู้ใช้').max(100),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน').max(100),
});

export const registerSchema = z.object({
  username: z.string().min(3, 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร').max(50),
  password: z.string().min(4, 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร').max(100),
  name: z.string().min(1, 'กรุณากรอกชื่อ').max(100),
  role: z.enum(['ADMIN', 'STAFF']).default('STAFF'),
  permissions: z.array(z.string()).default([]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// ============================================================
// PRODUCT VALIDATORS
// ============================================================

export const productSchema = z.object({
  productId: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  categoryId: z.string().uuid().nullable().optional(),
  description: z.string().optional(),
  qty: z.number().int().min(0),
  cost: z.number().min(0),
  price: z.number().min(0),
  isFavorite: z.boolean().default(false),
});

export type ProductInput = z.infer<typeof productSchema>;

// ============================================================
// SALE VALIDATORS
// ============================================================

export const saleItemSchema = z.object({
  productId: z.number().int().nullable().optional(),
  productName: z.string().min(1),
  productCode: z.string().nullable().optional(),
  qty: z.number().int().min(1),
  cost: z.number().min(0),
  price: z.number().min(0),
  itemDiscount: z.number().min(0).default(0),
});

export const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1, 'ต้องมีสินค้าอย่างน้อย 1 รายการ'),
  itemDiscount: z.number().min(0).default(0),
  billDiscount: z.number().min(0).default(0),
  paymentMethod: z.enum(['CASH', 'TRANSFER']),
  notes: z.string().optional(),
});

export type SaleInput = z.infer<typeof saleSchema>;
export type SaleItemInput = z.infer<typeof saleItemSchema>;

// ============================================================
// SERVICE VALIDATORS
// ============================================================

export const serviceSchema = z.object({
  type: z.enum(['REPAIR', 'TOPUP', 'EXTENSION']),
  name: z.string().min(1, 'กรุณากรอกชื่องาน').max(200),
  description: z.string().optional(),
  cost: z.number().min(0),
  price: z.number().min(0),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).default('PENDING'),
  details: z.record(z.unknown()).optional(),
});

export const serviceUpdateSchema = serviceSchema.omit({ type: true }).partial();

export type ServiceInput = z.infer<typeof serviceSchema>;
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;

// ============================================================
// INSTALLMENT VALIDATORS
// ============================================================

const manualProductSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อสินค้า').max(200),
  productId: z.string().min(1).max(50),
  categoryId: z.string().uuid().nullable().optional(),
  cost: z.number().min(0),
  price: z.number().min(0),
  description: z.string().optional(),
});

export const installmentSchema = z
  .object({
    mode: z.enum(['CONSIGNMENT', 'SELF_MANAGED']),
    productId: z.number().int().nullable().optional(),
    manualProduct: manualProductSchema.nullable().optional(),
    customerName: z.string().min(1, 'กรุณากรอกชื่อลูกค้า').max(200),
    customerPhone: z.string().max(20).nullable().optional(),
    customerNote: z.string().max(500).nullable().optional(),
    totalAmount: z.number().min(0).optional(),
    notes: z.string().max(500).nullable().optional(),
  })
  .refine(
    (v) => v.productId != null || v.manualProduct != null,
    { message: 'ต้องเลือกสินค้าหรือเพิ่มข้อมูลเครื่องใหม่' }
  )
  .refine(
    (v) => v.mode !== 'SELF_MANAGED' || (v.totalAmount ?? 0) > 0,
    { message: 'ผ่อนเอง: ต้องระบุยอดรวมที่ลูกค้าต้องจ่าย', path: ['totalAmount'] }
  );

export const installmentPaymentSchema = z.object({
  amount: z.number().positive('จำนวนเงินต้องมากกว่า 0'),
  paymentMethod: z.enum(['CASH', 'TRANSFER']),
  notes: z.string().max(500).nullable().optional(),
});

export type InstallmentInput = z.infer<typeof installmentSchema>;
export type InstallmentPaymentInput = z.infer<typeof installmentPaymentSchema>;

// ============================================================
// USER VALIDATORS
// ============================================================

export const userCreateSchema = z.object({
  username: z.string().min(3, 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร').max(50),
  password: z.string().min(4, 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร').max(100),
  name: z.string().min(1, 'กรุณากรอกชื่อ').max(100),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'STAFF']).default('STAFF'),
  permissions: z.array(z.string()).default([]),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().nullable().optional(),
  role: z.enum(['ADMIN', 'STAFF']).optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  newPassword: z.string().min(4, 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร').max(100),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
