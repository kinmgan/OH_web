'use client';

import { useState } from 'react';
import OrderList from '@/components/order/OrderList';
import OrderDetailModal from '@/components/order/OrderDetailModal';
import { OrderStatus, OrderDetail } from '@/types/order.type';

const ORDER_STATUSES: { key: OrderStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  //{ key: 'PENDING', label: 'Chờ xác nhận' },
  { key: 'CONFIRMED', label: 'Đã xác nhận' },
  { key: 'SHIPPING', label: 'Đang giao' },
  { key: 'DELIVERED', label: 'Đã giao' },
  { key: 'CANCELLED', label: 'Đã hủy' },
  { key: 'RETURNED', label: 'Hoàn hàng' },
];

export default function MyOrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleViewDetail = async (orderId: number) => {
    try {
      const { orderService } = await import('@/services/order.service');
      const order = await orderService.getOrderDetail(orderId);
      setSelectedOrder(order);
      setIsDetailOpen(true);
    } catch (error) {
      console.error('Error fetching order detail:', error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FCF8F1', paddingBottom: '40px', fontFamily: 'var(--font-be-vietnam), sans-serif' }}>
      <div style={{ maxWidth: '1050px', margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '32px', color: '#333' }}>
          Đơn hàng của tôi
        </h1>

        {/* Status Filter */}
        <div style={{ marginBottom: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {ORDER_STATUSES.map((status) => (
            <button
              key={status.key}
              onClick={() => setSelectedStatus(status.key)}
              style={{
                padding: '10px 20px',
                border: selectedStatus === status.key ? '1px solid #A57322' : '1px solid #ddd',
                background: selectedStatus === status.key ? '#A57322' : '#fff',
                color: selectedStatus === status.key ? '#fff' : '#333',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '14px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (selectedStatus !== status.key) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#A57322';
                  (e.currentTarget as HTMLButtonElement).style.color = '#A57322';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedStatus !== status.key) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#ddd';
                  (e.currentTarget as HTMLButtonElement).style.color = '#333';
                }
              }}
            >
              {status.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <OrderList
          status={selectedStatus === 'ALL' ? undefined : selectedStatus}
          onViewDetail={handleViewDetail}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal 
        order={selectedOrder} 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        onRefresh={handleRefresh}
      />
    </div>
  );
}
