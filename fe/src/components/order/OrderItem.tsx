'use client';

import { OrderListItem, OrderStatus } from '@/types/order.type';
import { ChevronRight } from 'lucide-react';

interface OrderItemProps {
  order: OrderListItem;
  onViewDetail: (orderId: number) => void;
}

const statusConfig: Record<OrderStatus, { color: string; bgColor: string; label: string }> = {
  'PENDING': { color: '#E65100', bgColor: '#FFF3E0', label: 'Chờ xác nhận' },
  'CONFIRMED': { color: '#6A1B9A', bgColor: '#F3E5F5', label: 'Đã xác nhận' },
  'SHIPPING': { color: '#0277BD', bgColor: '#E1F5FE', label: 'Đang giao' },
  'DELIVERED': { color: '#2E7D32', bgColor: '#E8F5E9', label: 'Đã giao' },
  'CANCELLED': { color: '#C62828', bgColor: '#FFEBEE', label: 'Đã hủy' },
  'RETURNED': { color: '#F57F17', bgColor: '#FFF8E1', label: 'Đã hoàn hàng' },
};

export default function OrderItem({ order, onViewDetail }: OrderItemProps) {
  const status = statusConfig[order.orderStatus];
  
  return (
    <div
      onClick={() => onViewDetail(order.orderId)}
      style={{
        background: '#fff',
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#A57322' }}>
            {order.orderCode}
          </div>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 500,
              background: status.bgColor,
              color: status.color,
            }}
          >
            {status.label}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', fontSize: '13px', color: '#666' }}>
          <div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ fontWeight: 500 }}>Ngày:</span> {new Date(order.createdAt).toLocaleDateString('vi-VN')}
            </div>
            <div>
              <span style={{ fontWeight: 500 }}>Số sản phẩm:</span> {order.itemCount}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#A57322' }}>
              {order.totalAmount.toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>
      </div>

      <ChevronRight size={20} style={{ color: '#999', marginLeft: '16px' }} />
    </div>
  );
}
