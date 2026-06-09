// src/components/home/CampaignSection.tsx
'use client';
import React, { useRef, useState, useEffect } from 'react';
import { WebCampaign, CampaignProductItem } from '@/types/campaign.type';
import { ProductSummary } from '@/types/catalog.type';
import ProductCard from '@/components/product/ProductCard';
import './CampaignSection.css';

interface CampaignSectionProps {
  campaign: WebCampaign;
}

export default function CampaignSection({ campaign }: CampaignSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Update scroll buttons visibility
  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      window.addEventListener('resize', updateScrollButtons);
      return () => {
        container.removeEventListener('scroll', updateScrollButtons);
        window.removeEventListener('resize', updateScrollButtons);
      };
    }
  }, [campaign]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 280; // Approximate card width + gap
      const newScrollLeft = scrollContainerRef.current.scrollLeft +
        (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Convert CampaignProductItem to ProductSummary for ProductCard
  const mapToProductSummary = (item: CampaignProductItem): ProductSummary => {
    return {
      id: item.productId,
      name: item.productName,
      price: item.originalPrice,
      originalPrice: item.originalPrice,
      finalPrice: item.finalPrice,
      discountAmount: item.discountAmount,
      discountType: item.discountType,
      discountValue: item.discountValue,
      campaignId: campaign.id,
      campaignName: campaign.name,
      rate: 0,
      soldQuantity: 0,
      imageUrl: item.imageUrl,
    };
  };

  // Group items by productId (taking the one with lowest price) and sort by displayOrder
  const groupedItems = Array.from(
    [...campaign.items]
      .reduce((map, item) => {
        const existing = map.get(item.productId);
        const itemPrice = item.finalPrice ?? item.originalPrice;
        const existingPrice = existing ? (existing.finalPrice ?? existing.originalPrice) : Infinity;
        
        if (!existing || itemPrice < existingPrice) {
          map.set(item.productId, item);
        }
        return map;
      }, new Map<number, CampaignProductItem>())
      .values()
  ).sort((a, b) => a.displayOrder - b.displayOrder);
  return (
    <section className="campaign-section">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 w-full">
      {/* Campaign Header */}
      <div className="campaign-header">
        <div className="campaign-decoration">&#10022;</div>
        <h2 className="campaign-title">{campaign.name}</h2>
        <div className="campaign-decoration">&#10022;</div>
      </div>

      {/* Campaign Description */}
      {campaign.description && (
        <p className="campaign-description">{campaign.description}</p>
      )}

      {/* Product Scroll Container */}
      <div className="campaign-products-wrapper">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            className="campaign-scroll-btn campaign-scroll-left"
            onClick={() => scroll('left')}
            aria-label="Cuộn sang trái"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Product Cards */}
        <div className="campaign-products-scroll" ref={scrollContainerRef}>
          {groupedItems.map((item) => (
            <div key={item.id} className="campaign-product-card">
              <ProductCard product={mapToProductSummary(item)} />
            </div>
          ))}
        </div>

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            className="campaign-scroll-btn campaign-scroll-right"
            onClick={() => scroll('right')}
            aria-label="Cuộn sang phải"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
      </div>
    </section>
  );
}
