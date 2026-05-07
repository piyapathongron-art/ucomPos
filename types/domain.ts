export type UserRole = 'ADMIN' | 'STAFF';

export interface CurrentUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  permissions: string[];
}

export interface Product {
  id: number;
  productId: string;
  name: string;
  categoryId: string | null;
  category?: { name: string } | null;
  description: string | null;
  qty: number;
  cost: number;
  price: number;
  isFavorite: boolean;
  isActive: boolean;
}

export interface CartItem {
  id: string;
  productId: number | null;
  productName: string;
  productCode: string | null;
  qty: number;
  cost: number;
  price: number;
  itemDiscount: number;
}

export type PaymentMethod = 'CASH' | 'TRANSFER';

export interface Sale {
  id: string;
  userId: string;
  date: string;
  itemDiscount: number;
  billDiscount: number;
  subtotal: number;
  total: number;
  cost: number;
  profit: number;
  paymentMethod: PaymentMethod;
  notes: string | null;
  voided: boolean;
  items: SaleItem[];
}

export interface SaleItem {
  id: number;
  saleId: string;
  productId: number | null;
  productName: string;
  productCode: string | null;
  qty: number;
  cost: number;
  price: number;
  itemDiscount: number;
  subtotal: number;
}

export type ServiceType = 'REPAIR' | 'TOPUP' | 'EXTENSION';
export type ServiceStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface Service {
  id: string;
  type: ServiceType;
  name: string;
  description: string | null;
  cost: number;
  price: number;
  date: string;
  status: ServiceStatus;
  details: Record<string, unknown> | null;
  userId: string;
}

export type InstallmentMode = 'CONSIGNMENT' | 'SELF_MANAGED';
export type InstallmentStatus =
  | 'PENDING_COMMISSION'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';
export type InstallmentPaymentType = 'COMMISSION' | 'INSTALLMENT';

export interface InstallmentPayment {
  id: string;
  installmentId: string;
  type: InstallmentPaymentType;
  amount: number;
  profitRecognized: number;
  paymentMethod: PaymentMethod;
  date: string;
  notes: string | null;
  userId: string;
  user?: { name: string };
}

export interface Installment {
  id: string;
  mode: InstallmentMode;
  status: InstallmentStatus;
  productId: number | null;
  productSnapshot: {
    name: string;
    productCode: string | null;
    cost: number;
    price: number;
  };
  customerName: string;
  customerPhone: string | null;
  customerNote: string | null;
  cost: number;
  basePrice: number;
  totalAmount: number;
  paidAmount: number;
  commission: number;
  date: string;
  closedAt: string | null;
  notes: string | null;
  userId: string;
  user?: { name: string };
  payments?: InstallmentPayment[];
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  changes: Record<string, unknown> | null;
  timestamp: string;
}
