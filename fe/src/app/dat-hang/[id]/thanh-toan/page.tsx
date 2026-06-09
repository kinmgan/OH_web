'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { paymentService } from '@/services/payment.service';
import { PaymentInitResponse, PaymentStatusResponse } from '@/types/payment.type';
import { CheckCircle2, QrCode, Loader2 } from 'lucide-react';
import Breadcrumb from '@/components/common/Breadcrumb';

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInitResponse | null>(null);
  const [pollingStatus, setPollingStatus] = useState<PaymentStatusResponse | null>(null);
  const [error, setError] = useState('');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Initialize payment on mount
  useEffect(() => {
    if (!orderId || isNaN(orderId)) return;
    initPayment();
  }, [orderId]);

  const initPayment = async () => {
    setLoading(true);
    setError('');
    try {
      // Retrieve pending order info from sessionStorage to know the payment method
      const stored = sessionStorage.getItem('pendingOrder');
      if (!stored) {
        setError('Khong tim thay thong tin don hang. Vui long dat hang lai.');
        setLoading(false);
        return;
      }

      const pendingOrder = JSON.parse(stored);
      if (pendingOrder.orderId !== orderId) {
        setError('Don hang khong khop. Vui long dat hang lai.');
        setLoading(false);
        return;
      }

      const method = pendingOrder.paymentMethod || pendingOrder.paymentMethod;

      const response = await paymentService.initPayment(orderId, method);
      setPaymentInfo(response);

      // For gateway payments, redirect immediately
      if (method !== 'BANK_TRANSFER') {
        if (response.paymentUrl && response.paymentUrl.startsWith('http')) {
          window.location.href = response.paymentUrl;
        }
      } else {
        // For bank transfer, start polling
        startPolling();
      }
    } catch (err: any) {
      setError(err?.message || 'Khoi tao thanh toan that bai. Vui long thu lai.');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    if (pollingIntervalRef.current) return;
    startTimeRef.current = Date.now();

    pollingIntervalRef.current = setInterval(async () => {
      // Timeout after 60 minutes
      if (Date.now() - startTimeRef.current > 60 * 60 * 1000) {
        stopPolling();
        setError('Het gio thanh toan. Don hang da bi huy.');
        return;
      }

      try {
        const status = await paymentService.getStatus(orderId);
        setPollingStatus(status);

        if (status.paymentStatus === 'SUCCESS') {
          stopPolling();
          sessionStorage.removeItem('pendingOrder');
          router.push(`/dat-hang/${orderId}/thanh-toan/result?status=success&orderId=${orderId}`);
        } else if (status.paymentStatus === 'FAILED') {
          stopPolling();
          router.push(`/dat-hang/${orderId}/thanh-toan/result?status=failed&orderId=${orderId}`);
        }
      } catch (err) {
        // Silent fail on polling — keep retrying
      }
    }, 5000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fdfbf7', fontFamily: 'var(--font-be-vietnam), sans-serif' }}>
        <Loader2 size={48} color="#A57322" style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#666', fontSize: '16px' }}>Dang khoi tao thanh toan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#fdfbf7', fontFamily: 'var(--font-be-vietnam), sans-serif' }}>
        <Breadcrumb items={[{ label: 'Trang chu', href: '/' }, { label: 'Dat hang', href: '/dat-hang' }, { label: 'Thanh toan' }]} />
        <div style={{ maxWidth: '500px', margin: '80px auto', padding: '40px', background: '#fff', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <p style={{ color: '#dc2626', fontSize: '16px', marginBottom: '24px' }}>{error}</p>
          <button
            onClick={() => router.push('/dat-hang')}
            style={{ padding: '12px 32px', background: '#A57322', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '15px' }}
          >
            Quay lai trang dat hang
          </button>
        </div>
      </div>
    );
  }

  // Bank Transfer — show VietQR
  if (paymentInfo?.method === 'BANK_TRANSFER') {
    const expiredAt = paymentInfo.expiredAt ? new Date(paymentInfo.expiredAt) : null;

    return (
      <div style={{ minHeight: '100vh', background: '#fdfbf7', fontFamily: 'var(--font-be-vietnam), sans-serif', paddingBottom: '60px' }}>
        <Breadcrumb items={[{ label: 'Trang chu', href: '/' }, { label: 'Dat hang', href: '/dat-hang' }, { label: 'Thanh toan' }]} />
        <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 600, textAlign: 'center', marginBottom: '8px', color: '#333' }}>
            Thanh toan chuyen khoan ngan hang
          </h1>
          <p style={{ textAlign: 'center', color: '#888', marginBottom: '40px', fontSize: '15px' }}>
            Quet ma QR hoac chuyen khoan theo thong tin ben duoi
          </p>

          {/* VietQR Image */}
          <div style={{ background: '#fff', padding: '40px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
            {paymentInfo.paymentUrl ? (
              <img
                src={paymentInfo.paymentUrl}
                alt="VietQR"
                style={{ maxWidth: '280px', width: '100%', borderRadius: '8px', border: '1px solid #eee' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div style={{ padding: '60px', color: '#aaa' }}>
                <QrCode size={80} style={{ margin: '0 auto 16px' }} />
                <p>Khong the tai ma QR</p>
              </div>
            )}
          </div>

          {/* Payment Info */}
          {paymentInfo.message && (
            <div style={{ background: '#fff', padding: '24px 32px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', marginBottom: '24px' }}>
              <p style={{ fontSize: '15px', color: '#555', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>{paymentInfo.message}</p>
            </div>
          )}

          {/* Order ID */}
          <div style={{ background: '#fdfbf7', border: '1px solid #e8e0d0', padding: '16px 24px', borderRadius: '8px', textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '13px', color: '#888' }}>Ma don hang: </span>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#A57322' }}>ORH{orderId}</span>
          </div>

          {/* Polling Status */}
          {pollingStatus?.paymentStatus === 'PENDING' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#888', fontSize: '14px' }}>
              <Loader2 size={16} color="#A57322" style={{ animation: 'spin 1s linear infinite' }} />
              <span>Dang cho xac nhan thanh toan...</span>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Instructions */}
          <div style={{ background: '#fef9f0', border: '1px solid #f0e0c0', borderRadius: '8px', padding: '20px 24px', fontSize: '14px', color: '#7a5c1e', lineHeight: 1.8 }}>
            <strong style={{ display: 'block', marginBottom: '8px' }}>Huong dan thanh toan:</strong>
            1. Quet ma QR tren ung dung ngan hang<br />
            2. Hoac chuyen khoan thu cong theo thong tin tai khoan<br />
            3. Su dung ma don <strong>ORH{orderId}</strong> trong noi dung chuyen khoan<br />
            4. Toi da 24h de xac nhan thanh toan
          </div>
        </div>
      </div>
    );
  }

  return null;
}
