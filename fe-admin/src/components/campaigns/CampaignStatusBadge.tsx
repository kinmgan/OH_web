'use client';

import { CampaignStatus } from '@/types/campaign.type';

interface CampaignStatusBadgeProps {
  status: CampaignStatus;
}

const statusConfig: Record<CampaignStatus, { bg: string; color: string; label: string }> = {
  DRAFT: { bg: '#f5f5f5', color: '#666', label: 'Bản nháp' },
  SCHEDULED: { bg: '#e3f2fd', color: '#1565c0', label: 'Đã lên lịch' },
  ACTIVE: { bg: '#e8f5e9', color: '#2e7d32', label: 'Đang hoạt động' },
  COMPLETED: { bg: '#f3e5f5', color: '#7b1fa2', label: 'Đã kết thúc' },
  CANCELLED: { bg: '#ffebee', color: '#c62828', label: 'Đã hủy' },
};

export default function CampaignStatusBadge({ status }: CampaignStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.DRAFT;

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500,
        background: config.bg,
        color: config.color,
      }}
    >
      {config.label}
    </span>
  );
}
