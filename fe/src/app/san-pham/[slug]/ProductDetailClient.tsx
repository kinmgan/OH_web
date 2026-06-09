'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductDetail, ProductVariant, ProductReview } from '@/types/productdetail.type';
import { ProductSummary } from '@/types/catalog.type';
import { ReviewEligibility, ReviewableOrderItem, CreateReviewPayload } from '@/types/review.type';
import { CartService } from '@/services/cart.service';
import { reviewService } from '@/services/review.service';
import Breadcrumb from '@/components/common/Breadcrumb';
import QuantityInput from '@/components/common/QuantityInput';
import ProductCard from '@/components/product/ProductCard';

interface Props {
  product: ProductDetail;
  relatedProducts: ProductSummary[];
}

interface ReviewSectionProps {
  product: ProductDetail;
}

function ReviewSectionInner({ product, reviewSectionRef }: ReviewSectionProps & { reviewSectionRef: React.RefObject<HTMLDivElement | null> }) {
  const [reviews, setReviews] = useState<ProductReview[]>(product.reviews || []);
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [selectedOrderItem, setSelectedOrderItem] = useState<ReviewableOrderItem | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<{ url: string; public_id: string }[]>([]);
  const [localPreviews, setLocalPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const loadEligibility = async () => {
      try {
        const elig = await reviewService.getEligibility(product.id);
        setEligibility(elig);

        if (elig.canReview && elig.reviewableItems.length > 0) {
          const urlParams = new URLSearchParams(window.location.search);
          const reviewOrderItemId = urlParams.get('reviewOrderItemId');
          if (reviewOrderItemId) {
            const item = elig.reviewableItems.find(
              (i) => i.orderItemId === parseInt(reviewOrderItemId)
            );
            if (item) {
              setSelectedOrderItem(item);
              setTimeout(() => {
                reviewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }
          } else {
            setSelectedOrderItem(elig.reviewableItems[0]);
          }
        }
      } catch (error) {
        console.error('Failed to load eligibility:', error);
        setEligibility({ canReview: false, reviewableItems: [] });
      }
    };

    const fetchLatestReviews = async () => {
      try {
        const latestReviews = await reviewService.getProductReviews(product.id);
        setReviews(latestReviews);
      } catch (error) {
        console.error('Failed to load latest reviews:', error);
      }
    };

    loadEligibility();
    fetchLatestReviews();
  }, [product.id]);

  const renderStars = (rate: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <svg
        key={index}
        className={`w-5 h-5 ${index < rate ? 'text-[#849F30]' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remainingSlots = 5 - selectedFiles.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);
    setSelectedFiles((prev) => [...prev, ...filesToAdd]);
    
    const newPreviews = filesToAdd.map(file => URL.createObjectURL(file));
    setLocalPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setLocalPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadImages = async () => {
    if (selectedFiles.length === 0) return [];
    setIsUploading(true);
    try {
      const filesToUpload = selectedFiles.slice(uploadedImages.length);
      const uploadPromises = filesToUpload.map(file => reviewService.uploadReviewImage(file));
      const newUploads = await Promise.all(uploadPromises);
      
      const allImages = [...uploadedImages, ...newUploads];
      setUploadedImages(allImages);
      return allImages;
    } catch (error) {
      console.error('Failed to upload images:', error);
      alert('Tải ảnh thất bại. Vui lòng thử lại.');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedOrderItem || rating === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let finalImages = uploadedImages;
      if (selectedFiles.length > uploadedImages.length) {
        finalImages = await handleUploadImages() || [];
      }

      const payload: CreateReviewPayload = {
        orderItemId: selectedOrderItem.orderItemId,
        productId: product.id,
        rating,
        comment: comment || undefined,
        images: finalImages.length > 0 ? finalImages.map((img, idx) => ({
          imageUrl: img.url,
          imagePublicId: img.public_id,
          displayOrder: idx,
        })) : undefined,
      };

      const newReview = await reviewService.createReview(payload);
      setReviews((prev) => [newReview, ...prev]);
      setRating(0);
      setComment('');
      setSelectedFiles([]);
      setUploadedImages([]);
      setLocalPreviews([]);
      setSelectedOrderItem(null);
      setSubmitSuccess(true);

      const newEligibility = await reviewService.getEligibility(product.id);
      setEligibility(newEligibility);

      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error: any) {
      console.error('Failed to submit review:', error);
      setSubmitError(error.message || 'Gửi đánh giá thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = selectedOrderItem && rating > 0 && !isSubmitting && !isUploading;

  return (
    <div ref={reviewSectionRef} id="reviews">
      <h2 className="text-2xl font-serif text-[#4D4D4D] mb-6 pb-2 border-b border-gray-200">Đánh giá</h2>

      {eligibility?.canReview && eligibility.reviewableItems.length > 0 && (
        <div className="mb-8 p-6 bg-[#FDFBF7] border border-[#C1A87D] rounded-lg">
          <h3 className="text-lg font-semibold text-[#4D4D4D] mb-4">Viết đánh giá của bạn</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sản phẩm cần đánh giá:
            </label>
            <select
              value={selectedOrderItem?.orderItemId || ''}
              onChange={(e) => {
                const item = eligibility.reviewableItems.find(
                  (i) => i.orderItemId === parseInt(e.target.value)
                );
                setSelectedOrderItem(item || null);
              }}
              className="w-full p-2 border border-gray-300 rounded focus:ring-[#A57322] focus:border-[#A57322]"
            >
              <option value="">-- Chọn sản phẩm --</option>
              {eligibility.reviewableItems.map((item) => (
                <option key={item.orderItemId} value={item.orderItemId}>
                  {item.productName} - {item.variantInfo} (x{item.quantity})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Đánh giá:</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <svg
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? 'text-[#849F30]'
                        : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhận xét (tùy chọn):
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
              className="w-full p-3 border border-gray-300 rounded focus:ring-[#A57322] focus:border-[#A57322] resize-none"
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {comment.length}/2000
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hình ảnh (tối đa 5 ảnh):
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="relative w-20 h-20 border rounded overflow-hidden">
                  <img src={uploadedImages[idx]?.url || localPreviews[idx]} alt={`Upload ${idx + 1}`} className={`w-full h-full object-cover ${!uploadedImages[idx] && isUploading ? 'opacity-50' : ''}`} />
                  {!uploadedImages[idx] && isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 text-white text-[10px]">
                      Uploading...
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
              {selectedFiles.length < 5 && (
                <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded cursor-pointer flex items-center justify-center hover:border-[#A57322] transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </label>
              )}
            </div>
          </div>

          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded">
              Đánh giá của bạn đã được gửi thành công!
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmitReview}
            disabled={!isFormValid}
            className={`w-full py-3 rounded font-medium transition-colors ${
              isFormValid
                ? 'bg-[#A57322] text-white hover:bg-[#8B6914]'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </div>
      )}

      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="flex gap-4 p-4 bg-white rounded shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center text-lg font-bold text-gray-500 overflow-hidden">
                {review.reviewerName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-[#4D4D4D]">{review.reviewerName}</h4>
                  <span className="text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="flex mb-2">
                  {renderStars(review.rating)}
                </div>
                {review.comment && (
                  <p className="text-[#666] text-sm mb-2">{review.comment}</p>
                )}
                {review.keywords && review.keywords.length > 0 && (
                  <div className="mb-2 flex gap-2">
                    {review.keywords.map(kw => (
                      <span key={kw} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{kw}</span>
                    ))}
                  </div>
                )}
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {review.images.map((img, imgIdx) => (
                      <img
                        key={img.id || imgIdx}
                        src={img.imageUrl}
                        alt={`Review image ${imgIdx + 1}`}
                        className="w-20 h-20 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(img.imageUrl, '_blank')}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 italic">Chưa có đánh giá nào.</p>
      )}
    </div>
  );
}

function ReviewSection(props: ReviewSectionProps) {
  const reviewSectionRef = useRef<HTMLDivElement>(null);
  return <ReviewSectionInner {...props} reviewSectionRef={reviewSectionRef} />;
}

export default function ProductDetailClient({ product, relatedProducts }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants.length > 0 ? product.variants[0] : null
  );
  const [quantity, setQuantity] = useState(1);
  const [mainImageIdx, setMainImageIdx] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const images = product.images.length > 0 ? product.images : [{ id: 0, productImageUrl: '', isDefault: true }];
  const mainImage = images[mainImageIdx];

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    setIsAddingToCart(true);
    try {
      await CartService.addToCart({
        productVariantId: selectedVariant.id,
        quantity,
      });
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Không thể thêm vào giỏ hàng. Vui lòng thử lại.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Danh mục', href: '#' },
          { label: product.categoryName ? product.categoryName.normalize('NFC') : '', href: '#' },
          { label: product.name ? product.name.normalize('NFC') : '' }
        ]}
      />

      <div className="mt-6 flex flex-col md:flex-row gap-8 lg:gap-16">
        <div className="flex-1 md:w-1/2 flex gap-4">
          <div className="w-[80px] flex flex-col gap-3">
            {images.map((img, idx) => (
              <div
                key={img.id || idx}
                onClick={() => setMainImageIdx(idx)}
                className={`w-20 h-20 relative cursor-pointer border-2 rounded ${
                  mainImageIdx === idx ? 'border-[#A57322]' : 'border-transparent hover:border-gray-300'
                }`}
              >
                {img.productImageUrl ? (
                   <Image
                     src={img.productImageUrl}
                     alt={`${product.name} thumb ${idx}`}
                     fill
                     className="object-cover rounded"
                   />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </div>
            ))}
          </div>

          <div className="flex-1 relative aspect-[3/4] rounded-lg overflow-hidden bg-white shadow-sm max-w-md border border-[#eee]">
            {mainImage?.productImageUrl ? (
               <Image
                 src={mainImage.productImageUrl}
                 alt={product.name}
                 fill
                 className="object-cover"
                 priority
               />
            ) : (
              <div className="w-full h-full flex justify-center items-center text-gray-400 bg-gray-100">
                 Không có ảnh
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 md:w-1/2">
          <h1 className="text-[32px] md:text-[40px] font-medium text-[#4D4D4D] font-serif mb-4 leading-tight">
            {product.name ? product.name.normalize('NFC') : ''}
          </h1>

          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 text-[#8a8a8a] text-sm">
            {product.tags && product.tags.map(tag => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>

          <div className="flex items-center gap-4 mb-6 text-sm text-[#4D4D4D]">
            <div className="flex items-center gap-1">
              <StarRatingDisplay rating={product.averageRating || 5} />
              <span className="font-medium ml-1">{product.averageRating ? product.averageRating.toFixed(1) : '5.0'}</span>
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-1 text-[#D32F2F]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span>{product.reviews?.length || 0}</span>
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-1 text-[#E65100]">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
              <span>{product.soldQuantity} lượt mua</span>
            </div>
          </div>

          <div className="mb-4">
            {selectedVariant?.discountAmount && selectedVariant.discountAmount > 0 ? (
              <div className="flex items-baseline gap-3">
                <div className="text-3xl font-medium text-[#c62828]">
                  {formatPrice(selectedVariant.finalPrice || selectedVariant.price)}
                </div>
                <div className="text-lg text-[#9e9e9e] line-through">
                  {formatPrice(selectedVariant.originalPrice || selectedVariant.price)}
                </div>
                <div className="bg-[#c62828] text-white px-3 py-1 rounded text-sm font-semibold">
                  -{selectedVariant.discountType === 'PERCENTAGE' ? `${selectedVariant.discountValue}%` : formatPrice(selectedVariant.discountAmount)}
                </div>
              </div>
            ) : (
              <div className="text-3xl font-medium text-[#4D4D4D]">
                {formatPrice(selectedVariant ? (selectedVariant.finalPrice || selectedVariant.price) : product.variants[0]?.price ?? 0)}
              </div>
            )}
            {selectedVariant?.campaignName && (
              <div className="text-sm text-[#666] mt-1">
                Đang áp dụng: <span className="font-medium text-[#A57322]">{selectedVariant.campaignName}</span>
              </div>
            )}
          </div>

          <div className="mb-6 flex items-center gap-4">
            <span className="text-[#8a8a8a] text-sm hidden">Biến thể</span>
            <div className="flex flex-wrap gap-3">
              {product.variants.map((variant) => {
                 const isSelected = selectedVariant?.id === variant.id;
                 const outOfStock = variant.stockQuantity <= 0;
                 return (
                   <button
                     key={variant.id}
                     disabled={outOfStock}
                     onClick={() => setSelectedVariant(variant)}
                     className={`px-4 py-2 border rounded text-sm transition-colors ${
                       outOfStock 
                        ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed line-through'
                        : isSelected
                          ? 'border-[#C1A87D] bg-[#FDFBF7] text-[#A57322] font-semibold'
                          : 'border-gray-300 text-gray-600 hover:border-[#A57322] bg-white'
                     }`}
                   >
                      {variant.unitName}
                   </button>
                 );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-2">
            <QuantityInput 
              value={quantity} 
              onChange={setQuantity} 
              max={selectedVariant?.stockQuantity || 1} 
            />
            
            <button className="p-3 border border-gray-300 rounded text-gray-500 hover:border-red-500 hover:text-red-500 transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78v0z"/>
              </svg>
            </button>

            <button 
              onClick={handleAddToCart}
              disabled={isAddingToCart || !selectedVariant || selectedVariant.stockQuantity <= 0}
              className={`flex-1 max-w-[200px] border px-6 py-3 font-medium uppercase tracking-wider text-sm transition-colors ${
                addSuccess 
                  ? 'border-green-600 text-green-600 bg-green-50' 
                  : 'border-[#194A33] text-[#194A33] hover:bg-[#194A33] hover:text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isAddingToCart ? 'ĐANG THÊM...' : addSuccess ? 'ĐÃ THÊM' : 'ADD TO CART'}
            </button>
          </div>
          {selectedVariant && selectedVariant.stockQuantity > 0 && selectedVariant.stockQuantity <= 10 && (
             <div className="text-sm text-red-500 mt-2">Chỉ còn {selectedVariant.stockQuantity} sản phẩm.</div>
          )}
        </div>
      </div>

      <div className="mt-20 flex flex-col lg:flex-row gap-12">
         <div className="flex-1 lg:w-2/3">
            <div className="mb-12">
               <h2 className="text-2xl font-serif text-[#4D4D4D] mb-6 pb-2 border-b border-gray-200">Mô tả sản phẩm</h2>
               <div className="text-[#666] leading-relaxed text-sm space-y-4">
                 <strong className="block text-base text-[#4D4D4D]">{product.name}</strong>
                 {product.origin && <p>Địa đạo được tải: {product.origin}</p>}
                 <div 
                   className="whitespace-pre-line prose max-w-none"
                   style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                   dangerouslySetInnerHTML={{ __html: product.description?.replace(/&nbsp;/g, ' ') }}
                 />
               </div>
             </div>

             {product.certificateImages && product.certificateImages.length > 0 && (
               <div className="mb-12">
                 <h2 className="text-2xl font-serif text-[#4D4D4D] mb-6 pb-2 border-b border-gray-200">Giấy chứng nhận sản phẩm</h2>
                 <div className="flex flex-wrap gap-4">
                   {product.certificateImages.map((certUrl, idx) => (
                     <div key={idx} className="relative w-32 h-40 md:w-48 md:h-64 border rounded overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                       <Image
                         src={certUrl}
                         alt={`Giấy chứng nhận ${idx + 1}`}
                         fill
                         className="object-cover"
                         onClick={() => window.open(certUrl, '_blank')}
                       />
                     </div>
                   ))}
                 </div>
               </div>
             )}

             <Suspense fallback={<div className="text-gray-500">Đang tải đánh giá...</div>}>
              <ReviewSection product={product} />
            </Suspense>
         </div>

         <div className="w-full lg:w-1/3 max-w-xs mx-auto lg:mx-0">
            <h2 className="text-2xl font-serif text-[#4D4D4D] mb-6 pb-2 border-b border-gray-200">Sản phẩm liên quan</h2>
            <div className="flex flex-col gap-8">
               {relatedProducts.length > 0 ? (
                 relatedProducts.map(rp => (
                   <ProductCard key={rp.id} product={rp} />
                 ))
               ) : (
                 <p className="text-gray-500 italic text-sm">Không có sản phẩm liên quan.</p>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}

function StarRatingDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          className={`w-5 h-5 ${index < rating ? 'text-[#849F30]' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}
