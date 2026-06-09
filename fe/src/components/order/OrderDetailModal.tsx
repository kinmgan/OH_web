'use client';

import { useState } from 'react';
import { OrderDetail, OrderStatus, TrackingHistoryEntry } from '@/types/order.type';
import { X, MapPin, Package, Truck, Clock, RefreshCw } from 'lucide-react';
import { orderService } from '@/services/order.service';
import ReturnRequestModal from './ReturnRequestModal';

interface OrderDetailModalProps {
  order: OrderDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const statusConfig: Record<OrderStatus, { color: string; bgColor: string; label: string }> = {
  'PENDING': { color: '#E65100', bgColor: '#FFF3E0', label: 'Chờ xác nhận' },
  'CONFIRMED': { color: '#6A1B9A', bgColor: '#F3E5F5', label: 'Đã xác nhận' },
  'SHIPPING': { color: '#0277BD', bgColor: '#E1F5FE', label: 'Đang giao' },
  'DELIVERED': { color: '#2E7D32', bgColor: '#E8F5E9', label: 'Đã giao' },
  'CANCELLED': { color: '#C62828', bgColor: '#FFEBEE', label: 'Đã hủy' },
  'RETURNED': { color: '#F57F17', bgColor: '#FFF8E1', label: 'Đã hoàn hàng' },
};

const returnStatusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  'PENDING': { color: '#E65100', bgColor: '#FFF3E0', label: 'Chờ xử lý' },
  'APPROVED': { color: '#6A1B9A', bgColor: '#F3E5F5', label: 'Đã duyệt' },
  'REJECTED': { color: '#C62828', bgColor: '#FFEBEE', label: 'Từ chối' },
  'RECEIVED': { color: '#0277BD', bgColor: '#E1F5FE', label: 'Đã nhận được hàng' },
  'REFUNDED': { color: '#2E7D32', bgColor: '#E8F5E9', label: 'Đã hoàn tiền' },
};

function TimelineStep({ entry, isLast }: { entry: TrackingHistoryEntry; isLast: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '12px', position: 'relative' }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '24px',
      }}>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: isLast ? '#0277BD' : '#2E7D32',
          border: '2px solid #fff',
          boxShadow: '0 0 0 2px #e0e0e0',
          zIndex: 1,
        }} />
        {!isLast && (
          <div style={{
            width: '2px',
            flex: 1,
            background: '#e0e0e0',
            marginTop: '4px',
          }} />
        )}
      </div>
      <div style={{ paddingBottom: isLast ? '0' : '16px', flex: 1 }}>
        <div style={{ fontWeight: 600, color: '#333', marginBottom: '4px' }}>
          {entry.statusDescription}
        </div>
        {entry.location && (
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
            {entry.location}
          </div>
        )}
        <div style={{ fontSize: '12px', color: '#999' }}>
          {new Date(entry.updatedAt).toLocaleString('vi-VN')}
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailModal({ order, isOpen, onClose, onRefresh }: OrderDetailModalProps) {
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  if (!isOpen || !order) return null;

  const status = statusConfig[order.orderStatus];

  // Helper to generate return timeline
  const getReturnTimeline = (returnInfo: any, refundInfo?: any) => {
    const steps = [];
    const reasonText = returnInfo.reason === 'WRONG_ITEM' ? 'Sai sản phẩm' : returnInfo.reason === 'DEFECTIVE' ? 'Sản phẩm lỗi' : 'Lý do khác';
    steps.push({ statusDescription: 'Yêu cầu hoàn hàng', location: `Lý do: ${reasonText}`, updatedAt: returnInfo.createdAt });
    
    if (returnInfo.status === 'REJECTED') {
      steps.push({ statusDescription: 'Từ chối yêu cầu', location: 'Yêu cầu của bạn đã bị từ chối', updatedAt: returnInfo.createdAt });
      return steps;
    }

    if (returnInfo.status === 'APPROVED' || returnInfo.status === 'RECEIVED' || returnInfo.status === 'REFUNDED') {
      steps.push({ statusDescription: 'Đã duyệt yêu cầu', location: 'Vui lòng gửi hàng về kho', updatedAt: returnInfo.createdAt });
    }

    if (returnInfo.status === 'RECEIVED' || returnInfo.status === 'REFUNDED') {
      steps.push({ statusDescription: 'Đã nhận được hàng', location: 'Kho đã nhận lại hàng hoàn', updatedAt: returnInfo.createdAt });
    }

    if (returnInfo.status === 'REFUNDED') {
      steps.push({ statusDescription: 'Hoàn tiền thành công', location: refundInfo ? `Qua ${refundInfo.method}` : 'Đã hoàn tiền', updatedAt: refundInfo?.refundedAt || returnInfo.createdAt });
    }

    return steps;
  };

  const handleCancelOrder = async () => {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;

    setIsCancelling(true);
    try {
      await orderService.cancelOrder(order.orderId);
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Hủy đơn hàng thất bại: ' + (error as Error).message);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReviewClick = (productId: number, orderItemId: number) => {
    window.location.href = `/san-pham/${productId}?reviewOrderItemId=${orderItemId}#reviews`;
  };

  const canCancel = order.orderStatus === 'PENDING' || order.orderStatus === 'CONFIRMED';

  return (
    <>
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
            maxWidth: '700px',
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
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        flex: 1,
                      }}
                    >
                      <div style={{ fontWeight: 600, color: '#333', marginBottom: '4px' }}>
                        {item.productName}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                        {item.variantInfo} × {item.quantity}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#A57322' }}>
                        {item.totalPrice.toLocaleString('vi-VN')} đ
                      </div>
                      {order.orderStatus === 'DELIVERED' && (
                        <button
                          onClick={() => handleReviewClick(item.productId, item.itemId)}
                          style={{
                            alignSelf: 'flex-start',
                            padding: '6px 12px',
                            fontSize: '12px',
                            background: '#A57322',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          Đánh giá
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Info */}
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
                <MapPin size={18} style={{ color: '#A57322' }} />
                Địa chỉ giao
              </h3>
              <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '6px', fontSize: '14px' }}>
                <div style={{ fontWeight: 600, color: '#333', marginBottom: '4px' }}>
                  {order.recipientName} - {order.recipientPhone}
                </div>
                <div style={{ color: '#666' }}>
                  {order.addressDetail}
                </div>
              </div>
            </div>

            {/* Shipment Info */}
            {order.shipment && (
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
                  <Truck size={18} style={{ color: '#A57322' }} />
                  Vận chuyển
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
                  <div>
                    <div style={{ color: '#666', marginBottom: '4px' }}>Nhà cung cấp</div>
                    <div style={{ fontWeight: 600, color: '#333' }}>{order.shipment.carrierName}</div>
                  </div>
                  <div>
                    <div style={{ color: '#666', marginBottom: '4px' }}>Mã theo dõi</div>
                    <div style={{ fontWeight: 600, color: '#333' }}>{order.shipment.trackingNumber}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline Tracking */}
            {order.shipment?.trackingHistories && order.shipment.trackingHistories.length > 0 && (
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
                  <Clock size={18} style={{ color: '#A57322' }} />
                  Lịch sử vận chuyển
                </h3>
                <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '6px' }}>
                  {order.shipment.trackingHistories.map((entry, index) => (
                    <TimelineStep
                      key={index}
                      entry={entry}
                      isLast={index === order.shipment!.trackingHistories!.length - 1}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Refund & Return Info */}
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
                  {order.refundInfo.proofImage && (
                    <div style={{ marginTop: '12px', borderTop: '1px solid #ffcc80', paddingTop: '12px' }}>
                      <span style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Ảnh bằng chứng hoàn tiền:</span>
                      <a href={order.refundInfo.proofImage} target="_blank" rel="noopener noreferrer">
                        <img 
                          src={order.refundInfo.proofImage} 
                          alt="Bằng chứng hoàn tiền" 
                          style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ffe0b2' }}
                        />
                      </a>
                    </div>
                  )}
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
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600 }}>Tiến độ xử lý:</span>
                    <div style={{ marginTop: '12px', paddingLeft: '8px' }}>
                      {getReturnTimeline(order.returnInfo, order.refundInfo).map((entry, index, arr) => (
                        <TimelineStep
                          key={index}
                          entry={entry}
                          isLast={index === arr.length - 1}
                        />
                      ))}
                    </div>
                  </div>
                  {order.returnInfo.evidenceImages && order.returnInfo.evidenceImages.length > 0 && (
                    <div>
                      <span style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Ảnh bằng chứng:</span>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {order.returnInfo.evidenceImages.map((img, idx) => (
                          <img 
                            key={idx} 
                            src={img} 
                            alt={`Evidence ${idx + 1}`} 
                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee' }} 
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Summary */}
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '24px' }}>
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
                  borderTop: '1px solid #f0f0f0',
                  fontSize: '16px',
                  fontWeight: 700,
                }}
              >
                <span>Tổng cộng:</span>
                <span style={{ color: '#A57322' }}>{order.totalAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '32px', flexWrap: 'wrap' }}>
              {/* Cancel Button */}
              {canCancel && (
                <button
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  style={{
                    flex: 1,
                    minWidth: '120px',
                    padding: '12px',
                    background: '#fff',
                    color: '#d32f2f',
                    border: '1px solid #d32f2f',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: isCancelling ? 'not-allowed' : 'pointer',
                    opacity: isCancelling ? 0.7 : 1,
                  }}
                >
                  {isCancelling ? 'Đang hủy...' : 'Hủy đơn'}
                </button>
              )}

              {/* Review Button - only for DELIVERED */}
              {/* Removed: now each item has its own review button above */}

              {/* Return Button - only for DELIVERED */}
              {order.orderStatus === 'DELIVERED' && (
                <button
                  onClick={() => setShowReturnModal(true)}
                  style={{
                    flex: 1,
                    minWidth: '120px',
                    padding: '12px',
                    background: '#fff',
                    color: '#d32f2f',
                    border: '1px solid #d32f2f',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Hoàn hàng
                </button>
              )}

              {/* Reorder Button */}
              {order.orderStatus === 'DELIVERED' && (
                <button
                  onClick={() => {
                    if (order.items && order.items.length > 0) {
                      window.location.href = `/san-pham/${order.items[0].productId}`;
                    }
                  }}
                  style={{
                    flex: 1,
                    minWidth: '120px',
                    padding: '12px',
                    background: '#f5f5f5',
                    color: '#333',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Mua lại
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Return Request Modal */}
      {showReturnModal && order && (
        <ReturnRequestModal
          order={order}
          isOpen={showReturnModal}
          onClose={() => setShowReturnModal(false)}
          onSuccess={() => {
            setShowReturnModal(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
}
