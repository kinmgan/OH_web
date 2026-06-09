'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Edit3, Loader2, AlertCircle, Layout } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { HomepageSection, HomepageSectionType } from '@/types/homepageSection.type';
import { homepageSectionAdminService } from '@/services/homepageSection.service';
import { SortableHomepageSection } from '@/components/homepage/SortableHomepageSection';

const TYPE_LABELS: Record<HomepageSectionType, string> = {
  CATEGORY: 'Theo Danh mục',
  TOP_SALES: 'Bán chạy nhất',
  TOP_RATED: 'Đánh giá cao',
  NEW_ARRIVALS: 'Hàng mới về',
};

const TYPE_COLORS: Record<HomepageSectionType, string> = {
  CATEGORY: '#e3f2fd',
  TOP_SALES: '#e8f5e9',
  TOP_RATED: '#fff3e0',
  NEW_ARRIVALS: '#f3e5f5',
};

const TYPE_TEXT_COLORS: Record<HomepageSectionType, string> = {
  CATEGORY: '#1565c0',
  TOP_SALES: '#2e7d32',
  TOP_RATED: '#e65100',
  NEW_ARRIVALS: '#7b1fa2',
};

export default function HomepageLayoutPage() {
  const router = useRouter();
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchSections = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await homepageSectionAdminService.getAllSections();
      setSections(data.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách khối');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const handleDeleteConfirm = async () => {
    if (deletingId === null) return;
    setDeleteLoading(true);
    try {
      await homepageSectionAdminService.deleteSection(deletingId);
      setDeletingId(null);
      fetchSections();
    } catch (err: any) {
      alert(err.message || 'Không thể xóa khối');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleActive = async (section: HomepageSection) => {
    setUpdatingId(section.id);
    try {
      await homepageSectionAdminService.updateSection(section.id, {
        title: section.title,
        type: section.type,
        referenceId: section.referenceId,
        sortOrder: section.sortOrder,
        limitItems: section.limitItems,
        isActive: !section.isActive,
      });
      fetchSections();
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật trạng thái');
    } finally {
      setUpdatingId(null);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sections.findIndex((sec) => sec.id.toString() === active.id);
    const newIndex = sections.findIndex((sec) => sec.id.toString() === over.id);

    const newSections = arrayMove(sections, oldIndex, newIndex);
    setSections(newSections);

    const orderList = newSections.map((s, idx) => ({ id: s.id, sortOrder: idx }));

    try {
      await homepageSectionAdminService.updateSortOrder(orderList);
      fetchSections();
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật thứ tự');
      fetchSections(); // Revert on error
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#333', marginBottom: '4px' }}>Giao diện Trang chủ</h1>
          <p style={{ fontSize: '14px', color: '#888' }}>Quản lý các khối hiển thị động trên trang chủ</p>
        </div>
        <button
          onClick={() => router.push('/homepage-layout/tao-moi')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: '#A57322',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#8B601D')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#A57322')}
        >
          <Plus size={18} />
          Thêm khối mới
        </button>
      </div>

      {/* Info Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 20px',
        background: '#e8f5e9',
        border: '1px solid #c8e6c9',
        borderRadius: '8px',
        marginBottom: '24px',
        fontSize: '14px',
        color: '#2e7d32',
      }}>
        <Layout size={20} />
        <span>Các khối bên dưới sẽ hiển thị theo thứ tự từ trên xuống trên trang chủ. Kéo lên/xuống để sắp xếp.</span>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 0', gap: '12px', color: '#888' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Đang tải...</span>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          background: '#ffebee',
          border: '1px solid #ffcdd2',
          borderRadius: '8px',
          color: '#c62828',
          fontSize: '14px',
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={fetchSections} style={{
            marginLeft: 'auto',
            padding: '6px 16px',
            background: '#c62828',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
          }}>
            Thử lại
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && sections.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#888' }}>
          <Layout size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Chưa có khối nào</p>
          <p style={{ fontSize: '13px' }}>Bấm "Thêm khối mới" để bắt đầu cấu hình trang chủ</p>
        </div>
      )}

      {/* Sections List */}
      {!loading && !error && sections.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <SortableContext
              items={sections.map(s => s.id.toString())}
              strategy={verticalListSortingStrategy}
            >
              {sections.map((section, index) => (
                <SortableHomepageSection
                  key={section.id}
                  section={section}
                  index={index}
                  updatingId={updatingId}
                  onToggleActive={handleToggleActive}
                  onEdit={(id) => router.push(`/homepage-layout/${id}/sua`)}
                  onDelete={(id) => setDeletingId(id)}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      )}

      {/* Delete Confirm Dialog */}
      {deletingId !== null && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => !deleteLoading && setDeletingId(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '32px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#ffebee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Trash2 size={24} color="#d32f2f" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#333', marginBottom: '8px' }}>
              Xóa khối?
            </h3>
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '24px', lineHeight: 1.5 }}>
              Bạn có chắc muốn xóa khối &quot;<strong>{sections.find(s => s.id === deletingId)?.title}</strong>&quot;?
              <br />Hành động này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setDeletingId(null)}
                disabled={deleteLoading}
                style={{
                  padding: '10px 24px',
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
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                style={{
                  padding: '10px 24px',
                  background: deleteLoading ? '#e57373' : '#d32f2f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  opacity: deleteLoading ? 0.7 : 1,
                }}
              >
                {deleteLoading ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
