'use client';

import { useState } from 'react';
import { OrderDetail, OrderStatus } from '@/types/order.type';
import { X, MapPin, Package, Truck, CreditCard, RefreshCw } from 'lucide-react';
import { orderAdminService } from '@/services/order.service';

interface OrderDetailModalProps {
  order: OrderDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  onStatusUpdate?: (status: OrderStatus) => void;
}

const statusConfig: Record<OrderStatus, { color: string; bgColor: string; label: string }> = {
  'PENDING': { color: '#E65100', bgColor: '#FFF3E0', label: 'Chờ xác nhận' },
  'CONFIRMED': { color: '#6A1B9A', bgColor: '#F3E5F5', label: 'Đã xác nhận' },
  'SHIPPING': { color: '#0277BD', bgColor: '#E1F5FE', label: 'Đang giao' },
  'DELIVERED': { color: '#2E7D32', bgColor: '#E8F5E9', label: 'Đã giao' },
  'CANCELLED': { color: '#C62828', bgColor: '#FFEBEE', label: 'Đã hủy' },
  'RETURNED': { color: '#F57F17', bgColor: '#FFF8E1', label: 'Đã hoàn hàng' },
};

export default function OrderDetailModal({ order, isOpen, onClose, onRefresh, onStatusUpdate }: OrderDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  if (!isOpen || !order) return null;

  const status = statusConfig[order.orderStatus];

  const handleDirectUpdateStatus = async (newStatus: OrderStatus, confirmMessage: string) => {
    if (!confirm(confirmMessage)) return;

    setIsUpdating(true);
    try {
      await orderAdminService.updateOrderStatus(order.orderId, newStatus);
      if (onStatusUpdate) {
        onStatusUpdate(newStatus);
      } else if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Cập nhật trạng thái thất bại: ' + (error as Error).message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;

    setIsCancelling(true);
    try {
      await orderAdminService.updateOrderStatus(order.orderId, 'CANCELLED');
      if (onRefresh) onRefresh();
      onClose();
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Hủy đơn hàng thất bại: ' + (error as Error).message);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          maxWidth: '800px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px 32px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fafafa',
          }}
        >
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#333', marginBottom: '4px' }}>
              {order.orderCode}
            </h2>
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
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#999',
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 32px' }}>
          {/* Items */}
          <div style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#333',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Package size={18} style={{ color: '#A57322' }} />
              Sản phẩm
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {order.items?.map((item) => (
                <div
                  key={item.itemId}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    background: '#f9f9f9',
                    borderRadius: '6px',
                  }}
                >
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '60px',
                        height: '60px',
                        background: '#e0e0e0',
                        borderRadius: '4px',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#333', marginBottom: '4px' }}>
                      {item.productName}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                      {item.variantInfo} × {item.quantity}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#A57322' }}>
                      {item.totalPrice.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer & Shipping Info */}
          <div style={{ marginBottom: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#333',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <MapPin size={18} style={{ color: '#A57322' }} />
                Địa chỉ giao
              </h3>
              <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '6px', fontSize: '13px' }}>
                <div style={{ fontWeight: 600, color: '#333', marginBottom: '4px' }}>
                  {order.recipientName} - {order.recipientPhone}
                </div>
                <div style={{ color: '#666' }}>{order.addressDetail}</div>
              </div>
            </div>

            {order.shipment && (
              <div>
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#333',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Truck size={18} style={{ color: '#A57322' }} />
                  Vận chuyển
                </h3>
                <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '6px', fontSize: '13px' }}>
                  <div style={{ marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>Nhà cung cấp:</span> {order.shipment.carrierName}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>Mã theo dõi:</span> {order.shipment.trackingNumber}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Return/Refund Info */}
          {order.orderStatus === 'CANCELLED' && order.refundInfo && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#333', marginBottom: '16px' }}>
                <RefreshCw size={18} style={{ display: 'inline', marginRight: '8px', color: '#A57322' }} />
                Thông tin hoàn tiền
              </h3>
              <div style={{ background: '#FFF3E0', padding: '16px', borderRadius: '6px', fontSize: '13px', borderLeft: '4px solid #E65100' }}>
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>Số tiền:</span> {order.refundInfo.refundAmount.toLocaleString('vi-VN')} đ
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>Trạng thái:</span> {order.refundInfo.status}
                </div>
                <div>
                  <span style={{ fontWeight: 600 }}>Lý do:</span> {order.refundInfo.reason}
                </div>
              </div>
            </div>
          )}

          {order.orderStatus === 'RETURNED' && order.returnInfo && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#333', marginBottom: '16px' }}>
                <RefreshCw size={18} style={{ display: 'inline', marginRight: '8px', color: '#A57322' }} />
                Thông tin hoàn hàng
              </h3>
              <div style={{ background: '#FFF8E1', padding: '16px', borderRadius: '6px', fontSize: '13px', borderLeft: '4px solid #F57F17' }}>
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>Lý do:</span> {order.returnInfo.reason}
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>Trạng thái:</span> {order.returnInfo.status}
                </div>
                <div>
                  <span style={{ fontWeight: 600 }}>Ngày yêu cầu:</span> {new Date(order.returnInfo.createdAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '24px', background: '#f9f9f9', padding: '24px', borderRadius: '6px', marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
              <span>Tổng tiền hàng:</span>
              <span>{order.subtotal.toLocaleString('vi-VN')} đ</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
              <span>Phí vận chuyển:</span>
              <span>{order.shippingFee.toLocaleString('vi-VN')} đ</span>
            </div>
            {order.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                <span>Giảm giá:</span>
                <span style={{ color: '#2E7D32' }}>-{order.discountAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '1px solid #ddd',
                fontSize: '16px',
                fontWeight: 700,
              }}
            >
              <span>Tổng cộng:</span>
              <span style={{ color: '#A57322' }}>{order.totalAmount.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          {/* Admin Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
            {/* Quick Action: Bàn giao (CONFIRMED -> SHIPPING) */}
            {order.orderStatus === 'CONFIRMED' && (
              <button
                onClick={() => handleDirectUpdateStatus('SHIPPING', 'Xác nhận bàn giao đơn hàng cho đơn vị vận chuyển?')}
                disabled={isUpdating}
                style={{
                  flex: 1,
                  minWidth: '150px',
                  padding: '12px',
                  background: '#A57322',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                  opacity: isUpdating ? 0.7 : 1,
                }}
              >
                {isUpdating ? 'Đang xử lý...' : 'Bàn giao'}
              </button>
            )}

            {/* Quick Action: Giao hàng thành công (SHIPPING -> DELIVERED) */}
            {order.orderStatus === 'SHIPPING' && (
              <button
                onClick={() => handleDirectUpdateStatus('DELIVERED', 'Xác nhận đơn hàng đã giao thành công?')}
                disabled={isUpdating}
                style={{
                  flex: 1,
                  minWidth: '150px',
                  padding: '12px',
                  background: '#A57322',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                  opacity: isUpdating ? 0.7 : 1,
                }}
              >
                {isUpdating ? 'Đang xử lý...' : 'Giao hàng thành công'}
              </button>
            )}

            {/* Cancel Button - for PENDING/CONFIRMED */}
            {(order.orderStatus === 'PENDING' || order.orderStatus === 'CONFIRMED') && (
              <button
                onClick={handleCancelOrder}
                disabled={isCancelling}
                style={{
                  flex: 1,
                  minWidth: '150px',
                  padding: '12px',
                  background: '#fff',
                  color: '#C62828',
                  border: '1px solid #C62828',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: isCancelling ? 'not-allowed' : 'pointer',
                  opacity: isCancelling ? 0.7 : 1,
                }}
              >
                {isCancelling ? 'Đang hủy...' : 'Hủy đơn'}
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
