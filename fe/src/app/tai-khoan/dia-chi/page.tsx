'use client';

import { useEffect, useState } from 'react';
import { addressService } from '@/services/address.service';
import { UserAddress } from '@/types/address.type';

// GHN Master Data types
interface GhnProvince {
  ProvinceID: number;
  ProvinceName: string;
}

interface GhnDistrict {
  DistrictID: number;
  DistrictName: string;
}

interface GhnWard {
  WardCode: string;
  WardName: string;
}

const GHN_TOKEN = process.env.NEXT_PUBLIC_GHN_TOKEN || '';
const GHN_BASE = 'https://dev-online-gateway.ghn.vn/shiip/public-api/master-data';

export default function AddressPage() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);

  const [provinces, setProvinces] = useState<GhnProvince[]>([]);
  const [districts, setDistricts] = useState<GhnDistrict[]>([]);
  const [wards, setWards] = useState<GhnWard[]>([]);
  
  // States cho form (cả edit và add mới)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState<Partial<UserAddress>>({});

  useEffect(() => {
    fetchAddresses();
    fetchProvinces();
  }, []);

  const fetchAddresses = async () => {
    try {
      const data = await addressService.getUserAddresses();
      setAddresses(data);
    } catch (error) {
      console.error('Failed to fetch addresses', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProvinces = async () => {
    try {
      const res = await fetch(`${GHN_BASE}/province`, {
        headers: { 'Token': GHN_TOKEN }
      });
      const json = await res.json();
      setProvinces(json.data || []);
    } catch (error) {
      console.error('Failed to fetch provinces from GHN', error);
    }
  };

  const fetchDistricts = async (provinceId: number) => {
    try {
      const res = await fetch(`${GHN_BASE}/district`, {
        method: 'POST',
        headers: { 'Token': GHN_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ province_id: provinceId })
      });
      const json = await res.json();
      setDistricts(json.data || []);
      setWards([]);
    } catch (error) {
      console.error('Failed to fetch districts from GHN', error);
    }
  };

  const fetchWards = async (districtId: number) => {
    try {
      const res = await fetch(`${GHN_BASE}/ward`, {
        method: 'POST',
        headers: { 'Token': GHN_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ district_id: districtId })
      });
      const json = await res.json();
      setWards(json.data || []);
    } catch (error) {
      console.error('Failed to fetch wards from GHN', error);
    }
  };

  const handleEditClick = (addr: UserAddress) => {
    setEditingId(addr.id!);
    setIsAdding(false);
    setFormData(addr);
  };

  const handleAddClick = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      receiverName: '',
      phoneNumber: '',
      detailedAddress: '',
      provinceId: 0,
      provinceName: '',
      districtId: 0,
      districtName: '',
      wardCode: '',
      wardName: ''
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({});
  };

  const handleSave = async () => {
    if (!formData.receiverName || !formData.phoneNumber || !formData.provinceId || !formData.districtId || !formData.wardCode || !formData.detailedAddress) {
      alert("Vui lòng điền đủ thông tin bắt buộc.");
      return;
    }

    try {
      if (isAdding) {
        await addressService.addAddress(formData as UserAddress);
      } else if (editingId) {
        await addressService.updateAddress(editingId, formData as UserAddress);
      }
      handleCancel();
      fetchAddresses();
    } catch (e) {
      console.error(e);
      alert("Có lỗi xảy ra khi lưu địa chỉ.");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Chắc chắn xóa địa chỉ này?")) {
      try {
        await addressService.deleteAddress(id);
        fetchAddresses();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await addressService.setDefault(id);
      fetchAddresses();
      if (editingId === id) {
        handleCancel();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const update = { ...formData, [name]: value };

    if (name === 'provinceId') {
      const p = provinces.find(x => x.ProvinceID === Number(value));
      update.provinceId = Number(value);
      update.provinceName = p?.ProvinceName || '';
      update.districtId = 0;
      update.districtName = '';
      update.wardCode = '';
      update.wardName = '';
      if (Number(value)) fetchDistricts(Number(value));
    } else if (name === 'districtId') {
      const d = districts.find(x => x.DistrictID === Number(value));
      update.districtId = Number(value);
      update.districtName = d?.DistrictName || '';
      update.wardCode = '';
      update.wardName = '';
      if (Number(value)) fetchWards(Number(value));
    } else if (name === 'wardCode') {
      const w = wards.find(x => x.WardCode === value);
      update.wardCode = value;
      update.wardName = w?.WardName || '';
    }

    setFormData(update);
  };

  // Districts and wards are loaded into state on cascade — no need to derive from provinces

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải...</div>;

  const defaultAddr = addresses.find(a => a.isDefault);
  const otherAddrs = addresses.filter(a => !a.isDefault);

  const renderForm = (isNew: boolean) => (
    <div className="mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block mb-2 font-medium text-[#333333]">Tên người nhận</label>
          <input
            name="receiverName"
            value={formData.receiverName || ''}
            onChange={handleChange}
            className="w-full p-3 rounded-sm border-none bg-[#F9F9F9] focus:outline-none focus:ring-1 focus:ring-[#A57322] transition-all text-gray-700 placeholder-gray-400"
            placeholder="Tên người nhận"
          />
        </div>
        <div>
          <label className="block mb-2 font-medium text-[#333333]">Số điện thoại</label>
          <input
            name="phoneNumber"
            value={formData.phoneNumber || ''}
            onChange={handleChange}
            className="w-full p-3 rounded-sm border-none bg-[#F9F9F9] focus:outline-none focus:ring-1 focus:ring-[#A57322] transition-all text-gray-700 placeholder-gray-400"
            placeholder="Số điện thoại"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block mb-2 font-medium text-[#333333]">Tên đường, số nhà</label>
        <input
          name="detailedAddress"
          value={formData.detailedAddress || ''}
          onChange={handleChange}
          className="w-full p-3 rounded-sm border-none bg-[#F9F9F9] focus:outline-none focus:ring-1 focus:ring-[#A57322] transition-all text-gray-700 placeholder-gray-400"
          placeholder="Tên đường, số nhà"
        />
      </div>

      <div className="mb-6">
        <label className="block mb-2 font-medium text-[#333333]">Thành phố, phường xã</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <select
              name="provinceId"
              value={formData.provinceId || 0}
              onChange={handleChange}
              className="w-full p-3 rounded-sm border-none bg-[#F9F9F9] focus:outline-none focus:ring-1 focus:ring-[#A57322] transition-all text-gray-600 appearance-none"
            >
              <option value={0}>Chọn Tỉnh/Thành phố</option>
              {provinces.map(p => (
                <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>
              ))}
            </select>
            <select
              name="districtId"
              value={formData.districtId || 0}
              onChange={handleChange}
              className="w-full p-3 rounded-sm border-none bg-[#F9F9F9] focus:outline-none focus:ring-1 focus:ring-[#A57322] transition-all text-gray-600 appearance-none"
              disabled={!formData.provinceId}
            >
              <option value={0}>Chọn Quận/Huyện</option>
              {districts.map(d => (
                <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>
              ))}
            </select>
            <select
              name="wardCode"
              value={formData.wardCode || ''}
              onChange={handleChange}
              className="w-full p-3 rounded-sm border-none bg-[#F9F9F9] focus:outline-none focus:ring-1 focus:ring-[#A57322] transition-all text-gray-600 appearance-none"
              disabled={!formData.districtId}
            >
              <option value="">Chọn Phường/Xã</option>
              {wards.map(w => (
                <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>
              ))}
            </select>
        </div>
      </div>

      <div className="flex justify-between items-center mt-10">
        <div>
          {!isNew && editingId && (
            <button
              onClick={() => handleSetDefault(editingId)}
              className="px-6 py-3 border border-[#666] outline-none rounded-sm bg-white cursor-pointer font-medium text-[#333] hover:bg-gray-50 transition-colors"
            >
              Đặt làm mặc định
            </button>
          )}
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={handleCancel}
            className="border-none bg-transparent cursor-pointer font-medium text-[#333] hover:text-[#000] transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-3 border-none rounded-sm bg-[#A57322] text-white cursor-pointer font-medium hover:bg-[#8f631d] transition-colors"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {/* KHỐI ĐỊA CHỈ MẶC ĐỊNH */}
      {defaultAddr && (
        <div className="mb-10">
          <h2 className="text-[18px] font-semibold text-[#A57322] mb-6">Địa chỉ mặc định</h2>
          {editingId === defaultAddr.id ? (
             renderForm(false) 
          ) : (
            <div className="bg-[#F9F9F9] p-6 rounded-sm flex justify-between items-start">
              <div>
                <div className="text-[16px] text-[#666666] mb-1">{defaultAddr.receiverName}</div>
                <div className="text-[16px] text-[#666666] mb-1">{defaultAddr.phoneNumber}</div>
                <div className="text-[16px] text-[#666666]">
                  {defaultAddr.detailedAddress}, {defaultAddr.wardName}, {defaultAddr.districtName}, {defaultAddr.provinceName}
                </div>
              </div>
              <button
                onClick={() => handleEditClick(defaultAddr)}
                className="bg-transparent border-none cursor-pointer text-[#A57322] hover:opacity-80 transition-opacity mt-2"
                title="Chỉnh sửa"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* DANH SÁCH ĐỊA CHỈ KHÁC */}
      {otherAddrs.map((addr, index) => (
        <div key={addr.id!} className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[18px] font-semibold text-[#A57322]">Địa chỉ {index + 1}</h2>
            {editingId !== addr.id && (
              <button
                onClick={() => handleDelete(addr.id!)}
                className="bg-transparent border-none cursor-pointer text-[#A57322] hover:text-red-500 transition-colors"
                title="Xóa"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>
          
          {editingId === addr.id ? (
             renderForm(false) 
          ) : (
            <div className="bg-[#F9F9F9] p-6 rounded-sm flex justify-between items-start">
              <div>
                <div className="text-[16px] text-[#666666] mb-1">{addr.receiverName}</div>
                <div className="text-[16px] text-[#666666] mb-1">{addr.phoneNumber}</div>
                <div className="text-[16px] text-[#666666]">
                  {addr.detailedAddress}, {addr.wardName}, {addr.districtName}, {addr.provinceName}
                </div>
              </div>
              <button
                onClick={() => handleEditClick(addr)}
                className="bg-transparent border-none cursor-pointer text-[#A57322] hover:opacity-80 transition-opacity mt-2"
                title="Chỉnh sửa"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
            </div>
          )}
        </div>
      ))}

      {/* THÊM ĐỊA CHỈ */}
      {isAdding ? (
        <div className="mb-10">
          <h2 className="text-[18px] font-semibold text-[#A57322] mb-6">Thêm địa chỉ mới</h2>
          {renderForm(true)}
        </div>
      ) : (
        <div className="flex justify-center mt-12 mb-8">
          <button
            onClick={handleAddClick}
            className="flex items-center gap-2 border-none bg-transparent text-[#1A1A1A] font-semibold text-[16px] cursor-pointer hover:text-[#A57322] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A57322" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Thêm địa chỉ
          </button>
        </div>
      )}
    </div>
  );
}
