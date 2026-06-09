"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Edit3, Filter, Search } from 'lucide-react';
import { Product } from '@/types/product.type';
import { productAdminService } from '@/services/product.service';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productAdminService.getAllProducts(page, 10, searchKeyword);
      setProducts(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Lỗi khi tải danh sách sản phẩm:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, searchKeyword]);

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xoá sản phẩm này? Thao tác này sẽ xoá luôn ảnh trên Cloudinary.')) {
      try {
        await productAdminService.deleteProduct(id);
        fetchProducts();
      } catch (error) {
        alert('Có lỗi xảy ra khi xoá sản phẩm');
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setSearchKeyword(keyword);
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#333', margin: 0 }}>Sản phẩm</h1>
        <Link
          href="/san-pham/tao"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#A57322', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: 600 }}
        >
          <Plus size={18} />
          Thêm sản phẩm
        </Link>
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flex: 1, maxWidth: '450px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '12px', top: '11px' }}>
            <Search size={16} color="#777" />
          </div>
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Tìm kiếm sản phẩm theo tên, sku, tag..."
            style={{ width: '100%', padding: '10px 16px 10px 36px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
          />
          <button type="submit" style={{ display: 'none' }}></button>
        </form>
        <button style={{ padding: '10px 16px', border: '1px solid #ddd', borderRadius: '6px', background: '#fff', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} />
          Lọc
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Đang tải dữ liệu...</div>
        ) : products.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666', borderTop: '1px solid #f0f0f0' }}>Không có sản phẩm nào.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #eee' }}>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#666' }}>Hình ảnh</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#666' }}>Tên sản phẩm</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#666' }}>Danh mục</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#666' }}>Giá thấp nhất</th>
                <th style={{ textAlign: 'center', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#666' }}>Tồn kho</th>
                <th style={{ textAlign: 'center', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#666' }}>Đã bán</th>
                <th style={{ textAlign: 'center', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#666' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const defaultImg = product.images?.find(img => img.isDefault) || product.images?.[0];
                const totalStock = product.variants?.reduce((sum, v) => sum + (v.stockQuantity || 0), 0) || 0;
                return (
                  <tr key={product.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '16px' }}>
                      {defaultImg ? (
                        <div style={{ width: '40px', height: '40px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={defaultImg.productImageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div style={{ width: '40px', height: '40px', background: '#A57322', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}>
                          {product.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600, color: '#333', fontSize: '14px' }}>{product.name}</div>
                      <div style={{ fontSize: '14px', color: '#666', marginTop: '2px' }}>{product.sku}</div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>{product.categoryName}</td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#A57322' }}>
                      {product.minPrice ? product.minPrice.toLocaleString('vi-VN') + ' đ' : 'Chưa có giá'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', textAlign: 'center', color: '#333' }}>{totalStock}</td>
                    <td style={{ padding: '16px', fontSize: '14px', textAlign: 'center', color: '#333' }}>{product.soldQuantity}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <Link href={`/san-pham/${product.id}/sua`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A57322' }} title="Sửa sản phẩm">
                          <Edit3 size={18} />
                        </Link>
                        <button onClick={() => handleDelete(product.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f' }} title="Xóa sản phẩm">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Phân trang */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderTop: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Trang {page + 1} / {totalPages}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                style={{ padding: '8px 12px', background: '#fff', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', color: '#666', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.5 : 1 }}
              >
                Trước
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', fontSize: '14px', fontWeight: 500, border: i === page ? '1px solid #A57322' : '1px solid #ddd', background: i === page ? '#A57322' : '#fff', color: i === page ? '#fff' : '#666', cursor: 'pointer' }}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={page === totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                style={{ padding: '8px 12px', background: '#fff', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', color: '#666', cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page === totalPages - 1 ? 0.5 : 1 }}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
