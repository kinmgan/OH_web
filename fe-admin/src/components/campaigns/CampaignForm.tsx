'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, Save, Plus, Mail, Send } from 'lucide-react';
import { ProductVariant } from '@/types/product.type';
import {
  CampaignDetail,
  CampaignCreateRequest,
  CampaignUpdateRequest,
  CampaignType,
  CampaignStatus,
  CampaignProductVariantItem,
  HEALTH_TAG_OPTIONS,
} from '@/types/campaign.type';
import { campaignService } from '@/services/campaign.service';
import { EmailTemplateService } from '@/services/emailTemplate.service';
import EmailTemplateForm from '@/components/email-templates/EmailTemplateForm';
import ProductVariantPicker from './ProductVariantPicker';
import CampaignProductTable from './CampaignProductTable';
import CampaignStatusBadge from './CampaignStatusBadge';

interface CampaignFormProps {
  campaignId?: number;
  isEdit?: boolean;
}

export default function CampaignForm({ campaignId, isEdit = false }: CampaignFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  // Form state – chung
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CampaignType>('WEB');
  const [status, setStatus] = useState<CampaignStatus>('DRAFT');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [items, setItems] = useState<CampaignProductVariantItem[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  // Form state – chỉ dùng cho EMAIL campaign
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [targetHealthCategory, setTargetHealthCategory] = useState('');
  const [totalSent, setTotalSent] = useState<number>(0);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<any | null>(null);

  useEffect(() => {
    if (isEdit && campaignId) {
      loadCampaign(campaignId);
    }
  }, [campaignId, isEdit]);

  // Load danh sách email template khi loại = EMAIL
  useEffect(() => {
    if (type === 'EMAIL') {
      EmailTemplateService.getAll().then((data: any[]) => {
        const marketingTemplates = data.filter((t: any) => t.isActive && t.templateType === 'MARKETING');
        setEmailTemplates(marketingTemplates);
      }).catch(console.error);
    }
  }, [type]);

  const loadCampaign = async (id: number) => {
    setLoadingData(true);
    try {
      const campaign = await campaignService.getCampaign(id);
      setName(campaign.name);
      setDescription(campaign.description || '');
      setType(campaign.type);
      setStatus(campaign.status);
      setStartDate(campaign.startDate ? new Date(campaign.startDate).toISOString().slice(0, 16) : '');
      setEndDate(campaign.endDate ? new Date(campaign.endDate).toISOString().slice(0, 16) : '');
      setScheduledAt(campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : '');
      setDisplayOrder(campaign.displayOrder ?? 0);
      setItems(campaign.items.map(item => ({
        id: item.id,
        productVariantId: item.productVariantId,
        productId: item.productId,
        productName: item.productName,
        unitName: item.unitName,
        originalPrice: Number(item.originalPrice),
        discountType: item.discountType,
        discountValue: Number(item.discountValue),
        discountAmount: Number(item.discountAmount),
        finalPrice: Number(item.finalPrice),
        displayOrder: item.displayOrder,
      })));

      // Load thêm EMAIL fields
      if (campaign.type === 'EMAIL') {
        setTemplateId(campaign.templateId || null);
        setTargetHealthCategory(campaign.targetHealthCategory || '');
        setTotalSent(campaign.totalSent || 0);
      }
    } catch (err) {
      setError('Không thể tải thông tin chiến dịch');
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddVariant = (product: any, variant: ProductVariant) => {
    const alreadyAdded = items.some(i => i.productVariantId === variant.productVariantId);
    if (alreadyAdded) return;
    const newItem: CampaignProductVariantItem = {
      productVariantId: variant.productVariantId!,
      productId: product.id,
      productName: product.name,
      unitName: variant.unitName,
      originalPrice: variant.price,
      discountType: 'PERCENTAGE',
      discountValue: 0,
      discountAmount: 0,
      finalPrice: variant.price,
      displayOrder: items.length,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveVariant = (productVariantId: number) => {
    setItems(items.filter(item => item.productVariantId !== productVariantId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Tên chiến dịch là bắt buộc');
      return;
    }

    if (type === 'WEB' && items.length === 0) {
      setError('Chiến dịch WEB cần có ít nhất 1 sản phẩm');
      return;
    }

    if (type === 'EMAIL' && !templateId) {
      setError('Vui lòng chọn template email cho chiến dịch này');
      return;
    }

    for (const item of items) {
      if (item.discountValue < 0) {
        setError('Giá trị giảm giá không được âm');
        return;
      }
      if (item.discountType === 'PERCENTAGE' && item.discountValue > 100) {
        setError('Phần trăm giảm giá không được vượt quá 100%');
        return;
      }
    }

    setLoading(true);

    try {
      const requestData: CampaignCreateRequest = {
        name,
        description,
        type,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        displayOrder,
        items: items.map(item => ({
          productVariantId: item.productVariantId,
          discountType: item.discountType,
          discountValue: item.discountValue,
          displayOrder: item.displayOrder,
        })),
        // Email fields (chỉ gửi khi loại EMAIL)
        ...(type === 'EMAIL' && {
          templateId: templateId || undefined,
          targetHealthCategory: targetHealthCategory || undefined,
        }),
      };

      if (isEdit && campaignId) {
        await campaignService.updateCampaign(campaignId, requestData as CampaignUpdateRequest);
      } else {
        await campaignService.createCampaign(requestData);
      }

      router.push('/chien-dich');
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi lưu chiến dịch');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusChange = async (newStatus: CampaignStatus) => {
    if (!isEdit || !campaignId) return;

    setLoading(true);
    try {
      await campaignService.updateCampaignStatus(campaignId, { status: newStatus });
      setStatus(newStatus);
    } catch (err: any) {
      setError(err?.message || 'Không thể cập nhật trạng thái');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ color: '#999' }}>Đang tải...</div>
      </div>
    );
  }

  const isReadOnly = status === 'COMPLETED' || status === 'CANCELLED';

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => router.push('/chien-dich')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#666',
            fontSize: '14px',
            marginBottom: '16px',
          }}
        >
          <ArrowLeft size={18} />
          Quay lại danh sách
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
            {isEdit ? 'Chỉnh sửa chiến dịch' : 'Tạo chiến dịch mới'}
          </h1>
          {isEdit && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>Trạng thái:</span>
              <CampaignStatusBadge status={status} />
              {status === 'DRAFT' && (
                <button
                  onClick={() => handleQuickStatusChange('ACTIVE')}
                  disabled={loading}
                  style={{
                    padding: '6px 14px',
                    background: '#2e7d32',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '13px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Send size={14} />
                  {type === 'EMAIL' ? 'Kích hoạt & gửi email' : 'Kích hoạt'}
                </button>
              )}
              {/* Không có nút PAUSED nữa */}
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: '#ffebee',
            border: '1px solid #ffcdd2',
            borderRadius: '8px',
            color: '#c62828',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
          {/* Main Content */}
          <div>
            {/* Basic Info */}
            <div
              style={{
                background: '#fff',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                marginBottom: '24px',
              }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Thông tin cơ bản</h2>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  Tên chiến dịch <span style={{ color: '#c62828' }}>*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Khuyến mãi tháng 6"
                  disabled={isReadOnly}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: isReadOnly ? '#f5f5f5' : '#fff',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  Mô tả
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả chi tiết về chiến dịch..."
                  rows={3}
                  disabled={isReadOnly}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical',
                    background: isReadOnly ? '#f5f5f5' : '#fff',
                  }}
                />
              </div>

              <div style={{ marginBottom: '0' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  Loại chiến dịch <span style={{ color: '#c62828' }}>*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CampaignType)}
                  disabled={isEdit || isReadOnly} // Không cho đổi loại khi đang edit
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: (isEdit || isReadOnly) ? '#f5f5f5' : '#fff',
                  }}
                >
                  <option value="WEB">Web – Hiển thị trên website</option>
                  <option value="EMAIL">Email – Gửi email marketing</option>
                </select>
                {isEdit && (
                  <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                    Không thể thay đổi loại chiến dịch sau khi đã tạo.
                  </p>
                )}
              </div>
            </div>

            {/* EMAIL Campaign – Chọn Template */}
            {type === 'EMAIL' && (
              <div
                style={{
                  background: '#fff',
                  padding: '24px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  marginBottom: '24px',
                  borderLeft: '4px solid #A57322',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Mail size={18} color="#A57322" />
                  <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Nội dung Email</h2>
                </div>

                {/* Nhóm khách hàng */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                    Nhóm khách hàng mục tiêu
                  </label>
                  <select
                    value={targetHealthCategory}
                    onChange={(e) => setTargetHealthCategory(e.target.value)}
                    disabled={isReadOnly}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: isReadOnly ? '#f5f5f5' : '#fff',
                    }}
                  >
                    {HEALTH_TAG_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    Chọn nhóm bệnh lý để gửi đúng đối tượng. Để trống = gửi tất cả.
                  </p>
                </div>

                {/* Chọn template */}
                <div style={{ marginBottom: '0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 500 }}>
                      Template email <span style={{ color: '#c62828' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          EmailTemplateService.getAll().then((data: any[]) => {
                            const marketingTemplates = data.filter((t: any) => t.isActive && t.templateType === 'MARKETING');
                            setEmailTemplates(marketingTemplates);
                          }).catch(console.error);
                        }}
                        style={{ fontSize: '12px', color: '#666', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Tải lại danh sách"
                      >
                        ↻ Tải lại
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTemplateToEdit(null);
                          setShowTemplateModal(true);
                        }}
                        style={{ fontSize: '12px', color: '#A57322', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        + Tạo template mới
                      </button>
                    </div>
                  </div>

                  {emailTemplates.length === 0 ? (
                    <div style={{
                      padding: '16px',
                      background: '#fff8e1',
                      borderRadius: '8px',
                      border: '1px dashed #ffca28',
                      textAlign: 'center',
                      color: '#795548',
                      fontSize: '14px',
                    }}>
                      <div style={{ marginBottom: '8px' }}>⚠️ Chưa có template email nào.</div>
                      <button 
                        type="button" 
                        onClick={() => {
                          setTemplateToEdit(null);
                          setShowTemplateModal(true);
                        }}
                        style={{ color: '#A57322', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        Tạo template ngay ↗
                      </button>
                    </div>
                  ) : (
                    <select
                      value={templateId ?? ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : null;
                        setTemplateId(val);
                        setSelectedTemplate(emailTemplates.find(t => t.id === val) || null);
                      }}
                      disabled={isReadOnly}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: templateId ? '1px solid #A57322' : '1px solid #e0e0e0',
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: isReadOnly ? '#f5f5f5' : '#fff',
                      }}
                    >
                      <option value="">-- Chọn template --</option>
                      {emailTemplates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  )}

                  {/* Preview template đã chọn */}
                  {(selectedTemplate || (templateId && emailTemplates.find(t => t.id === templateId))) && (() => {
                    const tmpl = selectedTemplate || emailTemplates.find(t => t.id === templateId);
                    return (
                      <div style={{
                        marginTop: '12px',
                        padding: '14px 16px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#333', marginBottom: '4px' }}>
                              📧 {tmpl.name}
                            </div>
                            <div style={{ fontSize: '13px', color: '#666' }}>
                              <span style={{ color: '#999' }}>Tiêu đề:</span> {tmpl.subject}
                            </div>
                            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                              Code: <code style={{ background: '#e9ecef', padding: '1px 6px', borderRadius: '3px' }}>{tmpl.templateCode}</code>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setTemplateToEdit(tmpl);
                              setShowTemplateModal(true);
                            }}
                            style={{ fontSize: '12px', color: '#A57322', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: '12px' }}
                          >
                            Sửa template ↗
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Thống kê gửi (chỉ hiện khi edit và đã gửi) */}
                {isEdit && totalSent > 0 && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    background: '#e8f5e9',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <Send size={16} color="#2e7d32" />
                    <span style={{ fontSize: '14px', color: '#2e7d32', fontWeight: 500 }}>
                      Đã gửi thành công: <strong>{totalSent.toLocaleString('vi-VN')}</strong> email
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Products Section – Cho cả WEB và EMAIL */}
            <div
              style={{
                background: '#fff',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 600 }}>
                    {type === 'EMAIL' ? 'Sản phẩm đính kèm (tùy chọn)' : 'Sản phẩm trong chiến dịch'}
                  </h2>
                  {type === 'EMAIL' && (
                    <p style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>
                      Thông tin sản phẩm để hiển thị trong nội dung email (không bắt buộc)
                    </p>
                  )}
                </div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setShowPicker(!showPicker)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      background: '#A57322',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={16} />
                    Thêm sản phẩm
                  </button>
                )}
              </div>

              {showPicker && !isReadOnly && (
                <div style={{ marginBottom: '24px' }}>
                  <ProductVariantPicker
                    selectedVariants={items.map(item => ({
                      productVariantId: item.productVariantId,
                      unitName: item.unitName || '',
                      price: item.originalPrice || 0,
                      stockQuantity: 0,
                    }))}
                    onAddVariant={handleAddVariant}
                    onRemoveVariant={handleRemoveVariant}
                  />
                </div>
              )}

              <CampaignProductTable
                items={items}
                onItemsChange={setItems}
                readOnly={isReadOnly}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Thời gian */}
            <div
              style={{
                background: '#fff',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                marginBottom: '24px',
              }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Thời gian</h2>

              {type === 'EMAIL' ? (
                /* EMAIL campaign: chỉ cần scheduledAt (thời điểm gửi) */
                <div style={{ marginBottom: '0' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                    Thời điểm gửi email
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    disabled={isReadOnly}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: isReadOnly ? '#f5f5f5' : '#fff',
                    }}
                  />
                  <p style={{ fontSize: '12px', color: '#888', marginTop: '6px', lineHeight: '1.5' }}>
                    • Để trống hoặc chọn thời điểm đã qua → <strong>gửi ngay</strong> khi kích hoạt<br />
                    • Chọn thời điểm tương lai → <strong>lên lịch tự động</strong> gửi đúng giờ
                  </p>
                </div>
              ) : (
                /* WEB campaign: cần startDate và endDate */
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                      Ngày bắt đầu <span style={{ color: '#c62828' }}>*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={isReadOnly}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: isReadOnly ? '#f5f5f5' : '#fff',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '0' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                      Ngày kết thúc <span style={{ color: '#c62828' }}>*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={isReadOnly}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: isReadOnly ? '#f5f5f5' : '#fff',
                      }}
                    />
                  </div>
                </>
              )}
            </div>



            {/* Submit */}
            {!isReadOnly && (
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px 24px',
                  background: '#A57322',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                <Save size={18} />
                {loading ? 'Đang lưu...' : (isEdit ? 'Cập nhật chiến dịch' : 'Tạo chiến dịch')}
              </button>
            )}

            {isReadOnly && (
              <div style={{
                padding: '12px 16px',
                background: '#f5f5f5',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#888',
                textAlign: 'center',
              }}>
                Chiến dịch này đã {status === 'COMPLETED' ? 'kết thúc' : 'bị hủy'} và không thể chỉnh sửa.
              </div>
            )}
          </div>
        </div>
      </form>

      {showTemplateModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '40px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '1200px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <button
              type="button"
              onClick={() => setShowTemplateModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#f5f5f5',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              ×
            </button>
            <div style={{ padding: '0 16px 16px 16px', marginTop: '-16px' }}>
              <EmailTemplateForm 
                initialData={templateToEdit} 
                isEdit={!!templateToEdit} 
                onCancel={() => setShowTemplateModal(false)}
                onSuccess={(savedTemplate) => {
                  setShowTemplateModal(false);
                  // Reload templates
                  EmailTemplateService.getAll().then((data: any[]) => {
                    const marketingTemplates = data.filter((t: any) => t.isActive && t.templateType === 'MARKETING');
                    setEmailTemplates(marketingTemplates);
                    if (savedTemplate) {
                      setTemplateId(savedTemplate.id);
                      setSelectedTemplate(savedTemplate);
                    }
                  }).catch(console.error);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
