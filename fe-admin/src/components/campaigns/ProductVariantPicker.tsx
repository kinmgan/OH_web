'use client';

import { useState, useEffect } from 'react';
import { Search, X, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Product, ProductVariant } from '@/types/product.type';
import { productAdminService } from '@/services/product.service';
import { formatCurrency } from '@/types/campaign.type';

interface ProductVariantPickerProps {
  selectedVariants: ProductVariant[];
  onAddVariant: (product: Product, variant: ProductVariant) => void;
  onRemoveVariant: (productVariantId: number) => void;
}

export default function ProductVariantPicker({
  selectedVariants,
  onAddVariant,
  onRemoveVariant,
}: ProductVariantPickerProps) {
  const [keyword, setKeyword] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  const selectedVariantIds = new Set(selectedVariants.map((v) => v.productVariantId));

  const searchProducts = async (resetPage = true) => {
    if (loading) return;
    setLoading(true);

    try {
      const currentPage = resetPage ? 0 : page;
      const response = await productAdminService.getAllProducts(currentPage, 10, keyword);

      if (resetPage) {
        setProducts(response.content);
        setPage(0);
      } else {
        setProducts((prev) => [...prev, ...response.content]);
      }

      setHasMore(response.currentPage < response.totalPages - 1);
      if (!resetPage) setPage(currentPage + 1);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchProducts(true);
    }, 300);

    return () => clearTimeout(debounce);
  }, [keyword]);

  const toggleExpand = (productId: number) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleAddVariant = (product: Product, variant: ProductVariant) => {
    if (!selectedVariantIds.has(variant.productVariantId!)) {
      onAddVariant(product, variant);
    }
  };

  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fff' }}>
      {/* Search */}
      <div style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#999',
            }}
          />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Selected Variants */}
      {selectedVariants.length > 0 && (
        <div style={{ padding: '12px', borderBottom: '1px solid #e0e0e0', background: '#fafafa' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '8px' }}>
            Đã chọn ({selectedVariants.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {selectedVariants.map((variant) => (
              <div
                key={variant.productVariantId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 8px',
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                <span>{variant.unitName}</span>
                <span style={{ color: '#A57322' }}>{formatCurrency(variant.price)}</span>
                <button
                  onClick={() => onRemoveVariant(variant.productVariantId!)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: '#999',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product List */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {loading && products.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#999' }}>Đang tải...</div>
        ) : products.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#999' }}>
            {keyword ? 'Không tìm thấy sản phẩm' : 'Nhập từ khóa để tìm sản phẩm'}
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
              {/* Product Header */}
              <div
                style={{
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
                onClick={() => toggleExpand(product.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  {product.images && product.images.length > 0 && (
                    <img
                      src={product.images[0].productImageUrl}
                      alt={product.name}
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {product.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {product.variants?.length || 0} variant(s) • Từ {formatCurrency(product.minPrice)}
                    </div>
                  </div>
                </div>
                {expandedProducts.has(product.id) ? <ChevronUp size={18} color="#999" /> : <ChevronDown size={18} color="#999" />}
              </div>

              {/* Variants */}
              {expandedProducts.has(product.id) && product.variants && (
                <div style={{ padding: '0 12px 12px 64px' }}>
                  {product.variants.map((variant) => {
                    const isSelected = selectedVariantIds.has(variant.productVariantId!);
                    return (
                      <div
                        key={variant.productVariantId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px',
                          marginBottom: '4px',
                          background: isSelected ? '#f5f5f5' : '#fafafa',
                          borderRadius: '4px',
                          border: isSelected ? '1px solid #A57322' : '1px solid transparent',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px' }}>{variant.unitName}</div>
                          <div style={{ fontSize: '12px', color: '#A57322' }}>{formatCurrency(variant.price)}</div>
                        </div>
                        {!isSelected && (
                          <button
                            onClick={() => handleAddVariant(product, variant)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 12px',
                              background: '#A57322',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            <Plus size={14} />
                            Thêm
                          </button>
                        )}
                        {isSelected && (
                          <span style={{ fontSize: '12px', color: '#2e7d32', fontWeight: 500 }}>Đã thêm</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}

        {/* Load More */}
        {hasMore && (
          <div style={{ padding: '12px', textAlign: 'center' }}>
            <button
              onClick={() => searchProducts(false)}
              disabled={loading}
              style={{
                padding: '8px 24px',
                background: '#f5f5f5',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '13px',
              }}
            >
              {loading ? 'Đang tải...' : 'Xem thêm'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
