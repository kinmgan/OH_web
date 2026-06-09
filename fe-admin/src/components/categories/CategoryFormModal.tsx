'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Category, CategoryRequest } from '@/types/category.type';
import { categoryAdminService } from '@/services/category.service';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: Category | null; // null/undefined = create mode, có giá trị = edit mode
}

export default function CategoryFormModal({ isOpen, onClose, onSuccess, category }: CategoryFormModalProps) {
  const isEdit = !!category;

  const [formData, setFormData] = useState<CategoryRequest>({
    name: '',
    description: '',
    cateCode: '',
    displayOrder: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form khi modal mở/đóng hoặc đổi category
  useEffect(() => {
    if (isOpen && category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        cateCode: category.cate_code || '',
        displayOrder: category.displayOrder ?? 0,
      });
    } else if (isOpen) {
      setFormData({ name: '', description: '', cateCode: '', displayOrder: 0 });
    }
    setError('');
  }, [isOpen, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Tên danh mục không được để trống');
      return;
    }

    setLoading(true);
    try {
      if (isEdit && category) {
        await categoryAdminService.updateCategory(category.id, formData);
      } else {
        await categoryAdminService.createCategory(formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '32px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#333' }}>
            {isEdit ? 'Sửa danh mục' : 'Thêm danh mục mới'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#999',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '13px',
            border: '1px solid #ffcdd2',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Tên danh mục */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '6px' }}>
              Tên danh mục <span style={{ color: '#d32f2f' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Bổ máu, Giảm cân..."
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#A57322')}
              onBlur={(e) => (e.target.style.borderColor = '#ddd')}
            />
          </div>

          {/* Mã danh mục */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '6px' }}>
              Mã danh mục
            </label>
            <input
              type="text"
              value={formData.cateCode}
              onChange={(e) => setFormData({ ...formData, cateCode: e.target.value })}
              placeholder="VD: BO_MAU, GIAM_CAN..."
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#A57322')}
              onBlur={(e) => (e.target.style.borderColor = '#ddd')}
            />
          </div>

          {/* Mô tả */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '6px' }}>
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả ngắn về danh mục..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#A57322')}
              onBlur={(e) => (e.target.style.borderColor = '#ddd')}
            />
          </div>



          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                color: '#666',
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 24px',
                background: loading ? '#c5a062' : '#A57322',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Đang xử lý...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
