'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, AlertCircle, FolderOpen, Trash2 } from 'lucide-react';
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
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Category } from '@/types/category.type';
import { categoryAdminService } from '@/services/category.service';
import CategoryFormModal from '@/components/categories/CategoryFormModal';
import { SortableCategoryItem } from '@/components/categories/SortableCategoryItem';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await categoryAdminService.getAllCategories();
      // Ensure categories are sorted by displayOrder
      const sortedData = data.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      setCategories(sortedData);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh mục');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Mở modal thêm mới
  const handleAdd = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  // Mở modal sửa
  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setModalOpen(true);
  };

  // Xác nhận xóa
  const handleDeleteConfirm = async () => {
    if (deletingId === null) return;
    setDeleteLoading(true);
    try {
      await categoryAdminService.deleteCategory(deletingId);
      setDeletingId(null);
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Không thể xóa danh mục');
    } finally {
      setDeleteLoading(false);
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

    const oldIndex = categories.findIndex((cat) => cat.id.toString() === active.id);
    const newIndex = categories.findIndex((cat) => cat.id.toString() === over.id);

    const newCategories = arrayMove(categories, oldIndex, newIndex);
    setCategories(newCategories); // Optimistic UI update

    setLoading(true);
    try {
      // Re-assign display orders based on new array order
      const updatePromises = newCategories.map((cat, idx) => {
        if (cat.displayOrder !== idx) {
          return categoryAdminService.updateCategory(cat.id, {
            name: cat.name,
            description: cat.description || '',
            cateCode: cat.cate_code || '',
            displayOrder: idx,
          });
        }
        return Promise.resolve();
      });
      await Promise.all(updatePromises);
      await fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Không thể lưu thứ tự mới');
      await fetchCategories(); // Revert on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#333', marginBottom: '4px' }}>Danh mục</h1>
          <p style={{ fontSize: '14px', color: '#888' }}>Quản lý danh mục sản phẩm</p>
        </div>
        <button
          onClick={handleAdd}
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
          onMouseEnter={(e) => (e.currentTarget.style.background = '#8B601D')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#A57322')}
        >
          <Plus size={18} />
          Thêm danh mục
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 0', gap: '12px', color: '#888' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Đang tải danh mục...</span>
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
          <button
            onClick={fetchCategories}
            style={{
              marginLeft: 'auto',
              padding: '6px 16px',
              background: '#c62828',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && categories.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '80px 0',
          color: '#888',
        }}>
          <FolderOpen size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Chưa có danh mục nào</p>
          <p style={{ fontSize: '13px' }}>Bấm &quot;Thêm danh mục&quot; để tạo danh mục đầu tiên</p>
        </div>
      )}

      {/* Categories Grid */}
      {!loading && !error && categories.length > 0 && (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            <SortableContext 
              items={categories.map(c => c.id.toString())}
              strategy={rectSortingStrategy}
            >
              {categories.map((cat) => (
                <SortableCategoryItem 
                  key={cat.id} 
                  category={cat} 
                  onEdit={handleEdit} 
                  onDelete={(id) => setDeletingId(id)} 
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      )}

      {/* Create/Edit Modal */}
      <CategoryFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchCategories}
        category={editingCategory}
      />

      {/* Delete Confirm Dialog */}
      {deletingId !== null && (
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
              Xóa danh mục?
            </h3>
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '24px', lineHeight: 1.5 }}>
              Bạn có chắc muốn xóa danh mục &quot;<strong>{categories.find(c => c.id === deletingId)?.name}</strong>&quot;?
              <br />Hành động này không thể hoàn tác.
              <br /><strong style={{ color: '#d32f2f', display: 'block', marginTop: '8px' }}>Cảnh báo: Xóa danh mục này sẽ xóa hết các sản phẩm tương ứng!</strong>
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
