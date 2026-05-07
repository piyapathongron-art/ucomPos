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

export interface Partner {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  totalDebt: number;
  totalCommission: number;
  notes: string | null;
  isActive: boolean;
}

export type PartnerTxType = 'DEBT' | 'PAYMENT' | 'COMMISSION';

export interface PartnerTransaction {
  id: string;
  partnerId: string;
  type: PartnerTxType;
  amount: number;
  description: string;
  date: string;
  userId: string;
  user?: { name: string };
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
