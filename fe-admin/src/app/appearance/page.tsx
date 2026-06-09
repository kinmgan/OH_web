'use client';

import { useState, useEffect } from 'react';
import { Save, Upload, Image as ImageIcon } from 'lucide-react';
import { themeService } from '@/services/theme.service';
import { siteConfigService } from '@/services/siteConfig.service';
import { contactAdminService } from '@/services/contact.service';
import { ThemeConfig } from '@/types/theme.type';
import { ContactInfo, ContactInfoRequest } from '@/types/contact.type';

const EMPTY_FORM: ContactInfoRequest = {
  phone: '',
  email: '',
  address: '',
  facebook: '',
  zalo: '',
  instagram: '',
};

export default function AppearancePage() {
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [siteConfigs, setSiteConfigs] = useState<Record<string, string>>({});
  const [contactData, setContactData] = useState<ContactInfoRequest>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [files, setFiles] = useState<Record<string, File>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [activeTheme, configs, contactInfo] = await Promise.all([
          themeService.getActiveTheme(),
          siteConfigService.getAllConfigsAsMap(),
          contactAdminService.getContactInfo().catch(() => ({} as ContactInfo))
        ]);

        setTheme(activeTheme);
        setSiteConfigs(configs || {});
        setContactData({
          phone: contactInfo.phone || '',
          email: contactInfo.email || '',
          address: contactInfo.address || '',
          facebook: contactInfo.facebook || '',
          zalo: contactInfo.zalo || '',
          instagram: contactInfo.instagram || '',
        });
      } catch (err) {
        console.error('Failed to load appearance data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setSiteConfigs({ ...siteConfigs, [name]: checked ? 'true' : 'false' });
    } else {
      setSiteConfigs({ ...siteConfigs, [name]: value });
    }
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (theme) {
      setTheme({ ...theme, [e.target.name]: e.target.value });
    }
  };

  const handleContactChange = (field: keyof ContactInfoRequest, value: string) => {
    setContactData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFiles({ ...files, [field]: file });
      // Update preview
      const previewUrl = URL.createObjectURL(file);
      setTheme(prev => prev ? { ...prev, [field + 'Url']: previewUrl } : null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save Theme
      if (theme && theme.id) {
        if (Object.keys(files).length > 0) {
          const formData = new FormData();
          formData.append('themeName', theme.themeName);
          formData.append('isActive', theme.isActive.toString());
          if (theme.promotionImageLink) formData.append('promotionImageLink', theme.promotionImageLink);
          if (theme.headerVideoUrl) formData.append('headerVideoUrl', theme.headerVideoUrl);
          
          Object.keys(files).forEach(key => {
            formData.append(key, files[key]);
          });
          
          await themeService.updateThemeWithFiles(theme.id, formData);
        } else {
          await themeService.updateTheme(theme.id, {
            themeName: theme.themeName,
            promotionImageLink: theme.promotionImageLink,
            headerVideoUrl: theme.headerVideoUrl,
            isActive: theme.isActive
          });
        }
      }

      // Save Site Configs
      if (siteConfigs['products_per_row']) {
        await siteConfigService.updateConfig('products_per_row', siteConfigs['products_per_row']);
      }
      if (siteConfigs['announcement_bar_text'] !== undefined) {
        await siteConfigService.updateConfig('announcement_bar_text', siteConfigs['announcement_bar_text']);
      }
      if (siteConfigs['announcement_bar_enabled'] !== undefined) {
        await siteConfigService.updateConfig('announcement_bar_enabled', siteConfigs['announcement_bar_enabled']);
      }

      // Save Contact Info
      const trimmedContact = {
        phone: contactData.phone?.trim() || undefined,
        email: contactData.email?.trim() || undefined,
        address: contactData.address?.trim() || undefined,
        facebook: contactData.facebook?.trim() || undefined,
        zalo: contactData.zalo?.trim() || undefined,
        instagram: contactData.instagram?.trim() || undefined,
      };
      await contactAdminService.updateContactInfo(trimmedContact);

      alert('Lưu thay đổi thành công!');
      // Clear file inputs state to avoid re-uploading on next save
      setFiles({});
    } catch (err) {
      alert('Có lỗi xảy ra khi lưu thay đổi!');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '32px' }}>Đang tải...</div>;
  }

  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '32px', color: '#333' }}>
        Quản lý Giao diện
      </h1>

      {/* Theme Configs */}
      {theme && (
        <div style={{ background: '#fff', padding: '32px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', color: '#333' }}>Hình ảnh & Banner (Theme)</h2>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#333' }}>
              Video Trang Chủ (Cloudinary URL - Header Video)
            </label>
            <input
              type="text"
              name="headerVideoUrl"
              value={theme.headerVideoUrl || ''}
              onChange={handleThemeChange}
              placeholder="VD: https://res.cloudinary.com/.../video.mp4"
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: '#333' }}>
                Ảnh Cover (Banner Desktop)
              </label>
              {theme.coverImageUrl && (
                <img src={theme.coverImageUrl} alt="Cover" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', marginBottom: '12px' }} />
              )}
              <input type="file" accept="image/*" onChange={(e) => handleFileChange('coverImage', e)} style={{ fontSize: '14px' }} />
            </div>
            
            <div style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: '#333' }}>
                Ảnh Promotion (Banner Giữa Trang)
              </label>
              {theme.promotionImageUrl && (
                <img src={theme.promotionImageUrl} alt="Promotion" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', marginBottom: '12px' }} />
              )}
              <input type="file" accept="image/*" onChange={(e) => handleFileChange('promotionImage', e)} style={{ fontSize: '14px', marginBottom: '12px' }} />
              <input
                type="text"
                name="promotionImageLink"
                value={theme.promotionImageLink || ''}
                onChange={handleThemeChange}
                placeholder="Đường dẫn liên kết (VD: /san-pham)"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {[1, 2, 3].map((num) => {
              const field = `headerImage${num}` as any;
              const url = theme[`${field}Url` as keyof ThemeConfig] as string;
              return (
                <div key={num} style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: '#333' }}>
                    Header Image {num} (Poster)
                  </label>
                  {url && (
                    <img src={url} alt={`Header ${num}`} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px', marginBottom: '12px' }} />
                  )}
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(field, e)} style={{ fontSize: '13px' }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Site Configs */}
      <div style={{ background: '#fff', padding: '32px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', color: '#333' }}>Cấu hình Hiển thị</h2>
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#333' }}>
            Số sản phẩm trên 1 hàng (Trang Sản phẩm)
          </label>
          <select
            name="products_per_row"
            value={siteConfigs['products_per_row'] || '4'}
            onChange={handleConfigChange}
            style={{ width: '200px', padding: '10px 16px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
          >
            <option value="3">3 sản phẩm</option>
            <option value="4">4 sản phẩm</option>
            <option value="5">5 sản phẩm</option>
          </select>
        </div>

        <div style={{ marginBottom: '24px', padding: '16px', border: '1px solid #eee', borderRadius: '8px', background: '#fafafa' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <input
              type="checkbox"
              id="announcement_bar_enabled"
              name="announcement_bar_enabled"
              checked={siteConfigs['announcement_bar_enabled'] === 'true'}
              onChange={handleConfigChange}
              style={{ width: '18px', height: '18px' }}
            />
            <label htmlFor="announcement_bar_enabled" style={{ fontSize: '14px', fontWeight: 600, color: '#333', cursor: 'pointer' }}>
              Bật thanh thông báo (Announcement Bar)
            </label>
          </div>
          
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#555' }}>
            Nội dung thông báo
          </label>
          <input
            type="text"
            name="announcement_bar_text"
            value={siteConfigs['announcement_bar_text'] || ''}
            onChange={handleConfigChange}
            placeholder="VD: Miễn phí vận chuyển cho đơn hàng từ 500k"
            disabled={siteConfigs['announcement_bar_enabled'] !== 'true'}
            style={{ 
              width: '100%', 
              padding: '12px 16px', 
              border: '1px solid #ddd', 
              borderRadius: '6px', 
              fontSize: '14px',
              background: siteConfigs['announcement_bar_enabled'] !== 'true' ? '#f0f0f0' : '#fff'
            }}
          />
        </div>
      </div>

      {/* Contact Info */}
      <div style={{ background: '#fff', padding: '32px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#333' }}>Quản lý liên hệ</h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
          Cập nhật thông tin liên hệ hiển thị trên website (Footer và trang Liên hệ).
        </p>

        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#333' }}>Thông tin chung</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <Field
            label="Số điện thoại"
            value={contactData.phone || ''}
            onChange={(v) => handleContactChange('phone', v)}
            placeholder="VD: 0909 123 456"
          />
          <Field
            label="Email"
            type="email"
            value={contactData.email || ''}
            onChange={(v) => handleContactChange('email', v)}
            placeholder="VD: contact@orientalherbs.com"
          />
          <div style={{ gridColumn: '1 / -1' }}>
            <Field
              label="Địa chỉ"
              value={contactData.address || ''}
              onChange={(v) => handleContactChange('address', v)}
              placeholder="VD: 123 Đường ABC, Quận 1, TP.HCM"
            />
          </div>
        </div>

        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#333' }}>Mạng xã hội</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <Field
            label="Facebook"
            value={contactData.facebook || ''}
            onChange={(v) => handleContactChange('facebook', v)}
            placeholder="VD: https://facebook.com/yourpage"
          />
          <Field
            label="Instagram"
            value={contactData.instagram || ''}
            onChange={(v) => handleContactChange('instagram', v)}
            placeholder="VD: https://instagram.com/yourpage"
          />
          <div style={{ gridColumn: '1 / -1' }}>
            <Field
              label="Zalo"
              value={contactData.zalo || ''}
              onChange={(v) => handleContactChange('zalo', v)}
              placeholder="VD: https://zalo.me/yourpage"
            />
          </div>
        </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={saving}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 24px',
          background: saving ? '#ccc' : '#A57322',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: saving ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          fontSize: '15px'
        }}
      >
        <Save size={20} />
        {saving ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
      </button>
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
