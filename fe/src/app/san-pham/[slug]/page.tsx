import React from 'react';
import { ProductDetailService } from '@/services/productdetail.service';
import { CatalogService } from '@/services/catalog.service';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';
import { ProductSummary } from '@/types/catalog.type';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const product = await ProductDetailService.getProductDetail(slug);
    return {
      title: `${product.name} | Oriental Herbs`,
      description: product.description.substring(0, 160),
    };
  } catch (error) {
    return {
      title: 'Sản phẩm không tồn tại',
    };
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const product = await ProductDetailService.getProductDetail(slug);

    // Fetch related products based on first tag or categoryName
    const searchKeyword = product.tags && product.tags.length > 0
      ? product.tags[0]
      : product.categoryName;

    let relatedProducts: ProductSummary[] = [];
    try {
      const response = await CatalogService.getProducts({
        keyword: searchKeyword,
        size: 5
      });
      // Filter out the current product from related products
      relatedProducts = response.content.filter(p => p.id !== product.id).slice(0, 3);
    } catch (e) {
      console.error("Failed to fetch related products", e);
    }

    return (
      <main className="bg-[#FCFAF5] min-h-screen">
        <ProductDetailClient product={product} relatedProducts={relatedProducts} />
      </main>
    );
  } catch (error) {
    console.error("Failed to fetch product:", error);
    notFound();
  }
}
