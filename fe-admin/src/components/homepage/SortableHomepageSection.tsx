import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit3, Trash2, GripVertical } from 'lucide-react';
import { HomepageSection, HomepageSectionType } from '@/types/homepageSection.type';

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

interface Props {
  section: HomepageSection;
  index: number;
  updatingId: number | null;
  onToggleActive: (section: HomepageSection) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function SortableHomepageSection({
  section,
  index,
  updatingId,
  onToggleActive,
  onEdit,
  onDelete,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id.toString() });

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
        borderRadius: '10px',
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 20px',
        position: 'relative',
      }}
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        style={{ color: '#ccc', cursor: 'grab', display: 'flex', alignItems: 'center' }}
      >
        <GripVertical size={20} />
      </div>

      {/* Sort Order */}
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: '#FCF8F1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '14px',
        color: '#A57322',
        flexShrink: 0,
      }}>
        {index + 1}
      </div>

      {/* Section Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#333', margin: 0 }}>{section.title}</h3>
          <span style={{
            fontSize: '12px',
            padding: '3px 10px',
            borderRadius: '20px',
            background: TYPE_COLORS[section.type],
            color: TYPE_TEXT_COLORS[section.type],
            fontWeight: 500,
          }}>
            {TYPE_LABELS[section.type]}
          </span>
          {section.categoryName && (
            <span style={{
              fontSize: '12px',
              padding: '3px 10px',
              borderRadius: '20px',
              background: '#f5f5f5',
              color: '#666',
            }}>
              Danh mục: {section.categoryName}
            </span>
          )}
          <span style={{ fontSize: '12px', color: '#999' }}>
            Hiển thị {section.limitItems} sản phẩm
          </span>
        </div>
      </div>

      {/* Active Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{ fontSize: '13px', color: section.isActive ? '#2e7d32' : '#999' }}>
          {section.isActive ? 'Đang hiển thị' : 'Đã ẩn'}
        </span>
        <button
          onClick={() => onToggleActive(section)}
          disabled={updatingId === section.id}
          style={{
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            background: section.isActive ? '#4caf50' : '#e0e0e0',
            border: 'none',
            cursor: updatingId === section.id ? 'not-allowed' : 'pointer',
            position: 'relative',
            transition: 'background 0.2s',
            opacity: updatingId === section.id ? 0.7 : 1,
          }}
        >
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: '2px',
            left: section.isActive ? '22px' : '2px',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={() => onEdit(section.id)}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            border: '1px solid #e0e0e0',
            background: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
          }}
        >
          <Edit3 size={16} />
        </button>
        <button
          onClick={() => onDelete(section.id)}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            border: '1px solid #ffcdd2',
            background: '#ffebee',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#d32f2f',
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
