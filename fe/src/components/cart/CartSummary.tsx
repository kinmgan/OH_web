import Button from '../common/Button';

type Props = {
  subtotal: number;
  onCheckout: () => void;
};

export default function CartSummary({ subtotal, onCheckout }: Props) {
  return (
    <div style={{
      border: '1px solid #222',
      borderRadius: 8,
      padding: 24,
      width: 320,
      background: '#fff'
    }}>
      <h3 style={{ marginBottom: 16 }}>Tạm tính</h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: 16 }}>
        <span>Tổng tiền:</span>
        <span>{subtotal.toLocaleString('vi-VN')}</span>
      </div>
      <Button
        colorTheme="brown"
        style={{
          width: '100%',
          padding: '12px 0',
          fontWeight: 500
        }}
        onClick={onCheckout}
      >
        Thanh toán
      </Button>
    </div>
  );
}