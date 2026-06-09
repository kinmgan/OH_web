'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Edit3, Eye, Play, Pause, X, Search } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CampaignListItem, CampaignType, CampaignStatus, formatDate, getCampaignTypeLabel } from '@/types/campaign.type';
import { campaignService } from '@/services/campaign.service';
import CampaignStatusBadge from '@/components/campaigns/CampaignStatusBadge';
import { SortableCampaignRow } from '@/components/campaigns/SortableCampaignRow';

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<CampaignType | ''>('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | ''>('');
  const [keyword, setKeyword] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCampaigns = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await campaignService.getCampaigns(
        page,
        10,
        typeFilter || undefined,
        statusFilter || undefined,
        keyword || undefined
      );

      setCampaigns(response.content.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách chiến dịch');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, [typeFilter, statusFilter, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadCampaigns();
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      await campaignService.deleteCampaign(id);
      setDeleteId(null);
      loadCampaigns();
    } catch (err) {
      setError('Không thể xóa chiến dịch');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleQuickStatusChange = async (id: number, newStatus: CampaignStatus) => {
    try {
      await campaignService.updateCampaignStatus(id, { status: newStatus });
      loadCampaigns();
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật trạng thái');
      console.error(err);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = campaigns.findIndex((camp) => camp.id.toString() === active.id);
    const newIndex = campaigns.findIndex((camp) => camp.id.toString() === over.id);

    const newCampaigns = arrayMove(campaigns, oldIndex, newIndex);
    setCampaigns(newCampaigns);

    try {
      const updatePromises = newCampaigns.map(async (camp, idx) => {
        if (camp.displayOrder !== idx) {
          const fullCampaign = await campaignService.getCampaign(camp.id);
          return campaignService.updateCampaign(camp.id, {
            name: fullCampaign.name,
            description: fullCampaign.description,
            type: fullCampaign.type,
            startDate: fullCampaign.startDate,
            endDate: fullCampaign.endDate,
            scheduledAt: fullCampaign.scheduledAt,
            displayOrder: idx,
            status: fullCampaign.status,
            items: fullCampaign.items.map(item => ({
              productVariantId: item.productVariantId,
              discountType: item.discountType,
              discountValue: item.discountValue,
              displayOrder: item.displayOrder,
            })),
          });
        }
        return Promise.resolve();
      });
      await Promise.all(updatePromises);
      loadCampaigns();
    } catch (err: any) {
      setError(err.message || 'Không thể lưu thứ tự mới');
      console.error(err);
      loadCampaigns(); // Revert on error
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#333' }}>Chiến dịch</h1>
        <button
          onClick={() => router.push('/chien-dich/tao')}
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
          Tạo chiến dịch
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: '24px',
        }}
      >
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Search */}
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#666' }}>
              Tìm kiếm
            </label>
            <div style={{ position: 'relative' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#999',
                }}
              />
              <input
                type="text"
                placeholder="Tên chiến dịch..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          {/* Type Filter */}
          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#666' }}>
              Loại
            </label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as CampaignType | '');
                setPage(0);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              <option value="">Tất cả</option>
              <option value="WEB">Web</option>
              <option value="EMAIL">Email</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#666' }}>
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as CampaignStatus | '');
                setPage(0);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              <option value="">Tất cả</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="SCHEDULED">Đã lên lịch</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="COMPLETED">Đã kết thúc</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            style={{
              padding: '10px 24px',
              background: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: '#ffebee',
            border: '1px solid #ffcdd2',
            borderRadius: '8px',
            color: '#c62828',
            marginBottom: '24px',
          }}
        >
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: '12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#c62828',
              fontWeight: 500,
            }}
          >
            Đóng
          </button>
        </div>
      )}

      {/* Table */}
      <div
        style={{
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>Đang tải...</div>
        ) : campaigns.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
            Chưa có chiến dịch nào.
          </div>
        ) : (
          <>
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#666' }}>Tên chiến dịch</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#666' }}>Loại</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#666' }}>Trạng thái</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#666' }}>Thời gian</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, fontSize: '13px', color: '#666' }}>Sản phẩm</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, fontSize: '13px', color: '#666' }}>Thứ tự</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, fontSize: '13px', color: '#666' }}>Thao tác</th>
                  </tr>
                </thead>
                <SortableContext 
                  items={campaigns.map(c => c.id.toString())}
                  strategy={verticalListSortingStrategy}
                >
                  <tbody>
                    {campaigns.map((campaign) => (
                      <SortableCampaignRow
                        key={campaign.id}
                        campaign={campaign}
                        onView={(id) => router.push(`/chien-dich/${id}`)}
                        onStatusChange={handleQuickStatusChange}
                        onDelete={(id) => setDeleteId(id)}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </DndContext>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #f0f0f0',
                }}
              >
                <div style={{ fontSize: '13px', color: '#666' }}>
                  Hiển thị {page * 10 + 1} - {Math.min((page + 1) * 10, totalElements)} trong tổng {totalElements}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    style={{
                      padding: '8px 12px',
                      background: page === 0 ? '#f5f5f5' : '#fff',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: page === 0 ? 'not-allowed' : 'pointer',
                      color: page === 0 ? '#ccc' : '#333',
                    }}
                  >
                    Trước
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        style={{
                          padding: '8px 12px',
                          background: page === pageNum ? '#A57322' : '#fff',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: page === pageNum ? '#fff' : '#333',
                        }}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    style={{
                      padding: '8px 12px',
                      background: page >= totalPages - 1 ? '#f5f5f5' : '#fff',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                      color: page >= totalPages - 1 ? '#ccc' : '#333',
                    }}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Xác nhận xóa</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
              Bạn có chắc chắn muốn xóa chiến dịch này? Hành động này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                style={{
                  padding: '10px 20px',
                  background: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                }}
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                style={{
                  padding: '10px 20px',
                  background: '#c62828',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.7 : 1,
                }}
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
