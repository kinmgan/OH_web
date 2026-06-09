import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit3, Trash2, GripVertical } from 'lucide-react';
import { Category } from '@/types/category.type';

interface Props {
  category: Category;
  onEdit: (cat: Category) => void;
  onDelete: (id: number) => void;
}

export function SortableCategoryItem({ category, onEdit, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: '#fff',
        padding: '24px',
        borderRadius: '8px',
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div 
        {...attributes} 
        {...listeners} 
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          cursor: 'grab',
          color: '#ccc',
          padding: '4px',
        }}
      >
        <GripVertical size={20} />
      </div>

      <div style={{ marginBottom: '16px', flex: 1, paddingRight: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#333' }}>{category.name}</h3>
        </div>
        {category.cate_code && (
          <span style={{
            display: 'inline-block',
            fontSize: '11px',
            padding: '2px 8px',
            background: '#f0f0f0',
            borderRadius: '4px',
            color: '#888',
            fontFamily: 'monospace',
            marginBottom: '8px',
          }}>
            {category.cate_code}
          </span>
        )}
        <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.5 }}>
          {category.description || 'Chưa có mô tả'}
        </p>
      </div>

      <div style={{
        background: '#FCF8F1',
        padding: '12px',
        borderRadius: '6px',
        marginBottom: '16px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#A57322' }}>{category.productCount}</div>
        <div style={{ fontSize: '12px', color: '#888' }}>sản phẩm</div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onEdit(category)}
          style={{
            flex: 1,
            padding: '10px 12px',
            background: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '13px',
            color: '#666',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#efefef')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#f5f5f5')}
        >
          <Edit3 size={16} />
          Sửa
        </button>
        <button
          onClick={() => onDelete(category.id)}
          style={{
            flex: 1,
            padding: '10px 12px',
            background: '#ffebee',
            border: '1px solid #ffcdd2',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '13px',
            color: '#d32f2f',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#ffcdd2')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#ffebee')}
        >
          <Trash2 size={16} />
          Xóa
        </button>
      </div>
    </div>
  );
}
