'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import EmailTemplateForm from '@/components/email-templates/EmailTemplateForm';
import { EmailTemplateService } from '@/services/emailTemplate.service';
import { EmailTemplate } from '@/types/emailTemplate.type';

export default function EditEmailTemplatePage() {
  const params = useParams();
  const [initialData, setInitialData] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = params.id ? Number(params.id) : null;
    if (!id) return;

    EmailTemplateService.getById(id)
      .then((data) => {
        setInitialData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Không thể tải thông tin mẫu email');
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return <div style={{ padding: '48px', textAlign: 'center', color: '#666' }}>Đang tải dữ liệu...</div>;
  }

  if (error || !initialData) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ color: '#c62828', marginBottom: '16px' }}>{error || 'Không tìm thấy mẫu email'}</div>
        <a href="/email-templates" style={{ color: '#A57322', textDecoration: 'none', fontWeight: 500 }}>
          Quay lại danh sách
        </a>
      </div>
    );
  }

  return <EmailTemplateForm initialData={initialData} isEdit={true} />;
}
