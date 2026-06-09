'use client';

import { useState, useRef } from 'react';
import { X, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { OrderDetail } from '@/types/order.type';
import { ReturnReason, ReturnRequestPayload } from '@/types/return.type';
import { returnService } from '@/services/return.service';

interface ReturnRequestModalProps {
  order: OrderDetail;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const reasonOptions: { value: ReturnReason; label: string }[] = [
  { value: 'DAMAGED', label: 'Hàng hỏng / vỡ' },
  { value: 'WRONG_ITEM', label: 'Sai sản phẩm' },
  { value: 'NOT_SATISFIED', label: 'Không đúng như mô tả' },
  { value: 'OTHER', label: 'Lý do khác' },
];

export default function ReturnRequestModal({ order, isOpen, onClose, onSuccess }: ReturnRequestModalProps) {
  const [reason, setReason] = useState<ReturnReason>('DAMAGED');
  const [description, setDescription] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<number, { selected: boolean; quantity: number }>>(() => {
    const initial: Record<number, { selected: boolean; quantity: number }> = {};
    order.items.forEach((item) => {
      initial[item.itemId] = { selected: true, quantity: item.quantity };
    });
    return initial;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evidenceImageFiles, setEvidenceImageFiles] = useState<File[]>([]);
  const [evidenceImagePreviews, setEvidenceImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleItemToggle = (itemId: number) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selected: !prev[itemId].selected,
      },
    }));
  };

  const handleQuantityChange = (itemId: number, quantity: number) => {
    const maxQty = order.items.find((item) => item.itemId === itemId)?.quantity || 1;
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantity: Math.max(1, Math.min(quantity, maxQty)),
      },
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (evidenceImageFiles.length + files.length > 5) {
      setError('Tối đa chỉ được tải lên 5 ảnh');
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG,...)');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước mỗi ảnh không được vượt quá 5MB');
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setEvidenceImageFiles(prev => [...prev, ...validFiles]);
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setEvidenceImagePreviews(prev => [...prev, ...newPreviews]);
      setError(null);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setEvidenceImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setEvidenceImagePreviews(prev => {
      const urlToRemove = prev[indexToRemove];
      if (urlToRemove) URL.revokeObjectURL(urlToRemove);
      return prev.filter((_, index) => index !== indexToRemove);
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    const selectedItemIds = Object.entries(selectedItems)
      .filter(([, value]) => value.selected)
      .map(([itemId]) => parseInt(itemId));

    if (selectedItemIds.length === 0) {
      setError('Vui lòng chọn ít nhất một sản phẩm để hoàn');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const uploadedImageUrls: string[] = [];

      if (evidenceImageFiles.length > 0) {
        for (const file of evidenceImageFiles) {
          const uploadResult = await returnService.uploadReturnImage(file);
          uploadedImageUrls.push(uploadResult.url);
        }
      }

      const payload: ReturnRequestPayload = {
        reason,
        description: description.trim() || undefined,
        evidenceImages: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
        items: selectedItemIds.map((itemId) => ({
          orderItemId: itemId,
          quantity: selectedItems[itemId].quantity,
        })),
      };

      await returnService.createReturn(order.orderId, payload);
      onSuccess();
    } catch (err) {
      console.error('Error creating return request:', err);
      setError((err as Error).message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsSubmitting(false);
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
          maxWidth: '600px',
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
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#333' }}>
            Yêu cầu hoàn hàng
          </h2>
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
          <div style={{ marginBottom: '24px', padding: '12px', background: '#f9f9f9', borderRadius: '6px' }}>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
              Đơn hàng: <strong>{order.orderCode}</strong>
            </div>
            <div style={{ fontSize: '13px', color: '#666' }}>
              Tổng tiền: <strong style={{ color: '#A57322' }}>{order.totalAmount.toLocaleString('vi-VN')} đ</strong>
            </div>
          </div>

          {/* Reason Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
              Lý do hoàn hàng *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReturnReason)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px',
              }}
            >
              {reasonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
              Mô tả chi tiết (tùy chọn)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả chi tiết vấn đề của bạn..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Evidence Image */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
              Hình ảnh bằng chứng (nếu có)
            </label>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {evidenceImagePreviews.map((preview, index) => (
                <div key={index} style={{ position: 'relative', width: '100px', height: '100px' }}>
                  <img
                    src={preview}
                    alt={`Bằng chứng ${index + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee' }}
                  />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#fff',
                      border: '1px solid #ddd',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#ff4d4f',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {evidenceImagePreviews.length < 5 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '100px',
                    height: '100px',
                    border: '1px dashed #ccc',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    background: '#fafafa',
                    color: '#666',
                    gap: '8px',
                  }}
                >
                  <Upload size={24} />
                  <span style={{ fontSize: '12px', textAlign: 'center', padding: '0 4px' }}>Tải ảnh ({evidenceImagePreviews.length}/5)</span>
                </div>
              )}
              
              <div style={{ fontSize: '13px', color: '#777', marginTop: '8px', flex: '1 1 100%' }}>
                <p style={{ margin: '0 0 4px' }}>Tải lên tối đa 5 hình ảnh rõ nét chứng minh vấn đề (hàng hỏng, sai sản phẩm...).</p>
                <p style={{ margin: 0 }}>Định dạng: JPG, PNG. Tối đa 5MB.</p>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              multiple
              style={{ display: 'none' }}
            />
          </div>

          {/* Item Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '12px', color: '#333' }}>
              Chọn sản phẩm muốn hoàn *
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {order.items.map((item) => (
                <div
                  key={item.itemId}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    padding: '12px',
                    background: selectedItems[item.itemId]?.selected ? '#fff' : '#f9f9f9',
                    border: selectedItems[item.itemId]?.selected ? '1px solid #A57322' : '1px solid #ddd',
                    borderRadius: '6px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedItems[item.itemId]?.selected || false}
                    onChange={() => handleItemToggle(item.itemId)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#333', marginBottom: '4px' }}>
                      {item.productName}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      {item.variantInfo} - {(item.totalPrice / item.quantity).toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                  {selectedItems[item.itemId]?.selected && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#666' }}>SL:</span>
                      <input
                        type="number"
                        min={1}
                        max={item.quantity}
                        value={selectedItems[item.itemId]?.quantity || 1}
                        onChange={(e) => handleQuantityChange(item.itemId, parseInt(e.target.value) || 1)}
                        style={{
                          width: '60px',
                          padding: '6px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          textAlign: 'center',
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: '12px',
                background: '#FFEBEE',
                color: '#C62828',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
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
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '12px',
                background: '#A57322',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
