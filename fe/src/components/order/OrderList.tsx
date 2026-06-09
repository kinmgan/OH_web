'use client';

import { useState, useEffect } from 'react';
import { OrderListItem, OrderStatus } from '@/types/order.type';
import OrderItem from './OrderItem';
import { Loader } from 'lucide-react';

interface OrderListProps {
  status?: OrderStatus;
  onViewDetail: (orderId: number) => void;
  refreshTrigger?: number;
}

export default function OrderList({ status, onViewDetail, refreshTrigger }: OrderListProps) {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    setCurrentPage(0); // Reset to page 0 when status changes
  }, [status]);

  useEffect(() => {
    fetchOrders();
  }, [status, currentPage, refreshTrigger]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { orderService } = await import('@/services/order.service');
      const response = status ? 
        await orderService.getMyOrdersByStatus(status, currentPage)
        : await orderService.getMyOrders(currentPage);

      setOrders(response.items);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Loader size={32} style={{ display: 'inline-block', animation: 'spin 1s linear infinite', color: '#A57322' }} />
        <div style={{ marginTop: '16px', color: '#666' }}>Đang tải đơn hàng...</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '40px',
          background: '#fff',
          borderRadius: '8px',
          color: '#999',
        }}
      >
        Không có đơn hàng
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {orders.map((order) => (
        <OrderItem key={order.orderId} order={order} onViewDetail={onViewDetail} />
      ))}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx)}
              style={{
                padding: '8px 12px',
                background: currentPage === idx ? '#A57322' : '#f5f5f5',
                color: currentPage === idx ? '#fff' : '#444',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
