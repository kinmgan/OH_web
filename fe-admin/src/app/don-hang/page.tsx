'use client';

import { useState } from 'react';
import OrderTable from '@/components/order/OrderTable';
import OrderDetailModal from '@/components/order/OrderDetailModal';
import { OrderStatus, OrderDetail } from '@/types/order.type';

const statuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'RETURNED'];


export default function OrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleViewDetail = async (orderId: number) => {
    const { orderAdminService } = await import('@/services/order.service');
    try {
      const detail = await orderAdminService.getOrderDetail(orderId);
      setSelectedOrder(detail);
      setIsDetailOpen(true);
    } catch (error) {
      console.error('Error fetching order detail:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#333', marginBottom: '24px' }}>
        Quản lý đơn hàng
      </h1>

      {/* Status Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          overflowX: 'auto',
          paddingBottom: '8px',
        }}
      >
        <button
          onClick={() => setSelectedStatus('ALL')}
          style={{
            padding: '10px 16px',
            background: selectedStatus === 'ALL' ? '#A57322' : '#f5f5f5',
            color: selectedStatus === 'ALL' ? '#fff' : '#666',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.3s ease',
          }}
        >
          Tất cả
        </button>
        {statuses.map((status) => {
          const label: Record<OrderStatus, string> = {
            PENDING: 'Chờ xử lý',
            CONFIRMED: 'Đã xác nhận',
            SHIPPING: 'Đang giao',
            DELIVERED: 'Đã giao',
            CANCELLED: 'Đã hủy',
            RETURNED: 'Hoàn hàng',
          };
          return (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              style={{
                padding: '10px 16px',
                background: selectedStatus === status ? '#A57322' : '#f5f5f5',
                color: selectedStatus === status ? '#fff' : '#666',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.3s ease',
              }}
            >
              {label[status]}
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      <OrderTable
        key={refreshKey}
        status={selectedStatus === 'ALL' ? undefined : selectedStatus}
        onViewDetail={handleViewDetail}
      />

      {/* Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedOrder(null);
        }}
        onRefresh={handleRefresh}
        onStatusUpdate={(newStatus) => {
          setSelectedStatus(newStatus);
          setIsDetailOpen(false);
          setSelectedOrder(null);
          handleRefresh();
        }}
      />
    </div>
  );
}
