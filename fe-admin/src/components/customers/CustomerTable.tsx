'use client';

import { useEffect, useState } from 'react';
import { Edit3, Trash2, Search, Activity } from 'lucide-react';
import { Customer, CustomerUpdateRequest } from '@/types/customer.type';
import { customerAdminService } from '@/services/customer.service';
import CustomerHealthDetailModal from './CustomerHealthDetailModal';

export default function CustomerTable() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerUpdateRequest>({
    fullName: '',
    email: '',
    phoneNumber: '',
  });
  const [saving, setSaving] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, keyword]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await customerAdminService.getCustomers(currentPage, 10, keyword);
      setCustomers(response.items);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(0);
    setKeyword(searchTerm);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      fullName: customer.fullName,
      email: customer.email,
      phoneNumber: customer.phoneNumber ?? '',
    });
  };

  const closeEditModal = () => {
    setEditingCustomer(null);
    setForm({ fullName: '', email: '', phoneNumber: '' });
  };

  const handleUpdateCustomer = async () => {
    if (!editingCustomer) return;
    setSaving(true);
    try {
      await customerAdminService.updateCustomer(editingCustomer.id, form);
      await fetchCustomers();
      closeEditModal();
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Cập nhật khách hàng thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    const isConfirmed = window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?');
    if (!isConfirmed) return;

    try {
      await customerAdminService.deleteCustomer(id);
      await fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Xóa khách hàng thất bại. Có thể khách hàng đã phát sinh đơn hàng.');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Đang tải...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            padding: '0 12px',
            background: '#fff',
          }}
        >
          <Search size={16} color="#777" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, email, số điện thoại"
            style={{ border: 'none', outline: 'none', height: '40px', width: '280px' }}
          />
        </div>
        <button
          onClick={handleSearch}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderRadius: '6px',
            background: '#A57322',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Tìm kiếm
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #eee' }}>
              <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#666' }}>Tên khách hàng</th>
              <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#666' }}>Email</th>
              <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#666' }}>Số điện thoại</th>
              <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#666' }}>Đơn hàng</th>
              <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#666' }}>Tổng chi tiêu</th>
              <th style={{ textAlign: 'center', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#666' }}>Sức khỏe</th>
              <th style={{ textAlign: 'center', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#666' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '28px', color: '#999' }}>
                  Không có khách hàng
                </td>
              </tr>
            )}
            {customers.map((customer) => (
              <tr key={customer.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#333' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#A57322',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 700,
                      }}
                    >
                      {customer.fullName.charAt(0)}
                    </div>
                    {customer.fullName}
                  </div>
                </td>
                <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>{customer.email}</td>
                <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>{customer.phoneNumber || '-'}</td>
                <td style={{ padding: '16px', fontSize: '14px', color: '#333' }}>{customer.orderCount}</td>
                <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#A57322' }}>
                  {Number(customer.totalSpent || 0).toLocaleString('vi-VN')} đ
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <button
                    onClick={() => setViewingCustomer({ id: customer.id, name: customer.fullName })}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#4CAF50',
                      padding: '6px',
                      borderRadius: '6px',
                      transition: 'background 0.2s',
                    }}
                    title="Xem hồ sơ sức khỏe"
                  >
                    <Activity size={18} />
                  </button>
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => openEditModal(customer)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A57322' }}
                      title="Sửa khách hàng"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f' }}
                      title="Xóa khách hàng"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx)}
              style={{
                padding: '8px 12px',
                background: currentPage === idx ? '#A57322' : '#f5f5f5',
                color: currentPage === idx ? '#fff' : '#444',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      )}

      {editingCustomer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div style={{ width: '100%', maxWidth: '520px', background: '#fff', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ margin: 0, marginBottom: '16px', fontSize: '20px', color: '#333' }}>Cập nhật khách hàng</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <input
                value={form.fullName}
                onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder="Họ và tên"
                style={{ height: '40px', border: '1px solid #ddd', borderRadius: '6px', padding: '0 12px' }}
              />
              <input
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email"
                style={{ height: '40px', border: '1px solid #ddd', borderRadius: '6px', padding: '0 12px' }}
              />
              <input
                value={form.phoneNumber || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="Số điện thoại"
                style={{ height: '40px', border: '1px solid #ddd', borderRadius: '6px', padding: '0 12px' }}
              />
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={closeEditModal}
                style={{
                  border: '1px solid #ddd',
                  background: '#fff',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateCustomer}
                disabled={saving}
                style={{
                  border: 'none',
                  background: '#A57322',
                  color: '#fff',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingCustomer && (
        <CustomerHealthDetailModal
          isOpen={true}
          onClose={() => setViewingCustomer(null)}
          customerId={viewingCustomer.id}
          customerName={viewingCustomer.name}
        />
      )}
    </div>
  );
}
