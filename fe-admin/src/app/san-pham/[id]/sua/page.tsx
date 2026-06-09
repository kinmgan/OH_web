"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProductForm from '@/components/products/ProductForm';
import { Product } from '@/types/product.type';
import { productAdminService } from '@/services/product.service';

export default function EditProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadProduct(Number(id));
    }
  }, [id]);

  const loadProduct = async (productId: number) => {
    try {
      const data = await productAdminService.getProductById(productId);
      setProduct(data);
    } catch (err) {
      setError('Lỗi khi tải thông tin sản phẩm. Hoặc sản phẩm không tồn tại.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen p-12 text-center">Đang tải biểu mẫu...</div>;
  if (error) return <div className="min-h-screen p-12 text-center text-red-500">{error}</div>;

  return (
    <div style={{ padding: '24px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {product && <ProductForm initialData={product} />}
      </div>
    </div>
  );
}
