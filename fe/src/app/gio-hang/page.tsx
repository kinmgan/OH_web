'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CartService } from '@/services/cart.service';
import { CartItemResponse } from '@/types/cart.type';
import CartTable from '@/components/cart/CartTable';
import CartSummary from '@/components/cart/CartSummary';
import ConfirmModal from '@/components/common/ConfirmModal';
import Breadcrumb from '@/components/common/Breadcrumb';
import Button from '@/components/common/Button';

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItemResponse[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // State quản lý Modal
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => { }
  });

  // Lấy giỏ hàng khi trang load
  useEffect(() => {
    CartService.getCartItems()
      .then(setCartItems)
      .finally(() => setLoading(false));
  }, []);

  // Xử lý cập nhật số lượng
  const handleUpdateQuantity = async (cartItemId: number, quantity: number) => {
    const updated = await CartService.updateQuantity(cartItemId, quantity);
    setCartItems(items =>
      items.map(item => item.cartItemId === cartItemId ? { ...item, quantity: updated.quantity } : item)
    );
  };

  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });

  // Xử lý xóa 1 sản phẩm (Mở popup)
  const handleRemoveItemClick = (item: CartItemResponse) => {
    setModalConfig({
      isOpen: true,
      message: `Bạn có chắc chắn muốn xóa "${item.productName}" khỏi giỏ hàng?`,
      onConfirm: async () => {
        await CartService.removeItem(item.cartItemId);
        setCartItems(items => items.filter(i => i.cartItemId !== item.cartItemId));
        setSelectedItemIds(prev => prev.filter(id => id !== item.cartItemId));
        closeModal();
      }
    });
  };

  // Xử lý xóa toàn bộ giỏ hàng (Mở popup)
  const handleClearCartClick = () => {
    if (cartItems.length === 0) return;
    setModalConfig({
      isOpen: true,
      message: 'Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi giỏ hàng?',
      onConfirm: async () => {
        await CartService.clearCart();
        setCartItems([]);
        setSelectedItemIds([]);
        closeModal();
      }
    });
  };

  const handleToggleSelect = (cartItemId: number) => {
    setSelectedItemIds(prev =>
      prev.includes(cartItemId)
        ? prev.filter(id => id !== cartItemId)
        : [...prev, cartItemId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedItemIds.length === cartItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(cartItems.map(item => item.cartItemId));
    }
  };

  // Tính tổng tiền cho các sản phẩm được chọn (sử dụng finalPrice nếu có discount)
  const selectedItems = cartItems.filter(item => selectedItemIds.includes(item.cartItemId));
  const subtotal = selectedItems.reduce((sum, item) => {
    const itemPrice = item.finalPrice || item.price;
    return sum + itemPrice * item.quantity;
  }, 0);

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm để thanh toán!');
      return;
    }
    sessionStorage.setItem('checkoutItems', JSON.stringify(selectedItems));
    router.push('/dat-hang');
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#fdfbf7', paddingBottom: '20px', fontFamily: 'var(--font-be-vietnam), sans-serif' }}>
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Giỏ hàng' }
        ]}
      />

      <div className="cart-container" style={{ maxWidth: '1050px', margin: '0 auto', padding: '0 20px', marginTop: '40px' }}>

        {cartItems.length > 0 ? (
          <CartTable
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItemClick}
            selectedItemIds={selectedItemIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
          />
        ) : (
          <div style={{ padding: '40px 0', textAlign: 'center', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            Giỏ hàng của bạn đang trống.
          </div>
        )}

        {cartItems.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <Button
              onClick={() => window.location.href = '/san-pham'}
              colorTheme="white"
            >
              Tiếp tục xem sản phẩm
            </Button>
            <Button
              onClick={handleClearCartClick}
              colorTheme="white"
            >
              Xóa giỏ hàng
            </Button>
          </div>
        )}

        {cartItems.length > 0 && (
          <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
            <CartSummary 
              subtotal={subtotal} 
              onCheckout={handleCheckout}
            />
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={closeModal}
      />
    </div>
  );
}