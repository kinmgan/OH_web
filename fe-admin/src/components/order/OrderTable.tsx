'use client';

import { useState, useEffect } from 'react';
import { OrderListItem, OrderStatus } from '@/types/order.type';
import { Edit3, Eye } from 'lucide-react';

interface OrderTableProps {
  status?: OrderStatus;
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

export default function OrderTable({ status, onViewDetail }: OrderTableProps) {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, [status, currentPage]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { orderAdminService } = await import('@/services/order.service');
      const response = status ? 
        await orderAdminService.getOrdersByStatus(status, currentPage)
        : await orderAdminService.getAllOrders(currentPage);
      
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
    return <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Đang tải...</div>;
  }

  if (orders.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        background: '#fff',
        borderRadius: '8px',
        color: '#999',
        border: '1px solid #f0f0f0'
      }}>
        Không có đơn hàng
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #eee' }}>
              <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#666' }}>
                Mã đơn
              </th>
              <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#666' }}>
                Số sản phẩm
              </th>
              <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#666' }}>
                Số tiền
              </th>
              <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#666' }}>
                Trạng thái
              </th>
              <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#666' }}>
                Ngày
              </th>
              <th style={{ textAlign: 'center', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#666' }}>
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const orderStatus = statusConfig[order.orderStatus];
              return (
                <tr key={order.orderId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#A57322' }}>
                    {order.orderCode}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>{order.itemCount}</td>
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#333' }}>
                    {order.totalAmount.toLocaleString('vi-VN')} đ
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: orderStatus.bgColor,
                        color: orderStatus.color,
                      }}
                    >
                      {orderStatus.label}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <button
                      onClick={() => onViewDetail(order.orderId)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#A57322',
                        padding: '4px 8px',
                      }}
                      title="Xem chi tiết"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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

