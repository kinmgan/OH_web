'use client';

import { useState } from 'react';
import { X, Package, User, Calendar, CheckCircle, XCircle, Truck, CreditCard } from 'lucide-react';
import { ReturnResponse, ReturnStatus, RefundRequest } from '@/types/return.type';
import { returnService } from '@/services/return.service';

interface ReturnDetailModalProps {
  returnItem: ReturnResponse;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const statusConfig: Record<ReturnStatus, { color: string; bgColor: string; label: string }> = {
  'PENDING': { color: '#E65100', bgColor: '#FFF3E0', label: 'Chờ duyệt' },
  'APPROVED': { color: '#1565C0', bgColor: '#E3F2FD', label: 'Đã duyệt' },
  'REJECTED': { color: '#C62828', bgColor: '#FFEBEE', label: 'Từ chối' },
  'RECEIVED': { color: '#6A1B9A', bgColor: '#F3E5F5', label: 'Đã nhận hàng' },
  'REFUNDED': { color: '#2E7D32', bgColor: '#E8F5E9', label: 'Đã hoàn tiền' },
};

const reasonLabels: Record<string, string> = {
  'DAMAGED': 'Hàng hỏng / vỡ',
  'WRONG_ITEM': 'Sai sản phẩm',
  'NOT_SATISFIED': 'Không đúng mô tả',
  'OTHER': 'Lý do khác',
};

export default function ReturnDetailModal({ returnItem, isOpen, onClose, onRefresh }: ReturnDetailModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState('BANK_TRANSFER');
  const [proofImage, setProofImage] = useState<File | null>(null);

  if (!isOpen) return null;

  const status = statusConfig[returnItem.status];

  const handleApprove = async () => {
    if (!confirm('Duyệt yêu cầu hoàn hàng này?')) return;
    setIsProcessing(true);
    try {
      await returnService.approve(returnItem.returnRequestId);
      onRefresh();
      onClose();
    } catch (error) {
      alert('Có lỗi xảy ra: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('Từ chối yêu cầu hoàn hàng này?')) return;
    setIsProcessing(true);
    try {
      await returnService.reject(returnItem.returnRequestId);
      onRefresh();
      onClose();
    } catch (error) {
      alert('Có lỗi xảy ra: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReceived = async () => {
    if (!confirm('Xác nhận đã nhận lại hàng hoàn?')) return;
    setIsProcessing(true);
    try {
      await returnService.confirmReceived(returnItem.returnRequestId);
      onRefresh();
      onClose();
    } catch (error) {
      alert('Có lỗi xảy ra: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!refundAmount || parseFloat(refundAmount) <= 0) {
      alert('Vui lòng nhập số tiền hoàn tiền');
      return;
    }
    if (!proofImage) {
      alert('Vui lòng tải lên ảnh bằng chứng hoàn tiền');
      return;
    }
    setIsProcessing(true);
    try {
      const data: RefundRequest = {
        amount: parseFloat(refundAmount),
        method: refundMethod,
        proofImage: proofImage,
      };
      await returnService.processRefund(returnItem.returnRequestId, data);
      onRefresh();
      onClose();
    } catch (error) {
      alert('Có lỗi xảy ra: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
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
        zIndex: 1100,
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
            padding: '20px 24px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#333', marginBottom: '4px' }}>
              Chi tiết hoàn hàng
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
        <div style={{ padding: '24px' }}>
          {/* Order Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#666', fontSize: '13px' }}>
                <Package size={16} />
                Đơn hàng
              </div>
              <div style={{ fontWeight: 600, color: '#333', fontSize: '16px' }}>
                {returnItem.orderCode}
              </div>
            </div>
            <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#666', fontSize: '13px' }}>
                <Calendar size={16} />
                Ngày yêu cầu
              </div>
              <div style={{ fontWeight: 600, color: '#333', fontSize: '16px' }}>
                {new Date(returnItem.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
              Lý do hoàn hàng
            </h3>
            <div style={{ background: '#FFF8E1', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #F57F17' }}>
              <div style={{ fontWeight: 600, color: '#333', marginBottom: '4px' }}>
                {reasonLabels[returnItem.reason] || returnItem.reason}
              </div>
              {returnItem.description && (
                <div style={{ fontSize: '13px', color: '#666' }}>
                  {returnItem.description}
                </div>
              )}
            </div>

            {/* Evidence Images */}
            {returnItem.evidenceImages && returnItem.evidenceImages.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
                  Hình ảnh bằng chứng:
                </h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {returnItem.evidenceImages.map((url, index) => (
                    <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={url} 
                        alt={`Bằng chứng ${index + 1}`} 
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#333', marginBottom: '12px' }}>
              Sản phẩm hoàn ({returnItem.items?.length || 0})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {returnItem.items?.map((item) => (
                <div
                  key={item.returnItemId}
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
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      {item.variantInfo} - SL: {item.quantity}
                    </div>
                    {item.conditionNoted && (
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        Ghi chú: {item.conditionNoted}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Refund Info */}
          {returnItem.refundInfo && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#333', marginBottom: '12px' }}>
                Thông tin hoàn tiền
              </h3>
              <div style={{ background: '#E8F5E9', padding: '16px', borderRadius: '6px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Số tiền</div>
                    <div style={{ fontWeight: 600, color: '#2E7D32' }}>
                      {returnItem.refundInfo.amount.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Phương thức</div>
                    <div style={{ fontWeight: 600, color: '#333' }}>
                      {returnItem.refundInfo.method}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Trạng thái</div>
                    <div style={{ fontWeight: 600, color: '#333' }}>
                      {returnItem.refundInfo.status}
                    </div>
                  </div>
                </div>
                {returnItem.refundInfo.proofImage && (
                  <div style={{ marginTop: '16px', borderTop: '1px solid #c8e6c9', paddingTop: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 600 }}>Ảnh bằng chứng hoàn tiền:</div>
                    <a href={returnItem.refundInfo.proofImage} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={returnItem.refundInfo.proofImage} 
                        alt="Bằng chứng hoàn tiền" 
                        style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #a5d6a7' }}
                      />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Refund Form */}
          {showRefundForm && (
            <div style={{ marginBottom: '24px', background: '#E3F2FD', padding: '16px', borderRadius: '6px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#333', marginBottom: '12px' }}>
                Hoàn tiền cho khách
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
                    Số tiền hoàn
                  </label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="Nhập số tiền..."
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
                    Phương thức
                  </label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                    }}
                  >
                    <option value="BANK_TRANSFER">Chuyển khoản</option>
                    <option value="CASH">Tiền mặt</option>
                    <option value="MOMO">MoMo</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
                  Ảnh bằng chứng (Bắt buộc) <span style={{ color: '#c62828' }}>*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setProofImage(e.target.files[0]);
                    } else {
                      setProofImage(null);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '13px',
                    background: '#fff'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            padding: '16px 24px',
            borderTop: '1px solid #f0f0f0',
            background: '#fafafa',
          }}
        >
          {/* PENDING: Show Approve/Reject */}
          {returnItem.status === 'PENDING' && (
            <>
              <button
                onClick={handleReject}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#fff',
                  color: '#C62828',
                  border: '1px solid #C62828',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <XCircle size={18} />
                Từ chối
              </button>
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#2E7D32',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle size={18} />
                Duyệt
              </button>
            </>
          )}

          {/* APPROVED: Show Confirm Received */}
          {returnItem.status === 'APPROVED' && (
            <button
              onClick={handleConfirmReceived}
              disabled={isProcessing}
              style={{
                flex: 1,
                padding: '12px',
                background: '#6A1B9A',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Truck size={18} />
              Xác nhận đã nhận hàng
            </button>
          )}

          {/* RECEIVED: Show Process Refund */}
          {returnItem.status === 'RECEIVED' && (
            <>
              {!showRefundForm && (
                <button
                  onClick={() => setShowRefundForm(true)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#1565C0',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <CreditCard size={18} />
                  Hoàn tiền
                </button>
              )}
              {showRefundForm && (
                <>
                  <button
                    onClick={() => setShowRefundForm(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#fff',
                      color: '#333',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleProcessRefund}
                    disabled={isProcessing}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#1565C0',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      opacity: isProcessing ? 0.7 : 1,
                    }}
                  >
                    {isProcessing ? 'Đang xử lý...' : 'Xác nhận hoàn tiền'}
                  </button>
                </>
              )}
            </>
          )}

          {/* Already REFUNDED or REJECTED: Show Close */}
          {(returnItem.status === 'REFUNDED' || returnItem.status === 'REJECTED') && (
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                background: '#f5f5f5',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
