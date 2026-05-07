export const APP_VERSION = '2.0.0';
export const APP_NAME = 'UcomPos';
export const LAST_UPDATE = '2026-05-06';

export const ALL_PERMISSIONS = [
  'pos',
  'services',
  'installments',
  'stock',
  'report',
  'users',
  'audit',
  'settings',
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  pos: 'ขายหน้าร้าน',
  services: 'บริการ',
  installments: 'ฝากผ่อน',
  stock: 'จัดการสต็อก',
  report: 'รายงาน',
  users: 'จัดการผู้ใช้',
  audit: 'ประวัติการใช้งาน',
  settings: 'ตั้งค่าระบบ',
};

export const TAB_LABELS: Record<Permission, string> = PERMISSION_LABELS;

export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'ucompos_access',
  REFRESH_TOKEN: 'ucompos_refresh',
} as const;

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};
