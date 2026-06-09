'use client';

import { useEffect, useState } from 'react';
import { X, Activity, Calendar, Percent, FileText } from 'lucide-react';
import { customerAdminService } from '@/services/customer.service';
import { UserHealthTag } from '@/types/customer.type';

interface CustomerHealthDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number;
  customerName: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#e53935',
  RESOLVED: '#43a047',
  CHRONIC: '#fb8c00',
  UNKNOWN: '#757575',
};

const CATEGORY_COLORS: Record<string, string> = {
  HO_HAP: '#2196F3',
  TIEU_HOA: '#FF9800',
  THAN_KINH: '#9C27B0',
  CO_XUONG_KHOP: '#4CAF50',
  TIM_MACH: '#E91E63',
  DA_LIEU: '#00BCD4',
  KHAC: '#607D8B',
};

export default function CustomerHealthDetailModal({
  isOpen,
  onClose,
  customerId,
  customerName,
}: CustomerHealthDetailModalProps) {
  const [healthTags, setHealthTags] = useState<UserHealthTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && customerId) {
      fetchHealthTags();
    }
  }, [isOpen, customerId]);

  const fetchHealthTags = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdminService.getUserHealthTags(customerId);
      setHealthTags(data);
    } catch (err) {
      console.error('Error fetching health tags:', err);
      setError('Không thể tải dữ liệu sức khỏe');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '800px',
          maxHeight: '85vh',
          background: '#fff',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fafafa',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #A57322, #c4933a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Activity size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#333',
                margin: 0,
              }}>
                Hồ sơ Sức khỏe
              </h2>
              <p style={{
                fontSize: '13px',
                color: '#666',
                margin: 0,
              }}>
                {customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              color: '#666',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              Đang tải dữ liệu...
            </div>
          )}

          {error && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#d32f2f' }}>
              {error}
            </div>
          )}

          {!loading && !error && healthTags.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#999',
            }}>
              <Activity size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <p style={{ fontSize: '15px', margin: 0 }}>
                Khách hàng chưa có tag sức khỏe nào
              </p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>
                Dữ liệu sẽ được thu thập khi khách hàng trò chuyện với chatbot
              </p>
            </div>
          )}

          {!loading && !error && healthTags.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
              }}>
                <thead>
                  <tr style={{ background: '#f9f9f9' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#555', borderBottom: '2px solid #eee' }}>
                      Tên triệu chứng
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#555', borderBottom: '2px solid #eee' }}>
                      Nhóm bệnh
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#555', borderBottom: '2px solid #eee' }}>
                      Tình trạng
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#555', borderBottom: '2px solid #eee' }}>
                      Ngày phát hiện
                    </th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#555', borderBottom: '2px solid #eee' }}>
                      Độ tin cậy
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#555', borderBottom: '2px solid #eee' }}>
                      Ghi chú
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {healthTags.map((tag) => (
                    <tr key={tag.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: '#333' }}>
                        {tag.tagName}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: `${CATEGORY_COLORS[tag.category || 'KHAC']}15`,
                          color: CATEGORY_COLORS[tag.category || 'KHAC'],
                        }}>
                          {tag.categoryDisplayName}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: `${STATUS_COLORS[tag.status || 'UNKNOWN']}15`,
                          color: STATUS_COLORS[tag.status || 'UNKNOWN'],
                        }}>
                          {tag.statusDisplayName}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#666', whiteSpace: 'nowrap' }}>
                        {formatDate(tag.detectedAt)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {tag.confidenceScore !== null ? (
                          <span style={{
                            fontWeight: 600,
                            color: tag.confidenceScore >= 0.8 ? '#43a047' : tag.confidenceScore >= 0.5 ? '#fb8c00' : '#d32f2f',
                          }}>
                            {Math.round(tag.confidenceScore * 100)}%
                          </span>
                        ) : (
                          <span style={{ color: '#999' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#666', maxWidth: '200px' }}>
                        {tag.notes || <span style={{ color: '#ccc' }}>-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fafafa',
        }}>
          <p style={{
            fontSize: '12px',
            color: '#999',
            margin: 0,
          }}>
            {healthTags.length > 0 ? `${healthTags.length} tag sức khỏe` : 'Chưa có dữ liệu'}
          </p>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1px solid #ddd',
              background: '#fff',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: '#555',
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
