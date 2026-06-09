'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CartItemResponse } from '@/types/cart.type';
import { addressService } from '@/services/address.service';
import { UserAddress } from '@/types/address.type';
import { orderService } from '@/services/order.service';
import { OrderRequest, ShippingCarrier } from '@/types/order.type';
import { CartService } from '@/services/cart.service';
import { shippingService } from '@/services/shipping.service';
import { ShippingEstimate } from '@/types/shipping.type';
import Breadcrumb from '@/components/common/Breadcrumb';
import { X, Ticket, CheckCircle2 } from 'lucide-react';

// GHN Master Data types
interface GhnProvince { ProvinceID: number; ProvinceName: string; }
interface GhnDistrict { DistrictID: number; DistrictName: string; }
interface GhnWard { WardCode: string; WardName: string; }

const GHN_TOKEN = process.env.NEXT_PUBLIC_GHN_TOKEN || '';
const GHN_BASE = 'https://dev-online-gateway.ghn.vn/shiip/public-api/master-data';

export default function CheckoutPage() {
  const router = useRouter();
  const [checkoutItems, setCheckoutItems] = useState<CartItemResponse[]>([]);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  
  // Checkout selections
  const [paymentMethod, setPaymentMethod] = useState<string>('COD');

  // Shipping Estimates
  const [shippingEstimates, setShippingEstimates] = useState<ShippingEstimate[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<ShippingCarrier>('GHN');
  const [loadingShipping, setLoadingShipping] = useState(false);

  // Address Form States
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [provinces, setProvinces] = useState<GhnProvince[]>([]);
  const [districts, setDistricts] = useState<GhnDistrict[]>([]);
  const [wards, setWards] = useState<GhnWard[]>([]);
  const [formData, setFormData] = useState<Partial<UserAddress>>({});

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('checkoutItems');
    if (!stored) {
      router.push('/gio-hang');
      return;
    }
    try {
      const items = JSON.parse(stored);
      setCheckoutItems(items);
      // Sử dụng finalPrice nếu có discount, không thì dùng price
      const initialSubtotal = items.reduce((sum: number, item: any) => {
        const itemPrice = item.finalPrice || item.price;
        return sum + itemPrice * item.quantity;
      }, 0);
    } catch (e) {
      router.push('/gio-hang');
    }
  }, [router]);

  useEffect(() => {
    fetchAddresses();
    fetchProvinces();
  }, []);

  // Fetch shipping estimates when address is selected
  useEffect(() => {
    if (selectedAddress?.id && checkoutItems.length > 0) {
      fetchShippingEstimates();
    }
  }, [selectedAddress, checkoutItems]);

  const fetchShippingEstimates = async () => {
    setLoadingShipping(true);
    try {
      const estimates = await shippingService.estimateShipping(
        selectedAddress!.id!,
        checkoutItems.map(item => ({
          productVariantId: item.productVariantId,
          quantity: item.quantity
        }))
      );
      setShippingEstimates(estimates);
      if (estimates.length > 0) {
        const ghnEstimate = estimates.find(e => e.carrier === 'GHN');
        setSelectedCarrier((ghnEstimate?.carrier || estimates[0].carrier) as ShippingCarrier);
      }
    } catch (error) {
      console.error('Failed to fetch shipping estimates', error);
    } finally {
      setLoadingShipping(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const data = await addressService.getUserAddresses();
      setAddresses(data);
      const defaultAddr = data.find(a => a.isDefault) || data[0];
      if (defaultAddr) setSelectedAddress(defaultAddr);
    } catch (error) {
      console.error('Failed to fetch addresses', error);
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



  const calculateTotal = () => {
    // Sử dụng finalPrice nếu có discount, không thì dùng price
    const subtotal = checkoutItems.reduce((sum, item) => {
      const itemPrice = item.finalPrice || item.price;
      return sum + itemPrice * item.quantity;
    }, 0);
    
    const selectedEstimate = shippingEstimates.find(e => e.carrier === selectedCarrier);
    const shippingFee = selectedEstimate?.fee ?? 30000;
    const total = subtotal + shippingFee;
    return { subtotal, shippingFee, discount: 0, total: Math.max(0, total) };
  };

  const handleCreateOrder = async () => {
    if (!selectedAddress || !selectedAddress.id) {
      alert("Vui lòng chọn hoặc thêm địa chỉ giao hàng.");
      return;
    }

    setLoading(true);
    try {
      const req: OrderRequest = {
        addressId: selectedAddress.id,
        paymentMethod,
        items: checkoutItems.map(item => ({
          productVariantId: item.productVariantId,
          quantity: item.quantity
        })),
        shippingCarrier: selectedCarrier
      };

      const res = await orderService.createOrder(req);
      
      // Xoá các sản phẩm checkout ra khỏi giỏ
      try {
        await Promise.all(checkoutItems.map(item => CartService.removeItem(item.cartItemId)));
      } catch (err) {
        console.error("Xoá cart item lỗi", err);
      }

      sessionStorage.removeItem('checkoutItems');

      if (paymentMethod === 'COD') {
        router.push(`/dat-hang/${res.orderId}/thanh-toan/result?status=success&orderId=${res.orderId}`);
      } else {
        sessionStorage.setItem('pendingOrder', JSON.stringify(res));
        router.push(`/dat-hang/${res.orderId}/thanh-toan`);
      }
    } catch (error: any) {
      console.error("Order creation error:", error);
      alert("Đặt hàng thất bại, vui lòng thử lại. Lỗi: " + (error?.message || error?.toString() || "Unknown"));
    } finally {
      setLoading(false);
    }
  };

  // --- Address Form Handlers ---
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let update: any = { ...formData, [name]: value };

    if (name === 'provinceId') {
      const p = provinces.find(x => x.ProvinceID === Number(value));
      update = { ...update, provinceId: Number(value), provinceName: p?.ProvinceName || '', districtId: 0, districtName: '', wardCode: '', wardName: '' };
      if (Number(value)) fetchDistricts(Number(value));
    } else if (name === 'districtId') {
      const d = districts.find(x => x.DistrictID === Number(value));
      update = { ...update, districtId: Number(value), districtName: d?.DistrictName || '', wardCode: '', wardName: '' };
      if (Number(value)) fetchWards(Number(value));
    } else if (name === 'wardCode') {
      const w = wards.find(x => x.WardCode === value);
      update = { ...update, wardCode: value, wardName: w?.WardName || '' };
    }
    setFormData(update);
  };

  const handleSaveAddress = async () => {
    if (!formData.receiverName || !formData.phoneNumber || !formData.provinceId || !formData.districtId || !formData.wardCode || !formData.detailedAddress) {
      alert("Vui lòng điền đủ thông tin bắt buộc.");
      return;
    }

    // Phone regex validation
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}\b/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      alert("Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.");
      return;
    }

    try {
      const newAddr = await addressService.addAddress(formData as UserAddress);
      setAddresses([...addresses, newAddr]);
      setSelectedAddress(newAddr);
      setIsAddingAddress(false);
      setFormData({});
    } catch (e) {
      alert("Có lỗi xảy ra khi lưu địa chỉ.");
    }
  };

  const { subtotal, shippingFee, discount, total } = calculateTotal();

  return (
    <div style={{ minHeight: '100vh', background: '#fdfbf7', paddingBottom: '40px', fontFamily: 'var(--font-be-vietnam), sans-serif', color: '#333' }}>
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Giỏ hàng', href: '/gio-hang' }, { label: 'Đặt hàng' }]} />

      <div style={{ maxWidth: '1050px', margin: '40px auto 0', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 6fr)', gap: '40px' }}>
          
          {/* Cột trái: Thông tin giao hàng */}
          <div style={{ background: '#fff', padding: '32px 40px', borderRadius: '4px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '32px', textAlign: 'center' }}>Thông tin giao hàng</h3>
            
            {!isAddingAddress ? (
              <>
                {selectedAddress ? (
                  <div>
                    {/* Style inputs like the screenshot: grayish backgrounds, borderless mostly, labels on top */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Tên người nhận</label>
                      <div style={{ width: '100%', padding: '14px 16px', background: '#f5f5f5', borderRadius: '4px', border: '1px solid transparent', fontSize: '14px', color: '#666' }}>
                        {selectedAddress.receiverName}
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Số điện thoại</label>
                      <div style={{ width: '100%', padding: '14px 16px', background: '#f5f5f5', borderRadius: '4px', border: '1px solid transparent', fontSize: '14px', color: '#666' }}>
                        {selectedAddress.phoneNumber}
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Tên đường, số nhà</label>
                      <div style={{ width: '100%', padding: '14px 16px', background: '#f5f5f5', borderRadius: '4px', border: '1px solid transparent', fontSize: '14px', color: '#666' }}>
                        {selectedAddress.detailedAddress}
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Thành phố</label>
                      <div style={{ width: '100%', padding: '14px 16px', background: '#f5f5f5', borderRadius: '4px', border: '1px solid transparent', fontSize: '14px', color: '#666' }}>
                        {selectedAddress.provinceName}
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Quận huyện</label>
                      <div style={{ width: '100%', padding: '14px 16px', background: '#f5f5f5', borderRadius: '4px', border: '1px solid transparent', fontSize: '14px', color: '#666' }}>
                        {selectedAddress.districtName}
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '32px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Phường xã</label>
                      <div style={{ width: '100%', padding: '14px 16px', background: '#f5f5f5', borderRadius: '4px', border: '1px solid transparent', fontSize: '14px', color: '#666' }}>
                        {selectedAddress.wardName}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'space-between' }}>
                      <button onClick={() => setIsAddressModalOpen(true)} style={{ flex: 1, padding: '14px 0', border: '1px solid #ccc', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>
                        Đổi địa chỉ
                      </button>
                      <button onClick={() => setIsAddingAddress(true)} style={{ flex: 1, padding: '14px 0', border: '1px solid transparent', background: '#A57322', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>
                        Thêm địa chỉ mới
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#d97706', marginBottom: '24px' }}>Bạn chưa có địa chỉ giao hàng.</p>
                    <button onClick={() => setIsAddingAddress(true)} style={{ padding: '14px 32px', border: '1px solid #A57322', background: '#fff', color: '#A57322', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>
                      Thêm địa chỉ mới
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Tên người nhận</label>
                  <input name="receiverName" placeholder="Nhập tên người nhận" value={formData.receiverName || ''} onChange={handleAddressChange} style={{ width: '100%', padding: '14px 16px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', background: '#fff' }} />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Số điện thoại</label>
                  <input name="phoneNumber" placeholder="Nhập số điện thoại" value={formData.phoneNumber || ''} onChange={handleAddressChange} style={{ width: '100%', padding: '14px 16px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', background: '#fff' }} />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Tên đường, số nhà</label>
                  <input name="detailedAddress" placeholder="Nhập tên đường, số nhà" value={formData.detailedAddress || ''} onChange={handleAddressChange} style={{ width: '100%', padding: '14px 16px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', background: '#fff' }} />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Thành phố</label>
                  <select name="provinceId" value={formData.provinceId || 0} onChange={handleAddressChange} style={{ width: '100%', padding: '14px 16px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', background: '#fff', WebkitAppearance: 'none' }}>
                    <option value={0}>Chọn Thành phố</option>
                    {provinces.map(p => <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>)}
                  </select>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                 <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Quận huyện</label>
                  <select name="districtId" value={formData.districtId || 0} onChange={handleAddressChange} style={{ width: '100%', padding: '14px 16px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', background: '#fff', WebkitAppearance: 'none' }}>
                    <option value={0}>Chọn Quận huyện</option>
                    {districts.map(d => <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>)}
                  </select>
                </div>
                
                <div style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Phường xã</label>
                  <select name="wardCode" value={formData.wardCode || ''} onChange={handleAddressChange} style={{ width: '100%', padding: '14px 16px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', background: '#fff', WebkitAppearance: 'none' }}>
                    <option value="">Chọn Phường xã</option>
                    {wards.map(w => <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <button onClick={() => setIsAddingAddress(false)} style={{ flex: 1, padding: '14px 0', border: '1px solid #ccc', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>Hủy</button>
                  <button onClick={handleSaveAddress} style={{ flex: 1, padding: '14px 0', border: 'none', background: '#A57322', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>Lưu địa chỉ</button>
                </div>
              </div>
            )}
          </div>

          {/* Cột phải: Thông tin thanh toán */}
          <div style={{ alignSelf: 'start' }}>
            <div style={{ background: '#fff', padding: '32px 40px', borderRadius: '4px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', marginBottom: '32px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                {checkoutItems.map(item => {
                  const itemPrice = item.finalPrice || item.price;
                  const hasDiscount = item.discountAmount && item.discountAmount > 0;
                  return (
                    <div key={item.cartItemId} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <img src={item.imageUrl} alt={item.productName} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} />
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>{item.productName}</div>
                          {hasDiscount && (
                            <div style={{ fontSize: '12px', color: '#c62828' }}>
                              <span className="line-through text-[#9e9e9e]">{item.originalPrice?.toLocaleString('vi-VN')} đ</span>
                              <span style={{ marginLeft: '8px' }}>-{item.discountType === 'PERCENTAGE' ? `${item.discountValue}%` : item.discountAmount?.toLocaleString('vi-VN')} đ</span>
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: '13px', color: hasDiscount ? '#c62828' : '#666', fontWeight: hasDiscount ? 600 : 400 }}>
                          {itemPrice.toLocaleString('vi-VN')} đ <span style={{ padding: '0 4px' }}>x</span> {item.quantity}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: '1px solid #eee', paddingTop: '24px', borderBottom: '1px solid #eee', paddingBottom: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px', color: '#555' }}>
                  <span>Tổng tiền hàng:</span>
                  <span style={{ fontWeight: 500, color: '#333' }}>{subtotal.toLocaleString('vi-VN')} đ</span>
                </div>
                
                {/* Shipping Carrier Selection */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ marginBottom: '12px', fontWeight: 500, fontSize: '15px' }}>Đơn vị vận chuyển</div>
                  
                  {loadingShipping ? (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#888', background: '#f5f5f5', borderRadius: '6px' }}>
                      Đang tính phí vận chuyển...
                    </div>
                  ) : shippingEstimates.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {shippingEstimates.map(estimate => (
                        <label
                          key={estimate.carrier}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            border: selectedCarrier === estimate.carrier ? '1px solid #A57322' : '1px solid #ddd',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: selectedCarrier === estimate.carrier ? '#fbf8f3' : '#fff',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{
                            width: '18px', height: '18px', borderRadius: '50%',
                            border: selectedCarrier === estimate.carrier ? '5px solid #A57322' : '2px solid #ccc',
                            background: '#fff',
                            flexShrink: 0
                          }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, fontSize: '14px', color: '#333' }}>{estimate.carrierName}</div>
                            <div style={{ fontSize: '12px', color: '#888' }}>
                              {estimate.serviceLabel} • {estimate.estimatedDays} ngày
                            </div>
                          </div>
                          <div style={{ fontWeight: 600, color: '#333' }}>
                            {estimate.fee.toLocaleString('vi-VN')} đ
                          </div>
                          <input
                            type="radio"
                            name="carrier"
                            value={estimate.carrier}
                            checked={selectedCarrier === estimate.carrier}
                            onChange={() => setSelectedCarrier(estimate.carrier as ShippingCarrier)}
                            style={{ display: 'none' }}
                          />
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#d97706', background: '#fef3c7', borderRadius: '6px', fontSize: '14px' }}>
                      Vui lòng chọn địa chỉ giao hàng để xem phí vận chuyển
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px', color: '#555' }}>
                  <span>Phí vận chuyển:</span>
                  <span style={{ fontWeight: 500, color: '#333' }}>{shippingFee.toLocaleString('vi-VN')} đ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#555' }}>
                  <span>Giảm giá:</span>
                  <span style={{ fontWeight: 500, color: '#333' }}>- {discount.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '18px', marginBottom: '32px', color: '#333' }}>
                <span>Tổng cộng:</span>
                <span>{total.toLocaleString('vi-VN')} đ</span>
              </div>

              {/* Phương thức thanh toán - style with custom radios */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ marginBottom: '20px', fontWeight: 500, fontSize: '15px' }}>Phương thức thanh toán</div>
                
                {[
                  { id: 'BANK_TRANSFER', label: 'Chuyển khoản / Bank Transfer', img: '' },
                  { id: 'COD', label: 'Thanh toán khi nhận hàng / Cash on delivery', img: '' },
                  { id: 'MOMO', label: 'MOMO', img: '' },
                  { id: 'VNPAY', label: 'VNPAY', img: '' },
                ].map((pm) => (
                  <label key={pm.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', cursor: 'pointer' }}>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%', border: paymentMethod === pm.id ? '6px solid #333' : '2px solid #ccc',
                      background: '#fff', boxSizing: 'border-box', transition: 'all 0.2s'
                    }}></div>
                    <input type="radio" value={pm.id} checked={paymentMethod === pm.id} onChange={() => setPaymentMethod(pm.id)} style={{ display: 'none' }} />
                    <span style={{ fontSize: '14px' }}>{pm.label}</span>
                  </label>
                ))}
              </div>



              <button 
                onClick={handleCreateOrder} 
                disabled={loading}
                style={{ width: '100%', padding: '16px', background: '#A57322', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                {loading ? 'Đang xử lý...' : 'Đặt hàng'}
              </button>

            </div>
          </div>
        </div>
      </div>

      {/* Address Selection Modal */}
      {isAddressModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {/* Backdrop */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setIsAddressModalOpen(false)}></div>
          
          {/* Modal Content */}
          <div style={{ position: 'relative', width: '90%', maxWidth: '600px', background: '#fff', borderRadius: '8px', padding: '32px', maxHeight: '80vh', overflowY: 'auto', zIndex: 1001, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h4 style={{ fontSize: '20px', fontWeight: 600 }}>Chọn địa chỉ giao hàng</h4>
              <button onClick={() => setIsAddressModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={24} color="#666" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {addresses.map(addr => {
                const isSelected = selectedAddress?.id === addr.id;
                return (
                  <div 
                    key={addr.id} 
                    onClick={() => {
                      setSelectedAddress(addr);
                      setIsAddressModalOpen(false);
                    }}
                    style={{ 
                      padding: '20px', 
                      border: isSelected ? '2px solid #A57322' : '1px solid #ddd', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'flex-start',
                      background: isSelected ? '#fbf8f3' : '#fff'
                    }}
                  >
                    <div style={{ marginTop: '2px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: isSelected ? '6px solid #A57322' : '2px solid #ccc', background: '#fff' }}></div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px', color: '#222', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {addr.receiverName} - {addr.phoneNumber}
                        {addr.isDefault && <span style={{ padding: '2px 8px', background: '#eee', borderRadius: '12px', fontSize: '12px', color: '#666', fontWeight: 400 }}>Mặc định</span>}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666', lineHeight: 1.5 }}>
                        {addr.detailedAddress}, {addr.wardName}, {addr.districtName}, {addr.provinceName}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {addresses.length === 0 && (
              <div style={{ textAlign: 'center', color: '#888', padding: '24px 0' }}>Không có địa chỉ nào được lưu.</div>
            )}
            
            <button 
              onClick={() => {
                setIsAddressModalOpen(false);
                setIsAddingAddress(true);
              }}
              style={{ width: '100%', marginTop: '24px', padding: '14px', border: '1px solid #A57322', color: '#A57322', background: 'transparent', borderRadius: '4px', fontWeight: 500, cursor: 'pointer' }}
            >
              + Thêm địa chỉ mới
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

