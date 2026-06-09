// src/components/product/ProductCard.tsx
'use client';
import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ProductSummary } from '@/types/catalog.type';
import { ProductVariant } from '@/types/productdetail.type';
import { ProductDetailService } from '@/services/productdetail.service';
import { CartService } from '@/services/cart.service';

interface ProductCardProps {
  product: ProductSummary;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();

  // === State ===
  const [isHovered, setIsHovered] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const hasFetched = useRef(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Format tiền tệ VNĐ
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Render số sao (max 5)
  const renderStars = (rate: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <svg
        key={index}
        className={`w-4 h-4 ${index < rate ? 'text-[#849F30]' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  // === Hover handlers ===
  const handleMouseEnter = useCallback(() => {
    // Debounce hover - chỉ show panel khi hover 200ms
    hoverTimeoutRef.current = setTimeout(async () => {
      setIsHovered(true);
      if (!hasFetched.current) {
        hasFetched.current = true;
        setIsLoadingVariants(true);
        try {
          const detail = await ProductDetailService.getProductDetail(product.id);
          setVariants(detail.variants);
          // Tự động chọn variant đầu tiên
          if (detail.variants.length > 0) {
            setSelectedVariant(detail.variants[0]);
          }
        } catch (err) {
          console.error('[ProductCard] Failed to fetch product variants:', err);
          hasFetched.current = false; // retry on next hover
        } finally {
          setIsLoadingVariants(false);
        }
      }
    }, 200);
  }, [product.id]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(false);
    setAddedSuccess(false);
  }, []);

  // === Cart handler ===
  const handleAddToCart = useCallback(async () => {
    if (!selectedVariant) return;
    setIsAddingToCart(true);
    try {
      await CartService.addToCart({
        productVariantId: selectedVariant.id,
        quantity,
      });
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    } catch (err) {
      console.error('[ProductCard] Failed to add to cart:', err);
      alert('Không thể thêm vào giỏ hàng. Vui lòng thử lại.');
    } finally {
      setIsAddingToCart(false);
    }
  }, [selectedVariant, quantity]);

  // === Quantity handlers ===
  const maxQty = selectedVariant?.stockQuantity ?? 99;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Prevent routing if a button or its children are clicked
    if (target.closest('button')) return;
    router.push(`/san-pham/${product.id}`);
  };

  return (
    <div
      className="flex flex-col bg-[#FCFAF5] shadow-sm hover:shadow-lg transition-shadow duration-300 relative overflow-hidden cursor-pointer group"
      style={{ width: '254px', height: '391.9px' }}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Product Image */}
      <div
        className="relative w-full flex-shrink-0 bg-[#F9F9F9]"
        style={{ height: '195px' }}
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col flex-1 p-3">
        <h3 className="text-xl font-medium text-[#194A33] mb-1 truncate">{product.name}</h3>

        <div className="flex items-center mb-2 gap-2">
          <div className="flex">{renderStars(product.rate || 5)}</div>
          <span className="text-sm font-medium text-[#194A33]">{product.rate ? product.rate.toFixed(1) : '5.0'}</span>
        </div>

        <div className="flex items-center justify-between mb-1">
          <div className="flex items-baseline gap-2">
            {product.finalPrice != null && product.finalPrice < product.price ? (
              <>
                <span className="text-xl font-semibold text-[#c62828]">
                  {formatPrice(product.finalPrice)}
                </span>
                <span className="text-sm text-[#9e9e9e] line-through">
                  {formatPrice(product.originalPrice || product.price)}
                </span>
              </>
            ) : (
              <span className="text-xl font-semibold text-[#194A33]">
                {formatPrice(selectedVariant ? (selectedVariant.finalPrice || selectedVariant.price) : product.price)}
              </span>
            )}
          </div>
          <button className="text-[#194A33] hover:text-[#849F30] transition-colors">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between mt-auto mb-3">
          <div className="flex gap-2 items-center text-sm">
            {product.discountAmount && product.discountAmount > 0 && (
              <span className="bg-[#c62828] text-white px-2 py-0.5 rounded text-xs font-medium">
                -{product.discountType === 'PERCENTAGE' ? `${product.discountValue}%` : formatPrice(product.discountAmount)}
              </span>
            )}
          </div>
          <span className="text-sm text-[#194A33] ml-auto">
            Đã bán {product.soldQuantity >= 1000 ? (product.soldQuantity / 1000).toFixed(1).replace('.0', '') + 'k' : product.soldQuantity}
          </span>
        </div>

        {/* Actions - Nút Thêm vào giỏ hàng */}
        <button
          className="w-full border border-[#194A33] text-[#194A33] py-2 hover:bg-[#A57322] hover:text-white transition-colors tracking-wide font-medium"
        >
          Thêm vào giỏ hàng
        </button>
      </div>

      {/* ===== HOVER OVERLAY - Variant Selection Panel ===== */}
      <div
        className={`
          absolute bottom-0 left-0 right-0 
          bg-[#A57322]
          backdrop-blur-sm
          transition-all duration-300 ease-out
          flex flex-col
          ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
        style={{ height: '215px' }}
      >
        {/* Header */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <span className="text-white font-semibold text-sm tracking-wide">
            Chọn phân loại
          </span>
          <span className="text-[#ffffff] text-xs">
            {variants.length > 0 ? `${variants.length} loại` : ''}
          </span>
        </div>

        {/* Variant Chips */}
        <div className="px-4 pb-2 flex flex-wrap gap-1.5 overflow-y-auto" style={{ maxHeight: '72px' }}>
          {isLoadingVariants ? (
            <div className="flex items-center gap-2 text-white/70 text-xs py-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Đang tải...
            </div>
          ) : variants.length === 0 ? (
            <span className="text-white/50 text-xs py-2">Không có phân loại</span>
          ) : (
            variants.map((v) => {
              const isSelected = selectedVariant?.id === v.id;
              const isOutOfStock = v.stockQuantity <= 0;
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    if (!isOutOfStock) {
                      setSelectedVariant(v);
                      setQuantity(1); // Reset quantity khi đổi variant
                    }
                  }}
                  disabled={isOutOfStock}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium
                    transition-all duration-200 border
                    ${isOutOfStock
                      ? 'border-white/20 text-white/30 cursor-not-allowed line-through'
                      : isSelected
                        ? 'border-[#f5a733] bg-[#849F30]/20 text-[#ffffff] shadow-sm shadow-[#849F30]/30'
                        : 'border-white/30 text-white/80 hover:border-white/60 hover:bg-white/10'
                    }
                  `}
                >
                  {v.unitName}
                </button>
              );
            })
          )}
        </div>

        {/* Price Display (changes with variant) */}
        {selectedVariant && (
          <div className="px-4 pb-1">
            {selectedVariant.discountAmount && selectedVariant.discountAmount > 0 ? (
              <div className="flex items-baseline gap-2">
                <span className="text-white font-bold text-base">
                  {formatPrice(selectedVariant.finalPrice || selectedVariant.price)}
                </span>
                <span className="text-white/60 text-xs line-through">
                  {formatPrice(selectedVariant.originalPrice || selectedVariant.price)}
                </span>
                <span className="bg-white text-[#c62828] text-xs px-1.5 py-0.5 rounded font-semibold">
                  -{selectedVariant.discountType === 'PERCENTAGE' ? `${selectedVariant.discountValue}%` : formatPrice(selectedVariant.discountAmount)}
                </span>
              </div>
            ) : (
              <span className="text-white font-bold text-base">
                {formatPrice(selectedVariant.price)}
              </span>
            )}
            {selectedVariant.stockQuantity <= 5 && selectedVariant.stockQuantity > 0 && (
              <span className="text-white text-xs ml-2">
                Còn {selectedVariant.stockQuantity} sản phẩm
              </span>
            )}
          </div>
        )}

        {/* Quantity Selector */}
        <div className="px-4 pb-2 flex items-center gap-3">
          <span className="text-white/70 text-xs">Số lượng:</span>
          <div className="flex items-center bg-white/10 rounded-full border border-white/20">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-7 h-7 flex items-center justify-center text-white/80 hover:text-white disabled:text-white/30 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 12h14" />
              </svg>
            </button>
            <span className="w-8 text-center text-white font-semibold text-sm">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              disabled={quantity >= maxQty}
              className="w-7 h-7 flex items-center justify-center text-white/80 hover:text-white disabled:text-white/30 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        </div>

        {/* Add to Cart Button */}
        <div className="px-4 pb-3 mt-auto">
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant || isAddingToCart || (selectedVariant?.stockQuantity ?? 0) <= 0}
            className={`
              w-full py-2 rounded-lg text-sm font-bold tracking-wider
              transition-all duration-200
              flex items-center justify-center gap-2
              ${addedSuccess
                ? 'bg-[#fffdee] text-white'
                : 'bg-[#fdffeb] text-[#5e5719] hover:bg-[#bec49b] hover:shadow-md hover:shadow-[#C5E03E]/20 active:scale-[0.97]'
              }
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none
            `}
          >
            {isAddingToCart ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang thêm...
              </>
            ) : addedSuccess ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Đã thêm!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                THÊM VÀO GIỎ
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}