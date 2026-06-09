'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { RegisterRequest } from '@/types/auth.type';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterRequest>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.register(formData);
      setSuccess(true);
      setTimeout(() => router.push('/dang-nhap'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Đăng kí thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FCF8F1',
      }}>
        <div style={{
          textAlign: 'center',
          background: '#fff',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
          <h2 style={{ color: '#2E7D32', marginBottom: '8px' }}>Đăng kí thành công!</h2>
          <p style={{ color: '#999' }}>Đang chuyển đến trang đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FCF8F1',
      fontFamily: "'Be Vietnam Pro', sans-serif",
    }}>
      <div style={{
        background: '#fff',
        padding: '48px',
        borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '420px',
      }}>
        {/* Logo */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          <div style={{
            fontSize: '40px',
            fontWeight: 700,
            color: '#A57322',
            marginBottom: '8px',
          }}>
            🏺
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#333',
            margin: '0 0 8px 0',
          }}>
            Đăng kí Admin
          </h1>
          <p style={{
            color: '#999',
            fontSize: '14px',
            margin: 0,
          }}>
            Tạo tài khoản quản trị
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#FFEBEE',
            border: '1px solid #EF5350',
            color: '#C62828',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '24px',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#333',
              marginBottom: '8px',
            }}>
              Họ tên
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#333',
              marginBottom: '8px',
            }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@example.com"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#333',
              marginBottom: '8px',
            }}>
              Số điện thoại
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="0901234567"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#333',
              marginBottom: '8px',
            }}>
              Mật khẩu
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#999',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: '#A57322',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Đang đăng kí...' : 'Đăng kí'}
          </button>

          {/* Login Link */}
          <div style={{
            marginTop: '16px',
            textAlign: 'center',
            fontSize: '13px',
          }}>
            <span style={{ color: '#999' }}>Đã có tài khoản? </span>
            <a
              href="/dang-nhap"
              style={{
                color: '#A57322',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Đăng nhập
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
