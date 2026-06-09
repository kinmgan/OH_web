'use client';

import { useState } from 'react';
import { CartItemResponse } from '@/types/cart.type';
import QuantityInput from '../common/QuantityInput';

type Props = {
  items: CartItemResponse[];
  onUpdateQuantity: (cartItemId: number, quantity: number) => void;
  onRemoveItem: (item: CartItemResponse) => void;
  selectedItemIds: number[];
  onToggleSelect: (cartItemId: number) => void;
  onToggleSelectAll: () => void;
};

export default function CartTable({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem,
  selectedItemIds,
  onToggleSelect,
  onToggleSelectAll
}: Props) {
  const [hoveredItemId, setHoveredItemId] = useState<number | null>(null);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '40px 3fr 1fr 1fr 1fr',
        background: '#fff',
        padding: '20px',
        borderRadius: '8px',
        fontWeight: 500,
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <input 
            type="checkbox" 
            checked={items.length > 0 && selectedItemIds.length === items.length}
            onChange={onToggleSelectAll}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>
        <div>Sản phẩm</div>
        <div style={{ textAlign: 'center' }}>Giá</div>
        <div style={{ textAlign: 'center' }}>Quantity</div>
        <div style={{ textAlign: 'right' }}>Tổng tiền</div>
      </div>

      {/* Body */}
      {items.map(item => (
        <div
          key={item.cartItemId}
          onMouseEnter={() => setHoveredItemId(item.cartItemId)}
          onMouseLeave={() => setHoveredItemId(null)}
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 3fr 1fr 1fr 1fr',
            alignItems: 'center',
            background: '#fff',
            padding: '24px 20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            transition: 'all 0.2s ease',
            cursor: 'default'
          }}
        >
          {/* Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <input 
              type="checkbox"
              checked={selectedItemIds.includes(item.cartItemId)}
              onChange={() => onToggleSelect(item.cartItemId)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          {/* Product info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ position: 'relative' }}>
              <img src={item.imageUrl} alt={item.productName} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '4px' }} />
              <button
                onClick={() => onRemoveItem(item)}
                style={{
                  position: 'absolute',
                  top: '-8px', left: '-8px',
                  background: '#ef5350', color: '#fff',
                  border: 'none', borderRadius: '50%',
                  width: '18px', height: '18px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  opacity: hoveredItemId === item.cartItemId ? 1 : 0,
                  transform: hoveredItemId === item.cartItemId ? 'scale(1)' : 'scale(0.8)',
                  transition: 'opacity 0.2s ease, transform 0.2s ease',
                  pointerEvents: hoveredItemId === item.cartItemId ? 'auto' : 'none'
                }}
                title="Xóa sản phẩm"
              >
                ✕
              </button>
            </div>
            <div>
              <div style={{ fontWeight: 500, color: '#333', fontSize: '15px' }}>{item.productName}</div>
              <div style={{ color: '#9e9e9e', fontSize: '13px', marginTop: '4px' }}>{item.unitName}</div>
            </div>
          </div>

          {/* Price */}
          <div style={{ textAlign: 'center', fontWeight: 500, color: '#333' }}>
            {item.discountAmount && item.discountAmount > 0 ? (
              <div className="flex flex-col items-center">
                <span className="text-[#c62828] font-semibold">{item.finalPrice?.toLocaleString('vi-VN')}</span>
                <span className="text-[#9e9e9e] text-sm line-through">{item.originalPrice?.toLocaleString('vi-VN')}</span>
                <span className="bg-[#c62828] text-white text-xs px-1.5 py-0.5 rounded mt-1">
                  -{item.discountType === 'PERCENTAGE' ? `${item.discountValue}%` : item.discountAmount.toLocaleString('vi-VN')}
                </span>
              </div>
            ) : (
              <span>{item.price.toLocaleString('vi-VN')}</span>
            )}
          </div>

          {/* Quantity */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <QuantityInput
              value={item.quantity}
              onChange={(val) => onUpdateQuantity(item.cartItemId, val)}
              onRemove={() => onRemoveItem(item)}
              max={item.stockQuantity}
            />
          </div>

          {/* Total */}
          <div style={{ textAlign: 'right', fontWeight: 600, color: '#333' }}>
            {item.discountAmount && item.discountAmount > 0 ? (
              <div className="flex flex-col items-end">
                <span className="text-[#c62828]">{((item.finalPrice || item.price) * item.quantity).toLocaleString('vi-VN')}</span>
                <span className="text-[#9e9e9e] text-sm line-through">{((item.originalPrice || item.price) * item.quantity).toLocaleString('vi-VN')}</span>
              </div>
            ) : (
              <span>{(item.price * item.quantity).toLocaleString('vi-VN')}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}