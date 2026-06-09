'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Category } from '@/types/catalog/category.type';
import { CategoryService } from '@/services/category.service';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryListProps {
  activeCategoryId?: number;
  onSelectCategory?: (categoryId: number | undefined) => void;
}

export default function CategoryList({ activeCategoryId, onSelectCategory }: CategoryListProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await CategoryService.getAllCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="my-16 py-8 flex justify-center items-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#A57322] border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="my-16 relative">
      {/* Header section matching design */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 relative">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-8 bg-[#A57322] rounded-sm"></div>
            <span className="text-[#A57322] font-semibold text-lg">Categories</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-[#111111]">Danh mục sản phẩm</h2>
        </div>
        
        {/* Navigation Arrows */}
        <div className="flex gap-4 mt-4 md:mt-0">
          <button 
            onClick={scrollLeft}
            className="w-12 h-12 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors border border-gray-100"
            aria-label="Previous categories"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <button 
            onClick={scrollRight}
            className="w-12 h-12 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors border border-gray-100"
            aria-label="Next categories"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Categories Cards */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}} />
        
        {/* "Tất cả" Card */}
        <div
          onClick={() => onSelectCategory?.(undefined)}
          className={`flex-shrink-0 flex flex-col items-center justify-center w-[179px] h-[145px] border rounded-md cursor-pointer transition-all duration-300 group snap-start
            ${!activeCategoryId
              ? 'bg-[#A57322] border-[#A57322] text-white shadow-md'
              : 'bg-white border-gray-200 text-gray-800 hover:bg-[#A57322] hover:border-[#A57322] hover:text-white hover:shadow-md'
            }
          `}
        >
          <span className="font-medium text-center px-2 line-clamp-2">
            Tất cả
          </span>
        </div>

        {/* Dynamic Category Cards */}
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => onSelectCategory?.(cat.id)}
            className={`flex-shrink-0 flex flex-col items-center justify-center w-[179px] h-[145px] border rounded-md cursor-pointer transition-all duration-300 group snap-start
              ${activeCategoryId === cat.id
                ? 'bg-[#A57322] border-[#A57322] text-white shadow-md'
                : 'bg-white border-gray-200 text-gray-800 hover:bg-[#A57322] hover:border-[#A57322] hover:text-white hover:shadow-md'
              }
            `}
          >
            <span className="font-medium text-center px-4 leading-snug line-clamp-2">
              {cat.name}
            </span>
          </div>
        ))}

        {/* Fallback to mock categories if API array is empty for design showcase purposes */}
        {!loading && categories.length === 0 && [
          { id: 1, name: 'Hệ tiêu hóa' },
          { id: 2, name: 'Hệ hô hấp' },
          { id: 3, name: 'Xương khớp & Tê thấp' },
          { id: 4, name: 'Thanh nhiệt & Giải độc' },
          { id: 5, name: 'Bồi bổ & Tăng cường' },
          { id: 6, name: 'Phụ khoa & Nam khoa' }
        ].map(cat => (
          <div
            key={`mock-${cat.id}`}
            onClick={() => onSelectCategory?.(cat.id)}
            className={`flex-shrink-0 flex flex-col items-center justify-center w-[179px] h-[145px] border rounded-md cursor-pointer transition-all duration-300 group snap-start
              ${activeCategoryId === cat.id
                ? 'bg-[#A57322] border-[#A57322] text-white shadow-md'
                : 'bg-white border-gray-200 text-gray-800 hover:bg-[#A57322] hover:border-[#A57322] hover:text-white hover:shadow-md'
              }
            `}
          >
            <span className="font-medium text-center px-3 leading-snug break-words" dangerouslySetInnerHTML={{__html: cat.name.replace(' & ', '<br/>& ')}}>
            </span>
          </div>
        ))}

      </div>
    </div>
  );
}