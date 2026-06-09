'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit3, Trash2, Mail, CheckCircle, XCircle } from 'lucide-react';
import { EmailTemplate } from '@/types/emailTemplate.type';
import { EmailTemplateService } from '@/services/emailTemplate.service';

export default function EmailTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      // The service getAll might return an array directly based on our implementation
      const data = await EmailTemplateService.getAll();
      
      // If backend returns paginated response, we would extract content.
      // But assuming array for now based on current typings.
      if (Array.isArray(data)) {
        setTemplates(data);
      } else if (data && typeof data === 'object' && 'content' in data) {
        setTemplates((data as any).content);
      } else {
        setTemplates([]);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách mẫu email');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      await EmailTemplateService.delete(id);
      setDeleteId(null);
      loadTemplates();
    } catch (err: any) {
      setError(err.message || 'Không thể xóa mẫu email này');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#333' }}>Mẫu Email</h1>
        <button
          onClick={() => router.push('/email-templates/tao-moi')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: '#A57322',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          <Plus size={18} />
          Tạo mẫu mới
        </button>
      </div>

      {error && (
        <div style={{ padding: '16px', background: '#ffebee', color: '#c62828', borderRadius: '8px', marginBottom: '24px' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '12px', background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', fontWeight: 500 }}>Đóng</button>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>Đang tải...</div>
        ) : templates.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
            <Mail size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <div>Chưa có mẫu email nào.</div>
            <button
              onClick={() => router.push('/email-templates/tao-moi')}
              style={{ marginTop: '16px', background: 'transparent', border: '1px solid #A57322', color: '#A57322', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
            >
              Tạo mẫu đầu tiên
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#666' }}>Mã (Code)</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#666' }}>Tên mẫu</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#666' }}>Loại</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, fontSize: '13px', color: '#666' }}>Trạng thái</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, fontSize: '13px', color: '#666' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px' }}>
                    <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                      {template.templateCode}
                    </code>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '14px' }}>
                    <div style={{ fontWeight: 500, color: '#333' }}>{template.name}</div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{template.subject}</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '14px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: template.templateType === 'MARKETING' ? '#e3f2fd' : '#f3e5f5',
                      color: template.templateType === 'MARKETING' ? '#1976d2' : '#7b1fa2'
                    }}>
                      {template.templateType}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    {template.isActive ? (
                      <CheckCircle size={18} color="#2e7d32" style={{ margin: '0 auto' }} />
                    ) : (
                      <XCircle size={18} color="#c62828" style={{ margin: '0 auto' }} />
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => router.push(`/email-templates/${template.id}/sua`)}
                        style={{ padding: '6px', background: 'none', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', color: '#666' }}
                        title="Chỉnh sửa"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteId(template.id)}
                        style={{ padding: '6px', background: 'none', border: '1px solid #ffcdd2', borderRadius: '4px', cursor: 'pointer', color: '#c62828' }}
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Xác nhận xóa</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
              Bạn có chắc chắn muốn xóa mẫu email này? Hành động này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                style={{ padding: '10px 20px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '6px', cursor: deleting ? 'not-allowed' : 'pointer' }}
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                style={{ padding: '10px 20px', background: '#c62828', color: '#fff', border: 'none', borderRadius: '6px', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}
              >
                {deleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
