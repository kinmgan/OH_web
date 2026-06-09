'use client';

import React, { useRef, useState, useEffect } from 'react';
import { HomepageSectionResponse } from '@/types/homepageSection.type';
import ProductCard from '@/components/product/ProductCard';
import './HomepageSectionRenderer.css';

interface HomepageSectionRendererProps {
  sections: HomepageSectionResponse[];
}

const TYPE_SUBTITLE: Record<string, string> = {
  CATEGORY: 'Theo danh mục',
  TOP_SALES: 'Sản phẩm bán chạy nhất',
  TOP_RATED: 'Được đánh giá cao nhất',
  NEW_ARRIVALS: 'Sản phẩm mới nhất',
};

export default function HomepageSectionRenderer({ sections }: HomepageSectionRendererProps) {
  if (!sections || sections.length === 0) return null;

  return (
    <div className="homepage-sections-wrapper">
      {sections.map((section) => (
        <HomepageSectionItem key={section.id} section={section} />
      ))}
    </div>
  );
}

function HomepageSectionItem({ section }: { section: HomepageSectionResponse }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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
  }, [section]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 280;
      const newScrollLeft = scrollContainerRef.current.scrollLeft +
        (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  if (!section.products || section.products.length === 0) return null;

  return (
    <section className="homepage-section-item">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 w-full">
      {/* Section Header */}
      <div className="homepage-section-header">
        <div className="homepage-section-decoration">&#10022;</div>
        <div className="homepage-section-title-group">
          <h2 className="homepage-section-title">{section.title}</h2>
          <span className="homepage-section-subtitle">{TYPE_SUBTITLE[section.type]}</span>
        </div>
        <div className="homepage-section-decoration">&#10022;</div>
      </div>

      {/* Products Scroll Container */}
      <div className="homepage-section-products-wrapper">
        {canScrollLeft && (
          <button
            className="homepage-section-scroll-btn homepage-section-scroll-left"
            onClick={() => scroll('left')}
            aria-label="Cuộn sang trái"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div className="homepage-section-products-scroll" ref={scrollContainerRef}>
          {section.products.map((product) => (
            <div key={product.id} className="homepage-section-product-card">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {canScrollRight && (
          <button
            className="homepage-section-scroll-btn homepage-section-scroll-right"
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
