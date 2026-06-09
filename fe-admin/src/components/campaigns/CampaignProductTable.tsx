'use client';

import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
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
import { CampaignProductVariantItem, DiscountType, formatCurrency } from '@/types/campaign.type';
import { ProductVariant } from '@/types/product.type';
import { SortableCampaignProductRow } from './SortableCampaignProductRow';

interface CampaignProductTableProps {
  items: CampaignProductVariantItem[];
  onItemsChange: (items: CampaignProductVariantItem[]) => void;
  readOnly?: boolean;
}

export default function CampaignProductTable({
  items,
  onItemsChange,
  readOnly = false,
}: CampaignProductTableProps) {
  const [localItems, setLocalItems] = useState<CampaignProductVariantItem[]>([]);
  const [globalDiscountType, setGlobalDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<number | ''>('');

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const calculateDiscount = (originalPrice: number, discountType: DiscountType, discountValue: number): number => {
    if (discountType === 'PERCENTAGE') {
      return Math.round(originalPrice * discountValue / 100);
    }
    return discountValue;
  };

  const calculateFinalPrice = (originalPrice: number, discountAmount: number): number => {
    return Math.max(0, originalPrice - discountAmount);
  };

  const updateItem = (index: number, field: keyof CampaignProductVariantItem, value: any) => {
    const newItems = [...localItems];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'discountType' || field === 'discountValue') {
      const originalPrice = newItems[index].originalPrice || 0;
      const discountType = field === 'discountType' ? value : newItems[index].discountType;
      const discountValue = field === 'discountValue' ? value : newItems[index].discountValue;

      if (discountType && discountValue !== undefined && discountValue !== null) {
        const discountAmount = calculateDiscount(originalPrice, discountType, discountValue);
        const finalPrice = calculateFinalPrice(originalPrice, discountAmount);
        newItems[index].discountAmount = discountAmount;
        newItems[index].finalPrice = finalPrice;
      }
    }

    setLocalItems(newItems);
    onItemsChange(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = localItems.filter((_, i) => i !== index);
    setLocalItems(newItems);
    onItemsChange(newItems);
  };

  const applyGlobalDiscount = () => {
    if (globalDiscountValue === '') return;
    const val = Number(globalDiscountValue);
    const newItems = localItems.map(item => {
      const originalPrice = item.originalPrice || 0;
      const discountAmount = calculateDiscount(originalPrice, globalDiscountType, val);
      const finalPrice = calculateFinalPrice(originalPrice, discountAmount);
      return {
        ...item,
        discountType: globalDiscountType,
        discountValue: val,
        discountAmount,
        finalPrice
      };
    });
    setLocalItems(newItems);
    onItemsChange(newItems);
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

  const handleDragEnd = (event: any) => {
    if (readOnly) return;
    
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localItems.findIndex((item) => item.productVariantId.toString() === active.id);
    const newIndex = localItems.findIndex((item) => item.productVariantId.toString() === over.id);

    const newItems = arrayMove(localItems, oldIndex, newIndex);
    newItems.forEach((item, i) => {
      item.displayOrder = i;
    });

    setLocalItems(newItems);
    onItemsChange(newItems);
  };

  if (localItems.length === 0) {
    return (
      <div
        style={{
          padding: '32px',
          textAlign: 'center',
          background: '#fafafa',
          borderRadius: '8px',
          border: '1px dashed #e0e0e0',
          color: '#999',
        }}
      >
        Chưa có sản phẩm nào. Sử dụng công cụ chọn sản phẩm để thêm sản phẩm vào chiến dịch.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      {!readOnly && localItems.length > 0 && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '16px', 
          background: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontWeight: 500, fontSize: '14px', color: '#333' }}>Giảm giá chung:</span>
          <select
            value={globalDiscountType}
            onChange={(e) => setGlobalDiscountType(e.target.value as DiscountType)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: '#fff',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="PERCENTAGE">Phần trăm (%)</option>
            <option value="FIXED_AMOUNT">Số tiền (VNĐ)</option>
          </select>
          <input
            type="number"
            value={globalDiscountValue}
            onChange={(e) => setGlobalDiscountValue(e.target.value === '' ? '' : parseFloat(e.target.value))}
            placeholder="Nhập giá trị..."
            min="0"
            max={globalDiscountType === 'PERCENTAGE' ? "100" : undefined}
            style={{
              padding: '8px 12px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              fontSize: '14px',
              width: '150px',
              outline: 'none'
            }}
          />
          <button
            type="button"
            onClick={applyGlobalDiscount}
            disabled={globalDiscountValue === ''}
            style={{
              padding: '8px 16px',
              background: globalDiscountValue === '' ? '#f5f5f5' : '#1890ff',
              color: globalDiscountValue === '' ? '#b8b8b8' : '#fff',
              border: globalDiscountValue === '' ? '1px solid #d9d9d9' : '1px solid #1890ff',
              borderRadius: '6px',
              cursor: globalDiscountValue === '' ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s',
              boxShadow: globalDiscountValue === '' ? 'none' : '0 2px 0 rgba(0,0,0,0.045)'
            }}
          >
            Áp dụng tất cả
          </button>
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, width: '40px' }}>#</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Sản phẩm</th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Giá gốc</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, width: '150px' }}>Loại giảm</th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, width: '120px' }}>Giá trị</th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Giảm</th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Giá cuối</th>
              {!readOnly && <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, width: '80px' }}>Thao tác</th>}
            </tr>
          </thead>
          <SortableContext
            items={localItems.map(item => item.productVariantId.toString())}
            strategy={verticalListSortingStrategy}
          >
            <tbody>
              {localItems.map((item, index) => (
                <SortableCampaignProductRow
                  key={item.productVariantId}
                  item={item}
                  index={index}
                  readOnly={readOnly}
                  onUpdate={updateItem}
                  onRemove={removeItem}
                />
              ))}
            </tbody>
          </SortableContext>
        </table>
      </DndContext>

      {/* Summary */}
      <div
        style={{
          marginTop: '16px',
          padding: '16px',
          background: '#fafafa',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '24px',
        }}
      >
        <div>
          <span style={{ color: '#666' }}>Tổng sản phẩm: </span>
          <strong>{localItems.length}</strong>
        </div>
        <div>
          <span style={{ color: '#666' }}>Tổng giảm: </span>
          <strong style={{ color: '#c62828' }}>
            {formatCurrency(localItems.reduce((sum, item) => sum + (item.discountAmount || 0), 0))}
          </strong>
        </div>
      </div>
    </div>
  );
}
