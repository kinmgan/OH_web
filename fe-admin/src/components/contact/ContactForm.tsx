'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { ContactInfo, ContactInfoRequest } from '@/types/contact.type';
import { contactAdminService } from '@/services/contact.service';

const EMPTY_FORM: ContactInfoRequest = {
  phone: '',
  email: '',
  address: '',
  facebook: '',
  zalo: '',
  instagram: '',
};

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactInfoRequest>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    contactAdminService.getContactInfo()
      .then((data: ContactInfo) => {
        setFormData({
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          facebook: data.facebook || '',
          zalo: data.zalo || '',
          instagram: data.instagram || '',
        });
      })
      .catch(() => setError('Không thể tải thông tin liên hệ.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof ContactInfoRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const trimmed = {
      phone: formData.phone?.trim() || undefined,
      email: formData.email?.trim() || undefined,
      address: formData.address?.trim() || undefined,
      facebook: formData.facebook?.trim() || undefined,
      zalo: formData.zalo?.trim() || undefined,
      instagram: formData.instagram?.trim() || undefined,
    };

    setSaving(true);
    try {
      await contactAdminService.updateContactInfo(trimmed);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi lưu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
        Đang tải...
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '720px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Quản lý liên hệ</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
        Cập nhật thông tin liên hệ hiển thị trên website (Footer và trang Liên hệ).
      </p>

      {error && (
        <div style={{
          padding: '12px 16px',
          background: '#ffebee',
          border: '1px solid #ffcdd2',
          borderRadius: '8px',
          color: '#c62828',
          marginBottom: '24px',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '12px 16px',
          background: '#e8f5e9',
          border: '1px solid #c8e6c9',
          borderRadius: '8px',
          color: '#2e7d32',
          marginBottom: '24px',
          fontSize: '14px',
        }}>
          Lưu thành công!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{
          background: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: '24px',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Thông tin chung</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field
              label="Số điện thoại"
              value={formData.phone || ''}
              onChange={(v) => handleChange('phone', v)}
              placeholder="VD: 0909 123 456"
            />
            <Field
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(v) => handleChange('email', v)}
              placeholder="VD: contact@orientalherbs.com"
            />
          </div>

          <div style={{ marginTop: '16px' }}>
            <Field
              label="Địa chỉ"
              value={formData.address || ''}
              onChange={(v) => handleChange('address', v)}
              placeholder="VD: 123 Đường ABC, Quận 1, TP.HCM"
            />
          </div>
        </div>

        <div style={{
          background: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: '24px',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Mạng xã hội</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field
              label="Facebook"
              value={formData.facebook || ''}
              onChange={(v) => handleChange('facebook', v)}
              placeholder="VD: https://facebook.com/yourpage"
            />
            <Field
              label="Instagram"
              value={formData.instagram || ''}
              onChange={(v) => handleChange('instagram', v)}
              placeholder="VD: https://instagram.com/yourpage"
            />
          </div>

          <div style={{ marginTop: '16px' }}>
            <Field
              label="Zalo"
              value={formData.zalo || ''}
              onChange={(v) => handleChange('zalo', v)}
              placeholder="VD: https://zalo.me/yourpage"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: saving ? '#c5a062' : '#A57322',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          <Save size={18} />
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '6px' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid #e0e0e0',
          borderRadius: '6px',
          fontSize: '14px',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#A57322')}
        onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
      />
    </div>
  );
}
