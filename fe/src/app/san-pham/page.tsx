'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Breadcrumb from '@/components/common/Breadcrumb';
import CategoryList from '@/components/product/CategoryList';
import ProductCard from '@/components/product/ProductCard';
import { CatalogService } from '@/services/catalog.service';
import { SiteConfigService } from '@/services/siteConfig.service';
import { ProductSummary, GetProductsParams } from '@/types/catalog.type';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 12; // 4 cols × 3 rows

type SortBy = GetProductsParams['sortBy'];
type SortDir = GetProductsParams['sortDir'];

const SORT_OPTIONS: { label: string; value: SortBy }[] = [
  { label: 'Giá', value: 'price' },
  { label: 'Tên', value: 'name' },
  { label: 'Lượt bán', value: 'soldquantity' },
  { label: 'Đánh giá', value: 'rate' },
];

// ─── Breadcrumb items ─────────────────────────────────────────────────────────
const BREADCRUMB_ITEMS = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Danh mục' },
];

// ─── Pagination Component ─────────────────────────────────────────────────────
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  // Compute page number range to show (max 5)
  const getPages = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <nav
      aria-label="Phân trang"
      className="flex items-center justify-center gap-1 mt-10 mb-6"
    >
      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Trang trước"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Pages */}
      {getPages().map((page, idx) =>
        page === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 select-none">
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            aria-current={page === currentPage ? 'page' : undefined}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors border
              ${page === currentPage
                ? 'bg-[#A57322] text-white border-[#A57322] shadow-sm'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Trang sau"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="flex flex-col bg-[#FCFAF5] border border-[#194A33]/20 overflow-hidden animate-pulse"
      style={{ width: '254px', height: '391.9px' }}>
      <div className="w-full flex-shrink-0 bg-gray-200" style={{ height: '195px' }} />
      <div className="flex flex-col flex-1 p-3 gap-3">
        <div className="h-5 bg-gray-200 rounded w-4/5" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-5 bg-gray-200 rounded w-2/5" />
        <div className="mt-auto h-9 bg-gray-200 rounded w-full" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function SanPhamContent() {
  const searchParams = useSearchParams();
  const keyword = searchParams.get('keyword') || undefined;
  const categoryParam = searchParams.get('category');

  const [categoryId, setCategoryId] = useState<number | undefined>(
    categoryParam && !isNaN(Number(categoryParam)) ? Number(categoryParam) : undefined
  );
  const [sortBy, setSortBy] = useState<SortBy>('soldquantity');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1); // 1-based UI
  const [productsPerRow, setProductsPerRow] = useState(4);

  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch site config for grid settings
  useEffect(() => {
    const fetchConfig = async () => {
      const configs = await SiteConfigService.getAllConfigs();
      const perRow = parseInt(configs.products_per_row || '4', 10);
      if ([3, 4, 5].includes(perRow)) {
        setProductsPerRow(perRow);
      }
    };
    fetchConfig();
  }, []);

  // Fetch products whenever filters change
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await CatalogService.getProducts({
        categoryId,
        keyword,
        page: page - 1, // BE is 0-based
        size: PAGE_SIZE,
        sortBy,
        sortDir,
      });
      setProducts(response.content);
      setTotalPages(response.totalPages || 1);
      setTotalElements(response.totalElements);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId, keyword, page, sortBy, sortDir]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset to page 1 when filters change
  const handleCategoryChange = (id: number | undefined) => {
    setCategoryId(id);
    setPage(1);
  };

  const handleSortBy = (value: SortBy) => {
    setSortBy(value);
    setPage(1);
  };

  const toggleSortDir = () => {
    setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    setPage(1);
  };

  return (
    <main className="min-h-screen bg-[#F8F4EC]">
      {/* Breadcrumb */}
      <Breadcrumb items={BREADCRUMB_ITEMS} />

      {/* Content wrapper */}
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">

        {keyword && (
          <div className="mb-6 text-xl text-gray-800">
            Kết quả tìm kiếm cho: <span className="font-semibold text-[#A57322]">"{keyword}"</span>
          </div>
        )}

        {/* Category List */}
        <CategoryList
          activeCategoryId={categoryId}
          onSelectCategory={handleCategoryChange}
        />

        {/* ── Sort / Filter Bar ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 mb-6 border-y border-[#194A33]/10">
          {/* Left: sort-by pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500 mr-1 shrink-0">Sắp xếp theo:</span>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSortBy(opt.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all
                  ${sortBy === opt.value
                    ? 'bg-[#A57322] text-white border-[#A57322] shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-[#A57322] hover:text-[#A57322]'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Right: direction toggle + result count */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">
              {totalElements > 0 ? `${totalElements} sản phẩm` : ''}
            </span>
            <button
              onClick={toggleSortDir}
              title={sortDir === 'asc' ? 'Tăng dần' : 'Giảm dần'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-[#A57322] hover:text-[#A57322] transition-all text-sm font-medium"
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortDir === 'asc' ? 'Tăng dần' : 'Giảm dần'}
            </button>
          </div>
        </div>

        {/* ── Product Grid ──────────────────────────────────────────────── */}
        {loading ? (
          <div className={`grid gap-5 justify-items-center`} style={{ gridTemplateColumns: `repeat(${productsPerRow}, minmax(0, 1fr))` }}>
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
            </svg>
            <p className="text-lg font-medium">Không tìm thấy sản phẩm</p>
            <p className="text-sm mt-1">Thử chọn danh mục khác hoặc thay đổi bộ lọc</p>
          </div>
        ) : (
          <div className={`grid gap-5 sm:gap-6 lg:gap-8 justify-items-center`} style={{ gridTemplateColumns: `repeat(${productsPerRow}, minmax(0, 1fr))` }}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* ── Pagination ────────────────────────────────────────────────── */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </main>
  );
}

export default function SanPhamPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F4EC] p-10 text-center text-gray-500">Đang tải dữ liệu...</div>}>
      <SanPhamContent />
    </Suspense>
  );
}
