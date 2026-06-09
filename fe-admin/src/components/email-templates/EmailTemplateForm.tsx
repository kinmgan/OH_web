'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { EmailTemplate, EmailTemplateType } from '@/types/emailTemplate.type';
import { EmailTemplateService } from '@/services/emailTemplate.service';
import RichTextEditor from '@/components/products/RichTextEditor';

interface EmailTemplateFormProps {
  initialData?: EmailTemplate;
  isEdit?: boolean;
  onSuccess?: (savedTemplate: EmailTemplate) => void;
  onCancel?: () => void;
}

export default function EmailTemplateForm({ initialData, isEdit = false, onSuccess, onCancel }: EmailTemplateFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Test email state
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<EmailTemplate>>({
    templateCode: initialData?.templateCode || '',
    name: initialData?.name || '',
    subject: initialData?.subject || '',
    description: initialData?.description || '',
    templateType: initialData?.templateType || 'MARKETING',
    isActive: initialData?.isActive ?? true,
    bodyHtml: initialData?.bodyHtml || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleRichTextChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      bodyHtml: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let savedData;
      if (isEdit && initialData?.id) {
        savedData = await EmailTemplateService.update(initialData.id, formData);
      } else {
        savedData = await EmailTemplateService.create(formData);
      }
      
      if (onSuccess) {
        onSuccess(savedData);
        return;
      }
      
      if (returnUrl) {
        router.push(returnUrl);
      } else {
        router.push('/email-templates');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi lưu mẫu email');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail || !initialData?.id) return;
    
    setTesting(true);
    setTestSuccess(null);
    setError(null);

    try {
      await EmailTemplateService.test(initialData.id, testEmail);
      setTestSuccess('Đã gửi email thử nghiệm thành công!');
      setTimeout(() => setTestSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Không thể gửi email thử nghiệm');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button
          onClick={() => router.push('/email-templates')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: '#666'
          }}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
          {isEdit ? 'Chỉnh sửa mẫu Email' : 'Tạo mẫu Email mới'}
        </h1>
      </div>

      {error && (
        <div style={{ padding: '16px', background: '#ffebee', color: '#c62828', borderRadius: '8px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {testSuccess && (
        <div style={{ padding: '16px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '8px', marginBottom: '24px' }}>
          {testSuccess}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Main Content Area */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Tên mẫu Email <span style={{ color: '#c62828' }}>*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="VD: Chúc mừng sinh nhật khách hàng"
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Tiêu đề Email (Subject) <span style={{ color: '#c62828' }}>*</span></label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="VD: Nhận ngay ưu đãi sinh nhật từ Oriental Herbs!"
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Nội dung HTML <span style={{ color: '#c62828' }}>*</span></label>
              <RichTextEditor
                value={formData.bodyHtml || ''}
                onChange={handleRichTextChange}
                placeholder="Soạn thảo nội dung email ở đây..."
              />
            </div>
            
          </div>

          {/* Sidebar Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Cài đặt chung</h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>Mã Template (Code) <span style={{ color: '#c62828' }}>*</span></label>
                <input
                  type="text"
                  name="templateCode"
                  value={formData.templateCode}
                  onChange={handleChange}
                  placeholder="VD: HAPPY_BIRTHDAY"
                  required
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', textTransform: 'uppercase' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>Loại mẫu</label>
                <select
                  name="templateType"
                  value={formData.templateType}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                >
                  <option value="MARKETING">Marketing (Tiếp thị)</option>
                  <option value="TRANSACTIONAL">Transactional (Giao dịch)</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>Mô tả ngắn</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Mô tả mục đích sử dụng mẫu này..."
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  style={{ width: '16px', height: '16px' }}
                />
                <label htmlFor="isActive" style={{ fontSize: '14px', cursor: 'pointer' }}>Kích hoạt (Cho phép sử dụng)</label>
              </div>
            </div>

            {/* Test Email Section (Only shown if editing existing template) */}
            {isEdit && (
              <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Thử nghiệm Email</h3>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>Gửi email mẫu tới địa chỉ email của bạn để kiểm tra hiển thị thực tế.</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Nhập email..."
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                  />
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={!testEmail || testing}
                    style={{
                      background: '#e0e0e0',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      cursor: (!testEmail || testing) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Send size={18} color="#333" />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  if (onCancel) onCancel();
                  else router.push('/email-templates');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#A57322',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Save size={18} />
                {loading ? 'Đang lưu...' : 'Lưu mẫu'}
              </button>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}
