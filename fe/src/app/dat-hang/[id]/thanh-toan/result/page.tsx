'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Breadcrumb from '@/components/common/Breadcrumb';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { paymentService } from '@/services/payment.service';
import { ProductSummary } from '@/types/catalog.type';
import { CatalogService } from '@/services/catalog.service';
import ProductCard from '@/components/product/ProductCard';

export default function PaymentResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [suggestedProducts, setSuggestedProducts] = useState<ProductSummary[]>([]);

  const status = searchParams.get('status');
  const orderId = searchParams.get('orderId');
  const responseCode = searchParams.get('vnp_ResponseCode');

  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    // Build all VNPay params from URL
    const vnpParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith('vnp_')) {
        vnpParams[key] = value;
      }
    });

    // If we have VNPay params, verify with backend first
    if (Object.keys(vnpParams).length > 0) {
      paymentService.verifyReturn(vnpParams)
        .then(result => {
          // Redirect with verified status
          router.replace(`/dat-hang/${result.orderId}/thanh-toan/result?status=${result.status}&orderId=${result.orderId}&responseCode=${result.responseCode}`);
        })
        .catch(err => {
          console.error('Payment verification failed:', err);
          router.replace(`/dat-hang/${orderId}/thanh-toan/result?status=failed&orderId=${orderId}&responseCode=${responseCode || ''}`);
        })
        .finally(() => setIsLoading(false));
    } else {
      // No VNPay params, use status from URL
      setIsLoading(false);
    }
  }, [searchParams, orderId, responseCode, router]);

  // Fetch suggested products
  useEffect(() => {
    CatalogService.getProducts({ size: 4 })
      .then(res => {
        if (res.content) setSuggestedProducts(res.content);
      })
      .catch(err => console.error('Failed to fetch suggested products:', err));
  }, []);

  const isSuccess = status === 'success' || responseCode === '00';
  const isFailed = status === 'failed' || (!isSuccess && responseCode && responseCode !== '00');

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fdfbf7', fontFamily: 'var(--font-be-vietnam), sans-serif' }}>
        <Loader2 size={48} color="#A57322" style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#666', fontSize: '16px' }}>Đang xác minh kết quả thanh toán...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fdfbf7', fontFamily: 'var(--font-be-vietnam), sans-serif', paddingBottom: '60px' }}>
      <Breadcrumb items={[
        { label: 'Trang chủ', href: '/' },
        { label: 'Đặt hàng', href: '/dat-hang' },
        { label: 'Kết quả thanh toán' }
      ]} />

      <div style={{ maxWidth: '600px', margin: '60px auto 40px', padding: '0 20px' }}>
        {isSuccess && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: '#f3eadb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px'
              }}>
                <CheckCircle2 size={48} color="#A57322" />
              </div>
              <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#A57322', marginBottom: '12px' }}>
                Thanh toán thành công!
              </h1>
              <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: 1.7 }}>
                Cảm ơn bạn đã đặt hàng tại OrientalHerbs.<br />
                Đơn hàng của bạn đã được xử lý và sẽ được giao sớm nhất có thể.
              </p>
            </div>

            {orderId && (
              <div style={{ background: '#fff', padding: '24px 32px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>Mã đơn hàng</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#A57322' }}>ORH{orderId}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '16px', flexDirection: 'row' }}>
              <button
                onClick={() => router.push('/san-pham')}
                style={{ flex: 1, padding: '14px', background: '#A57322', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = '#8a601c'}
                onMouseOut={e => e.currentTarget.style.background = '#A57322'}
              >
                Tiếp tục mua sắm
              </button>
              <button
                onClick={() => router.push('/tai-khoan/don-hang')}
                style={{ flex: 1, padding: '14px', background: '#fff', color: '#A57322', border: '1px solid #A57322', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = '#fcf9f2'}
                onMouseOut={e => e.currentTarget.style.background = '#fff'}
              >
                Xem đơn hàng
              </button>
            </div>
          </>
        )}

        {isFailed && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px'
              }}>
                <XCircle size={48} color="#dc2626" />
              </div>
              <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#dc2626', marginBottom: '12px' }}>
                Thanh toán thất bại
              </h1>
              <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: 1.7 }}>
                {responseCode
                  ? `Mã lỗi: ${responseCode}. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.`
                  : 'Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.'
                }
              </p>
            </div>

            {orderId && (
              <div style={{ background: '#fff', padding: '24px 32px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>Mã đơn hàng</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#A57322' }}>ORH{orderId}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '16px', flexDirection: 'row' }}>
              <button
                onClick={() => router.push(`/dat-hang/${orderId}/thanh-toan`)}
                style={{ flex: 1, padding: '14px', background: '#A57322', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = '#8a601c'}
                onMouseOut={e => e.currentTarget.style.background = '#A57322'}
              >
                Thử lại thanh toán
              </button>
              <button
                onClick={() => router.push('/san-pham')}
                style={{ flex: 1, padding: '14px', background: '#fff', color: '#333', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseOut={e => e.currentTarget.style.background = '#fff'}
              >
                Tiếp tục mua sắm
              </button>
            </div>
          </>
        )}

        {!isSuccess && !isFailed && (
          <div style={{ textAlign: 'center', marginTop: '80px' }}>
            <h2 style={{ fontSize: '20px', color: '#374151', marginBottom: '16px' }}>Không xác định trạng thái</h2>
            <button
              onClick={() => router.push('/tai-khoan/don-hang')}
              style={{ padding: '12px 32px', background: '#A57322', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '15px', fontWeight: 500 }}
            >
              Xem đơn hàng của tôi
            </button>
          </div>
        )}
      </div>

      {/* Gợi ý sản phẩm */}
      {suggestedProducts.length > 0 && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', marginTop: '60px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#194A33', marginBottom: '32px', textAlign: 'center' }}>
            Có thể bạn sẽ thích
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(254px, max-content))', gap: '24px', justifyContent: 'center' }}>
            {suggestedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
