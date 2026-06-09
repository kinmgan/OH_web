'use client';

import { ReturnResponse, ReturnStatus } from '@/types/return.type';
import { Eye } from 'lucide-react';

interface ReturnTableProps {
  returns: ReturnResponse[];
  loading: boolean;
  onViewDetail: (item: ReturnResponse) => void;
}

const statusConfig: Record<ReturnStatus, { color: string; bgColor: string; label: string }> = {
  'PENDING': { color: '#E65100', bgColor: '#FFF3E0', label: 'Chờ duyệt' },
  'APPROVED': { color: '#1565C0', bgColor: '#E3F2FD', label: 'Đã duyệt' },
  'REJECTED': { color: '#C62828', bgColor: '#FFEBEE', label: 'Từ chối' },
  'RECEIVED': { color: '#6A1B9A', bgColor: '#F3E5F5', label: 'Đã nhận hàng' },
  'REFUNDED': { color: '#2E7D32', bgColor: '#E8F5E9', label: 'Đã hoàn tiền' },
};

const reasonLabels: Record<string, string> = {
  'DAMAGED': 'Hàng hỏng / vỡ',
  'WRONG_ITEM': 'Sai sản phẩm',
  'NOT_SATISFIED': 'Không đúng mô tả',
  'OTHER': 'Lý do khác',
};

export default function ReturnTable({ returns, loading, onViewDetail }: ReturnTableProps) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        Đang tải...
      </div>
    );
  }

  if (returns.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666', background: '#f9f9f9', borderRadius: '8px' }}>
        Không có yêu cầu hoàn hàng nào
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#333', fontSize: '14px' }}>
              Mã đơn hàng
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#333', fontSize: '14px' }}>
              Lý do
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#333', fontSize: '14px' }}>
              Số sản phẩm
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#333', fontSize: '14px' }}>
              Ngày yêu cầu
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#333', fontSize: '14px' }}>
              Trạng thái
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#333', fontSize: '14px' }}>
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody>
          {returns.map((item) => {
            const status = statusConfig[item.status];
            return (
              <tr key={item.returnRequestId} style={{ borderTop: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#333' }}>
                  {item.orderCode}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>
                  {reasonLabels[item.reason] || item.reason}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>
                  {item.items?.length || 0} sản phẩm
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>
                  {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: status.bgColor,
                      color: status.color,
                    }}
                  >
                    {status.label}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <button
                    onClick={() => onViewDetail(item)}
                    style={{
                      padding: '8px',
                      background: '#f5f5f5',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Xem chi tiết"
                  >
                    <Eye size={18} color="#666" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
