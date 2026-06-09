import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, GripVertical } from 'lucide-react';
import { CampaignProductVariantItem, DiscountType, formatCurrency } from '@/types/campaign.type';

interface Props {
  item: CampaignProductVariantItem;
  index: number;
  readOnly: boolean;
  onUpdate: (index: number, field: keyof CampaignProductVariantItem, value: any) => void;
  onRemove: (index: number) => void;
}

export function SortableCampaignProductRow({ item, index, readOnly, onUpdate, onRemove }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.productVariantId.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
    background: isDragging ? '#f9f9f9' : 'transparent',
    borderBottom: '1px solid #f0f0f0',
  };

  const originalPrice = item.originalPrice || 0;
  const discountAmount = item.discountAmount || 0;
  const finalPrice = item.finalPrice || 0;

  return (
    <tr ref={setNodeRef} style={style}>
      <td style={{ padding: '12px', color: '#999', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!readOnly && (
            <div 
              {...attributes} 
              {...listeners}
              style={{ cursor: 'grab', color: '#ccc', display: 'flex', alignItems: 'center' }}
            >
              <GripVertical size={16} />
            </div>
          )}
          {index + 1}
        </div>
      </td>
      <td style={{ padding: '12px' }}>
        <div style={{ fontWeight: 500 }}>{item.productName || 'Sản phẩm'}</div>
        <div style={{ fontSize: '12px', color: '#666' }}>{item.unitName}</div>
      </td>
      <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace' }}>
        {formatCurrency(originalPrice)}
      </td>
      <td style={{ padding: '12px' }}>
        {readOnly ? (
          <span
            style={{
              display: 'inline-block',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              background: item.discountType === 'PERCENTAGE' ? '#e3f2fd' : '#fff3e0',
              color: item.discountType === 'PERCENTAGE' ? '#1565c0' : '#e65100',
            }}
          >
            {item.discountType === 'PERCENTAGE' ? 'Phần trăm' : 'Số tiền'}
          </span>
        ) : (
          <select
            value={item.discountType}
            onChange={(e) => onUpdate(index, 'discountType', e.target.value as DiscountType)}
            style={{
              padding: '6px 8px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              fontSize: '13px',
              width: '100%',
            }}
          >
            <option value="PERCENTAGE">Phần trăm (%)</option>
            <option value="FIXED_AMOUNT">Số tiền (VNĐ)</option>
          </select>
        )}
      </td>
      <td style={{ padding: '12px' }}>
        {readOnly ? (
          <span style={{ fontFamily: 'monospace' }}>
            {item.discountType === 'PERCENTAGE'
              ? `${item.discountValue}%`
              : formatCurrency(item.discountValue)}
          </span>
        ) : (
          <input
            type="number"
            value={item.discountValue === 0 ? '' : item.discountValue}
            onChange={(e) => {
              const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
              onUpdate(index, 'discountValue', val);
            }}
            min="0"
            max={item.discountType === 'PERCENTAGE' ? "100" : undefined}
            step={item.discountType === 'PERCENTAGE' ? '1' : '1000'}
            style={{
              width: '100%',
              padding: '6px 8px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              fontSize: '13px',
              textAlign: 'right',
              fontFamily: 'monospace',
            }}
          />
        )}
      </td>
      <td
        style={{
          padding: '12px',
          textAlign: 'right',
          fontFamily: 'monospace',
          color: '#c62828',
          fontWeight: 500,
        }}
      >
        -{formatCurrency(discountAmount)}
      </td>
      <td
        style={{
          padding: '12px',
          textAlign: 'right',
          fontFamily: 'monospace',
          color: '#2e7d32',
          fontWeight: 700,
          fontSize: '15px',
        }}
      >
        {formatCurrency(finalPrice)}
      </td>
      {!readOnly && (
        <td style={{ padding: '12px', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
            <button
              onClick={() => onRemove(index)}
              title="Xóa"
              style={{
                padding: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#c62828',
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}
