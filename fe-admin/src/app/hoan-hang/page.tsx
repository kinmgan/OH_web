'use client';

import { useState, useEffect } from 'react';
import { ReturnResponse, ReturnStatus } from '@/types/return.type';
import { returnService } from '@/services/return.service';
import ReturnTable from '@/components/returns/ReturnTable';
import ReturnDetailModal from '@/components/returns/ReturnDetailModal';

const statusFilters: { value: ReturnStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'RECEIVED', label: 'Đã nhận hàng' },
  { value: 'REFUNDED', label: 'Đã hoàn tiền' },
];

export default function HoanHangPage() {
  const [returns, setReturns] = useState<ReturnResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<ReturnStatus | 'ALL'>('ALL');
  const [selectedReturn, setSelectedReturn] = useState<ReturnResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const result = selectedStatus === 'ALL'
        ? await returnService.getAll(page)
        : await returnService.getByStatus(selectedStatus, page);
      setReturns(result.items);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error fetching returns:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [page, selectedStatus]);

  const handleStatusChange = (newStatus: ReturnStatus | 'ALL') => {
    setSelectedStatus(newStatus);
    setPage(0);
  };

  const handleViewDetail = (returnItem: ReturnResponse) => {
    setSelectedReturn(returnItem);
    setShowDetailModal(true);
  };

  const handleRefresh = () => {
    fetchReturns();
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#333', marginBottom: '8px' }}>
          Quản lý hoàn hàng
        </h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Xem và xử lý các yêu cầu hoàn hàng từ khách hàng
        </p>
      </div>

      {/* Status Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => handleStatusChange(filter.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: selectedStatus === filter.value ? '#A57322' : '#ddd',
              background: selectedStatus === filter.value ? '#A57322' : '#fff',
              color: selectedStatus === filter.value ? '#fff' : '#333',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <ReturnTable
        returns={returns}
        loading={loading}
        onViewDetail={handleViewDetail}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              background: '#fff',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              opacity: page === 0 ? 0.5 : 1,
            }}
          >
            Trang trước
          </button>
          <span style={{ padding: '8px 16px', color: '#666' }}>
            Trang {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              background: '#fff',
              cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
              opacity: page >= totalPages - 1 ? 0.5 : 1,
            }}
          >
            Trang sau
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedReturn && (
        <ReturnDetailModal
          returnItem={selectedReturn}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}
