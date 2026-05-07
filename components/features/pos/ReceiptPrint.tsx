'use client';

import { formatBaht, formatThaiDateTime } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';

interface ReceiptItem {
  productName: string;
  qty: number;
  price: number;
  itemDiscount: number;
  subtotal: number;
}

export interface ReceiptData {
  id: string;
  date: string;
  cashierName: string;
  items: ReceiptItem[];
  subtotal: number;
  itemDiscount: number;
  billDiscount: number;
  total: number;
  paymentMethod: 'CASH' | 'TRANSFER';
  notes: string | null;
  receivedCash?: number;
}

function Divider({ dashed = false }: { dashed?: boolean }) {
  return (
    <div className={`border-t my-1 ${dashed ? 'border-dashed border-slate-300' : 'border-slate-400'}`} />
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-xs ${bold ? 'font-bold' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function ReceiptPrint({ data }: { data: ReceiptData }) {
  const change = data.receivedCash != null ? Math.max(0, data.receivedCash - data.total) : null;
  const billId = data.id.slice(0, 8).toUpperCase();

  return (
    <div
      style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '12px', width: '100%', maxWidth: '300px', margin: '0 auto' }}
      className="bg-white text-black p-2 space-y-1"
    >
      {/* Header */}
      <div className="text-center space-y-0.5">
        <p className="font-bold text-base">{APP_NAME}</p>
        <p className="text-xs">ใบเสร็จรับเงิน</p>
      </div>

      <Divider />

      <div className="text-xs space-y-0.5">
        <Row label="วันที่" value={formatThaiDateTime(data.date)} />
        <Row label="ผู้ขาย" value={data.cashierName} />
        <Row label="เลขที่บิล" value={`#${billId}`} />
      </div>

      <Divider />

      {/* Items */}
      <div className="space-y-1">
        {data.items.map((item, i) => (
          <div key={i} className="text-xs">
            <div className="flex justify-between">
              <span className="flex-1 break-words pr-1">{item.productName}</span>
              <span className="shrink-0">{formatBaht(item.subtotal)}</span>
            </div>
            <div className="text-slate-500 pl-1">
              {item.qty} × {formatBaht(item.price)}
              {item.itemDiscount > 0 && (
                <span className="ml-1">(ลด {formatBaht(item.itemDiscount)})</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <Divider dashed />

      {/* Totals */}
      <div className="space-y-0.5">
        <Row label="ยอดรวม" value={formatBaht(data.subtotal)} />
        {data.itemDiscount > 0 && (
          <Row label="ส่วนลดสินค้า" value={`-${formatBaht(data.itemDiscount)}`} />
        )}
        {data.billDiscount > 0 && (
          <Row label="ส่วนลดบิล" value={`-${formatBaht(data.billDiscount)}`} />
        )}
      </div>

      <Divider />

      <Row label="ยอดสุทธิ" value={formatBaht(data.total)} bold />

      <Divider dashed />

      <div className="space-y-0.5 text-xs">
        <Row label="วิธีชำระ" value={data.paymentMethod === 'CASH' ? 'เงินสด' : 'โอนเงิน'} />
        {data.receivedCash != null && data.paymentMethod === 'CASH' && (
          <>
            <Row label="รับเงิน" value={formatBaht(data.receivedCash)} />
            <Row label="เงินทอน" value={formatBaht(change!)} bold />
          </>
        )}
      </div>

      {data.notes && (
        <>
          <Divider dashed />
          <p className="text-xs text-slate-600">หมายเหตุ: {data.notes}</p>
        </>
      )}

      <Divider />

      <div className="text-center text-xs space-y-0.5">
        <p>ขอบคุณที่ใช้บริการ</p>
        <p className="text-slate-400">Thank you!</p>
      </div>
    </div>
  );
}
