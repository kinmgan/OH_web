import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, Play, Trash2, GripVertical, Send } from 'lucide-react';
import { CampaignListItem, CampaignStatus, formatDate, formatDateTime, getCampaignTypeLabel } from '@/types/campaign.type';
import CampaignStatusBadge from './CampaignStatusBadge';

interface Props {
  campaign: CampaignListItem;
  onView: (id: number) => void;
  onStatusChange: (id: number, status: CampaignStatus) => void;
  onDelete: (id: number) => void;
}

export function SortableCampaignRow({ campaign, onView, onStatusChange, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: campaign.id.toString() });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
    background: isDragging ? '#f9f9f9' : 'transparent',
  };

  return (
    <tr ref={setNodeRef} style={style}>
      <td style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            {...attributes} 
            {...listeners} 
            style={{ cursor: 'grab', color: '#ccc', display: 'flex', alignItems: 'center' }}
          >
            <GripVertical size={16} />
          </div>
          <div style={{ fontWeight: 500, fontSize: '14px' }}>{campaign.name}</div>
        </div>
      </td>
      <td style={{ padding: '16px' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 500,
            background: campaign.type === 'WEB' ? '#e3f2fd' : '#fce4ec',
            color: campaign.type === 'WEB' ? '#1565c0' : '#c2185b',
          }}
        >
          {getCampaignTypeLabel(campaign.type)}
        </span>
      </td>
      <td style={{ padding: '16px' }}>
        <CampaignStatusBadge status={campaign.status} />
      </td>
      <td style={{ padding: '16px', fontSize: '13px', color: '#666' }}>
        {campaign.type === 'EMAIL' ? (
          <div>Gửi lúc: {campaign.scheduledAt ? formatDateTime(campaign.scheduledAt) : 'Ngay khi kích hoạt'}</div>
        ) : (
          <>
            <div>Bắt đầu: {formatDate(campaign.startDate)}</div>
            <div>Kết thúc: {formatDate(campaign.endDate)}</div>
          </>
        )}
      </td>
      <td style={{ padding: '16px', textAlign: 'center', fontWeight: 500 }}>
        {campaign.type === 'EMAIL' && campaign.totalSent != null ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#2e7d32', fontSize: '13px' }}>
            <Send size={14} />
            {campaign.totalSent.toLocaleString('vi-VN')}
          </div>
        ) : (
          campaign.itemCount
        )}
      </td>
      <td style={{ padding: '16px', textAlign: 'center' }}>
        <span style={{
          display: 'inline-block',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 600,
          background: '#e3f2fd',
          color: '#1565c0',
        }}>
          {campaign.displayOrder ?? 0}
        </span>
      </td>
      <td style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button
            onClick={() => onView(campaign.id)}
            title="Xem chi tiết"
            style={{
              padding: '8px',
              background: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#666',
            }}
          >
            <Eye size={16} />
          </button>

          {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') && (
            <button
              onClick={() => onStatusChange(campaign.id, 'ACTIVE')}
              title={campaign.type === 'EMAIL' ? 'Kích hoạt & gửi email' : 'Kích hoạt'}
              style={{
                padding: '8px',
                background: '#e8f5e9',
                border: '1px solid #c8e6c9',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#2e7d32',
              }}
            >
              <Play size={16} />
            </button>
          )}

          <button
            onClick={() => onDelete(campaign.id)}
            title="Xóa"
            style={{
              padding: '8px',
              background: '#ffebee',
              border: '1px solid #ffcdd2',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#c62828',
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}
