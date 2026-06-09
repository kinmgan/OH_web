"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductRequest, ProductVariant, ProductImage } from '@/types/product.type';
import { productAdminService } from '@/services/product.service';
import RichTextEditor from './RichTextEditor';
import ImageUploader from './ImageUploader';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';

interface ProductFormProps {
  initialData?: Product;
}

export default function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState(initialData?.name || '');
  const [sku, setSku] = useState(initialData?.sku || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [origin, setOrigin] = useState(initialData?.origin || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || 1);
  const [properties, setProperties] = useState<string[]>(initialData?.properties || []);
  const [flavors, setFlavors] = useState<string[]>(initialData?.flavors || []);
  const [meridians, setMeridians] = useState<string[]>(initialData?.meridians || []);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);

  // Variants State
  const [variants, setVariants] = useState<ProductVariant[]>(
    initialData?.variants?.length ? initialData.variants : [{ unitName: '', price: 0, stockQuantity: 0, weightGram: 0, lengthCm: 0, widthCm: 0, heightCm: 0 }]
  );

  // Images State
  const [existingImages, setExistingImages] = useState<ProductImage[]>(initialData?.images || []);
  const [keepImagePublicIds, setKeepImagePublicIds] = useState<string[]>(
    initialData?.images?.map(img => img.imagePublicId) || []
  );
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  
  const [defaultImageIdentifier, setDefaultImageIdentifier] = useState<string>(
    initialData?.images?.find(img => img.isDefault)?.imagePublicId || ''
  );

  // Certificates State
  const [existingCertificates, setExistingCertificates] = useState<string[]>(initialData?.certificateImages || []);
  const [keepCertificateImages, setKeepCertificateImages] = useState<string[]>(initialData?.certificateImages || []);
  const [newCertificateFiles, setNewCertificateFiles] = useState<File[]>([]);

  const handleAddVariant = () => {
    setVariants([...variants, { unitName: '', price: 0, stockQuantity: 0, weightGram: 0, lengthCm: 0, widthCm: 0, heightCm: 0 }]);
  };

  const handleRemoveVariant = (index: number) => {
    const newV = [...variants];
    newV.splice(index, 1);
    setVariants(newV);
  };

  const handleVariantChange = (index: number, field: keyof ProductVariant, value: any) => {
    const newV = [...variants];
    newV[index] = { ...newV[index], [field]: value };
    setVariants(newV);
  };

  const handleTextInputArray = (setters: any, val: string) => {
    const arr = val.split(',').map(s => s.trim()).filter(s => s);
    setters(arr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!name || !sku) throw new Error('Tên và SKU là bắt buộc');
      if (variants.length === 0) throw new Error('Cần ít nhất 1 phân loại (Biến thể)');

      const calculatedMinPrice = Math.min(...variants.map(v => Number(v.price) || 0));

      const request: ProductRequest = {
        name,
        sku,
        description,
        origin,
        minPrice: calculatedMinPrice,
        categoryId,
        properties,
        flavors,
        meridians,
        tags,
        variants: variants.map(v => ({
          ...v,
          price: Number(v.price) || 0,
          stockQuantity: Number(v.stockQuantity) || 0,
          weightGram: Number(v.weightGram) || 0,
          lengthCm: Number(v.lengthCm) || 0,
          widthCm: Number(v.widthCm) || 0,
          heightCm: Number(v.heightCm) || 0,
        })),
        keepImagePublicIds,
        defaultImageIdentifier,
        keepCertificateImages
      };

      if (initialData?.id) {
        await productAdminService.updateProduct(initialData.id, request, newImageFiles, newCertificateFiles);
      } else {
        await productAdminService.createProduct(request, newImageFiles, newCertificateFiles);
      }

      router.push('/san-pham');
      router.refresh();

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Có lỗi xảy ra khi lưu sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#fff', padding: '32px 48px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '4px', marginBottom: '96px', width: '100%', boxSizing: 'border-box' }}>
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '48px', paddingBottom: '24px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{ color: '#666', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <ArrowLeft size={24} />
            </button>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#A57322', margin: 0 }}>
              {initialData ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h1>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{ background: 'transparent', border: 'none', color: '#333', cursor: 'pointer', fontWeight: 500, fontSize: '15px' }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '12px 32px', background: '#A57322', color: '#fff', borderRadius: '4px', fontWeight: 500, border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
            >
              <Save size={20} />
              {loading ? 'Đang lưu...' : 'Lưu sản phẩm'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: '32px', padding: '16px', background: '#fef2f2', color: '#dc2626', borderRadius: '4px', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '64px', flexWrap: 'wrap' }}>
          <div style={{ flex: '2', display: 'flex', flexDirection: 'column', gap: '48px', minWidth: '60%' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#A57322', marginBottom: '32px', marginTop: 0 }}>Thông tin chung</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: 500, color: '#333', fontSize: '15px' }}>Tên sản phẩm *</label>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '4px', border: 'none', background: '#F9F9F9', color: '#333', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} placeholder="VD: Trà Hoa Liên" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: 500, color: '#333', fontSize: '15px' }}>Mã SKU *</label>
                  <input required type="text" value={sku} onChange={e => setSku(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '4px', border: 'none', background: '#F9F9F9', color: '#333', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} placeholder="VD: TRA001" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: 500, color: '#333', fontSize: '15px' }}>Danh mục *</label>
                  <select value={categoryId} onChange={e => setCategoryId(Number(e.target.value))} style={{ width: '100%', padding: '16px', borderRadius: '4px', border: 'none', background: '#F9F9F9', color: '#333', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}>
                    <option value={1}>Dược liệu khô</option>
                    <option value={2}>Hạt dinh dưỡng</option>
                    <option value={3}>Trà thảo mộc</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: 500, color: '#333', fontSize: '15px' }}>Xuất xứ</label>
                  <input type="text" value={origin} onChange={e => setOrigin(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '4px', border: 'none', background: '#F9F9F9', color: '#333', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} placeholder="VD: Việt Nam" />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500, color: '#333', fontSize: '15px' }}>Mô tả sản phẩm</label>
                <div style={{ background: '#F9F9F9', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                  <RichTextEditor value={description} onChange={setDescription} placeholder="Nhập mô tả chi tiết sản phẩm..." />
                </div>
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#A57322', marginBottom: '32px', marginTop: 0 }}>Hình ảnh sản phẩm</h2>
              <div style={{ background: '#F9F9F9', borderRadius: '4px', padding: '24px', overflow: 'hidden' }}>
                  <ImageUploader
                  existingImages={existingImages}
                  onRemoveExistingImage={(pubId) => {
                      setExistingImages(prev => prev.filter(img => img.imagePublicId !== pubId));
                      setKeepImagePublicIds(prev => prev.filter(id => id !== pubId));
                      if (defaultImageIdentifier === pubId) setDefaultImageIdentifier('');
                  }}
                  newFiles={newImageFiles}
                  onAddFiles={(files) => setNewImageFiles(prev => [...prev, ...files])}
                  onRemoveNewFile={(idx) => {
                      const arr = [...newImageFiles];
                      arr.splice(idx, 1);
                      setNewImageFiles(arr);
                      if (defaultImageIdentifier === `new_${idx}`) setDefaultImageIdentifier('');
                  }}
                  defaultImageIdentifier={defaultImageIdentifier}
                  onSetDefaultImage={setDefaultImageIdentifier}
                  />
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#A57322', marginBottom: '32px', marginTop: 0 }}>Ảnh Giấy Chứng Nhận/Kiểm Định (Tùy chọn)</h2>
              <div style={{ background: '#F9F9F9', borderRadius: '4px', padding: '24px', overflow: 'hidden' }}>
                  <ImageUploader
                  existingImages={existingCertificates.map(url => ({ imagePublicId: url, productImageUrl: url }))}
                  onRemoveExistingImage={(pubId) => {
                      setExistingCertificates(prev => prev.filter(url => url !== pubId));
                      setKeepCertificateImages(prev => prev.filter(url => url !== pubId));
                  }}
                  newFiles={newCertificateFiles}
                  onAddFiles={(files) => setNewCertificateFiles(prev => [...prev, ...files])}
                  onRemoveNewFile={(idx) => {
                      const arr = [...newCertificateFiles];
                      arr.splice(idx, 1);
                      setNewCertificateFiles(arr);
                  }}
                  />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#A57322', margin: 0 }}>Biến thể (Kích thước / Trọng lượng)</h2>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  style={{ display: 'inline-flex', alignItems: 'center', color: '#A57322', fontWeight: 500, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '15px' }}
                >
                  <Plus size={20} style={{ marginRight: '4px' }} /> Thêm biến thể
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                {variants.map((v, index) => (
                  <div key={index} style={{ padding: '32px', border: '1px solid #E7E7E7', borderRadius: '4px', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E7E7E7', paddingBottom: '16px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#A57322', margin: 0 }}>Biến thể #{index + 1}</h3>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(index)}
                          style={{ padding: '8px', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '32px', marginBottom: '32px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontWeight: 500, color: '#333', fontSize: '15px' }}>Loại (VD: 200g)</label>
                        <input required type="text" value={v.unitName} onChange={e => handleVariantChange(index, 'unitName', e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '4px', border: 'none', background: '#F9F9F9', color: '#333', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} placeholder="Đơn vị tính" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontWeight: 500, color: '#333', fontSize: '15px' }}>Giá bán (VNĐ)</label>
                        <input required type="text" inputMode="numeric" value={v.price} onChange={e => handleVariantChange(index, 'price', e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, ''))} style={{ width: '100%', padding: '16px', borderRadius: '4px', border: 'none', background: '#F9F9F9', color: '#333', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} placeholder="0" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontWeight: 500, color: '#333', fontSize: '15px' }}>Kho</label>
                        <input required type="text" inputMode="numeric" value={v.stockQuantity} onChange={e => handleVariantChange(index, 'stockQuantity', e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, ''))} style={{ width: '100%', padding: '16px', borderRadius: '4px', border: 'none', background: '#F9F9F9', color: '#333', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '32px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         <label style={{ fontWeight: 500, color: '#333', fontSize: '15px' }}>Nặng (g)</label>
                        <input required type="text" inputMode="numeric" value={v.weightGram} onChange={e => handleVariantChange(index, 'weightGram', e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, ''))} style={{ width: '100%', padding: '16px', borderRadius: '4px', border: 'none', background: '#F9F9F9', color: '#333', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         <label style={{ fontWeight: 500, color: '#333', fontSize: '15px' }}>Dài (cm)</label>
                        <input required type="text" inputMode="numeric" value={v.lengthCm} onChange={e => handleVariantChange(index, 'lengthCm', e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, ''))} style={{ width: '100%', padding: '16px', borderRadius: '4px', border: 'none', background: '#F9F9F9', color: '#333', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         <label style={{ fontWeight: 500, color: '#333', fontSize: '15px' }}>Rộng (cm)</label>
                        <input required type="text" inputMode="numeric" value={v.widthCm} onChange={e => handleVariantChange(index, 'widthCm', e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, ''))} style={{ width: '100%', padding: '16px', borderRadius: '4px', border: 'none', background: '#F9F9F9', color: '#333', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         <label style={{ fontWeight: 500, color: '#333', fontSize: '15px' }}>Cao (cm)</label>
                        <input required type="text" inputMode="numeric" value={v.heightCm} onChange={e => handleVariantChange(index, 'heightCm', e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, ''))} style={{ width: '100%', padding: '16px', borderRadius: '4px', border: 'none', background: '#F9F9F9', color: '#333', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '48px', minWidth: '300px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#A57322', marginBottom: '32px', marginTop: 0 }}>Thuộc tính chuyên sâu</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: 500, color: '#333', fontSize: '15px' }}>Quy vị</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {[
                      { value: 'CHUA', label: 'Chua' },
                      { value: 'CAY', label: 'Cay' },
                      { value: 'MAN', label: 'Mặn' },
                      { value: 'NGOT', label: 'Ngọt' },
                      { value: 'DANG', label: 'Đắng' },
                      { value: 'NHAT', label: 'Nhạt' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFlavors(prev => prev.includes(opt.value) ? prev.filter(f => f !== opt.value) : [...prev, opt.value])}
                        style={{ padding: '8px 16px', borderRadius: '20px', border: `1px solid ${flavors.includes(opt.value) ? '#A57322' : '#E7E7E7'}`, background: flavors.includes(opt.value) ? '#A57322' : '#F9F9F9', color: flavors.includes(opt.value) ? '#fff' : '#666', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: 500, color: '#333', fontSize: '15px' }}>Đặc tính</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {[
                      { value: 'HAN', label: 'Hàn' },
                      { value: 'NHIET', label: 'Nhiệt' },
                      { value: 'ON', label: 'Ôn' },
                      { value: 'LUONG', label: 'Lương' },
                      { value: 'BINH', label: 'Bình' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setProperties(prev => prev.includes(opt.value) ? prev.filter(p => p !== opt.value) : [...prev, opt.value])}
                        style={{ padding: '8px 16px', borderRadius: '20px', border: `1px solid ${properties.includes(opt.value) ? '#A57322' : '#E7E7E7'}`, background: properties.includes(opt.value) ? '#A57322' : '#F9F9F9', color: properties.includes(opt.value) ? '#fff' : '#666', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: 500, color: '#333', fontSize: '15px' }}>Kinh mạch</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {[
                      { value: 'TAM', label: 'Tâm' },
                      { value: 'CAN', label: 'Can' },
                      { value: 'TY', label: 'Tỳ' },
                      { value: 'PHE', label: 'Phế' },
                      { value: 'THAN', label: 'Thận' },
                      { value: 'VI', label: 'Vị' },
                      { value: 'DOM', label: 'Đởm' },
                      { value: 'DAI_TRANG', label: 'Đại tràng' },
                      { value: 'TIEU_TRANG', label: 'Tiểu tràng' },
                      { value: 'BANG_QUANG', label: 'Bàng quang' },
                      { value: 'TAM_TIEU', label: 'Tam tiêu' },
                      { value: 'TAM_BAO', label: 'Tâm bào' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setMeridians(prev => prev.includes(opt.value) ? prev.filter(m => m !== opt.value) : [...prev, opt.value])}
                        style={{ padding: '8px 16px', borderRadius: '20px', border: `1px solid ${meridians.includes(opt.value) ? '#A57322' : '#E7E7E7'}`, background: meridians.includes(opt.value) ? '#A57322' : '#F9F9F9', color: meridians.includes(opt.value) ? '#fff' : '#666', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#A57322', marginBottom: '32px', marginTop: 0 }}>Phân loại & SEO</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500, color: '#333', fontSize: '15px' }}>Tags</label>
                <input type="text" value={tags.join(', ')} onChange={e => handleTextInputArray(setTags, e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '4px', border: 'none', background: '#F9F9F9', color: '#333', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} placeholder="trà, organic, thảo mộc..." />
                <p style={{ marginTop: '4px', fontSize: '14px', color: '#888', margin: 0 }}>Phân cách bằng dấu phẩy</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
