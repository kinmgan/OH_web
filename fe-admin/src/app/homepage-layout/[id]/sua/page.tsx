'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { HomepageSectionType } from '@/types/homepageSection.type';
import { homepageSectionAdminService } from '@/services/homepageSection.service';
import { categoryAdminService } from '@/services/category.service';
import { Category } from '@/types/category.type';

const TYPE_OPTIONS: { value: HomepageSectionType; label: string; description: string }[] = [
  { value: 'CATEGORY', label: 'Theo Danh mục', description: 'Hiển thị sản phẩm thuộc một danh mục cụ thể' },
  { value: 'TOP_SALES', label: 'Bán chạy nhất', description: 'Hiển thị các sản phẩm có lượt mua cao nhất' },
  { value: 'TOP_RATED', label: 'Đánh giá cao', description: 'Hiển thị các sản phẩm được đánh giá cao nhất' },
  { value: 'NEW_ARRIVALS', label: 'Hàng mới về', description: 'Hiển thị các sản phẩm mới nhất' },
];

export default function EditHomepageSectionPage() {
  const router = useRouter();
  const params = useParams();
  const sectionId = Number(params.id);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [type, setType] = useState<HomepageSectionType>('CATEGORY');
  const [referenceId, setReferenceId] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState(0);
  const [limitItems, setLimitItems] = useState(10);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    categoryAdminService.getAllCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, []);

  useEffect(() => {
    if (!sectionId) return;
    homepageSectionAdminService.getSectionById(sectionId)
      .then((section) => {
        setTitle(section.title);
        setType(section.type);
        setReferenceId(section.referenceId);
        setSortOrder(section.sortOrder);
        setLimitItems(section.limitItems);
        setIsActive(section.isActive);
      })
      .catch(() => {
        alert('Không thể tải thông tin khối');
        router.push('/homepage-layout');
      })
      .finally(() => setLoadingData(false));
  }, [sectionId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Tiêu đề không được để trống');
      return;
    }

    if (type === 'CATEGORY' && !referenceId) {
      setError('Vui lòng chọn danh mục');
      return;
    }

    setLoading(true);
    try {
      await homepageSectionAdminService.updateSection(sectionId, {
        title: title.trim(),
        type,
        referenceId: type === 'CATEGORY' ? referenceId : null,
        sortOrder,
        limitItems,
        isActive,
      });
      router.push('/homepage-layout');
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi cập nhật khối');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 0', gap: '12px', color: '#888' }}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Đang tải...</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => router.push('/homepage-layout')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#666',
            fontSize: '14px',
            marginBottom: '16px',
          }}
        >
          <ArrowLeft size={18} />
          Quay lại danh sách
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Chỉnh sửa khối</h1>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '12px 16px',
          background: '#ffebee',
          border: '1px solid #ffcdd2',
          borderRadius: '8px',
          color: '#c62828',
          marginBottom: '24px',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div style={{
          background: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: '24px',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Thông tin cơ bản</h2>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
              Tiêu đề hiển thị <span style={{ color: '#c62828' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Top sản phẩm đỉnh cao, Hàng mới về tháng này..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
              Loại khối <span style={{ color: '#c62828' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {TYPE_OPTIONS.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '8px',
                    border: `2px solid ${type === opt.value ? '#A57322' : '#e0e0e0'}`,
                    background: type === opt.value ? '#faf6f0' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    fontWeight: 600,
                    fontSize: '14px',
                    color: type === opt.value ? '#A57322' : '#333',
                    marginBottom: '4px',
                  }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    {opt.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {type === 'CATEGORY' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                Danh mục <span style={{ color: '#c62828' }}>*</span>
              </label>
              {loadingCategories ? (
                <div style={{ color: '#888', fontSize: '14px' }}>Đang tải danh mục...</div>
              ) : (
                <select
                  value={referenceId || ''}
                  onChange={(e) => setReferenceId(e.target.value ? Number(e.target.value) : null)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Settings */}
        <div style={{
          background: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: '24px',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Cài đặt hiển thị</h2>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
              Số sản phẩm hiển thị
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={limitItems}
              onChange={(e) => setLimitItems(Math.max(1, parseInt(e.target.value) || 1))}
              style={{
                width: '120px',
                padding: '10px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '2px' }}>Trạng thái</div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                {isActive ? 'Khối sẽ hiển thị trên trang chủ' : 'Khối sẽ bị ẩn'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              style={{
                width: '48px',
                height: '26px',
                borderRadius: '13px',
                background: isActive ? '#4caf50' : '#e0e0e0',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: '#fff',
                position: 'absolute',
                top: '2px',
                left: isActive ? '24px' : '2px',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '14px 24px',
            background: '#A57322',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              Đang cập nhật...
            </>
          ) : (
            <>
              <Save size={18} />
              Cập nhật khối
            </>
          )}
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </button>
      </form>
    </div>
  );
}
