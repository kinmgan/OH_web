'use client';

import { useState, useEffect } from 'react';
import { userService } from '@/services/user.service';
import { UserProfile, UpdateProfileRequest, ChangePasswordRequest } from '@/types/user.type';
import { authService } from '@/services/auth.service';
import { User, Lock, Save, AlertCircle } from 'lucide-react';

export default function AccountSettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Profile Form
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Email Change Form
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [emailStep, setEmailStep] = useState(1); // 1: request, 2: verify
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await userService.getProfile();
      setProfile(data);
      setFullName(data.fullName || '');
      setPhoneNumber(data.phoneNumber || '');
      setDateOfBirth(data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '');
    } catch (error: any) {
      console.error('Failed to fetch profile', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileLoading(true);
      setProfileError('');
      setProfileSuccess('');
      
      const req: UpdateProfileRequest = {
        fullName,
        phoneNumber,
        dateOfBirth: dateOfBirth || null
      };
      
      const updated = await userService.updateProfile(req);
      setProfile(updated);
      setProfileSuccess('Cập nhật thông tin thành công!');
      
      // Update user in local storage to reflect new name in header
      const currentUser = authService.getUser();
      if (currentUser) {
        currentUser.fullName = updated.fullName;
        localStorage.setItem('adminUser', JSON.stringify(currentUser));
        // You might need to reload or broadcast an event to update header, simple reload here
        window.dispatchEvent(new Event('userUpdated'));
      }
      
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (error: any) {
      setProfileError(error.message || 'Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu mới không khớp!');
      return;
    }
    
    try {
      setPasswordLoading(true);
      setPasswordError('');
      setPasswordSuccess('');
      
      const req: ChangePasswordRequest = {
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword
      };
      
      await userService.changePassword(req);
      setPasswordSuccess('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (error: any) {
      setPasswordError(error.message || 'Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRequestEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setEmailLoading(true);
      setEmailError('');
      await userService.requestChangeEmailOtp(newEmail);
      setEmailStep(2);
      setEmailSuccess('Mã OTP đã được gửi đến email mới của bạn.');
      setTimeout(() => setEmailSuccess(''), 3000);
    } catch (error: any) {
      setEmailError(error.message || 'Có lỗi xảy ra khi gửi OTP');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setEmailLoading(true);
      setEmailError('');
      await userService.verifyAndChangeEmail(newEmail, otpCode);
      setEmailSuccess('Đổi email thành công!');
      
      if (profile) {
        setProfile({ ...profile, email: newEmail });
      }
      
      const currentUser = authService.getUser();
      if (currentUser) {
        currentUser.email = newEmail;
        localStorage.setItem('adminUser', JSON.stringify(currentUser));
      }
      
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailStep(1);
        setNewEmail('');
        setOtpCode('');
        setEmailSuccess('');
      }, 2000);
    } catch (error: any) {
      setEmailError(error.message || 'Mã OTP không hợp lệ');
    } finally {
      setEmailLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
        Đang tải thông tin...
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#333' }}>Cài đặt tài khoản</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Profile Info Card */}
        <div style={{
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          border: '1px solid #f0f0f0',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <User size={20} color="#194A33" />
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#333', margin: 0 }}>Thông tin cá nhân</h2>
          </div>

          <form onSubmit={handleUpdateProfile}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#555' }}>
                Email đăng nhập
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e0e0e0',
                    background: '#f5f5f5',
                    color: '#666',
                    fontSize: '14px',
                    outline: 'none',
                    cursor: 'not-allowed'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowEmailModal(true)}
                  style={{
                    padding: '0 16px',
                    background: '#fff',
                    color: '#194A33',
                    border: '1px solid #194A33',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#f0f5f2';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#fff';
                  }}
                >
                  Thay đổi
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#555' }}>
                Họ và tên
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#194A33'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#555' }}>
                Số điện thoại
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#194A33'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#555' }}>
                Ngày sinh
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#194A33'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            {profileError && (
              <div style={{ padding: '10px 12px', background: '#ffebee', color: '#c62828', borderRadius: '6px', fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                {profileError}
              </div>
            )}

            {profileSuccess && (
              <div style={{ padding: '10px 12px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '6px', fontSize: '14px', marginBottom: '16px' }}>
                {profileSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={profileLoading}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: '#194A33',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: profileLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: profileLoading ? 0.7 : 1,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!profileLoading) (e.currentTarget as HTMLButtonElement).style.background = '#123624';
              }}
              onMouseLeave={(e) => {
                if (!profileLoading) (e.currentTarget as HTMLButtonElement).style.background = '#194A33';
              }}
            >
              <Save size={16} />
              {profileLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div style={{
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          border: '1px solid #f0f0f0',
          padding: '24px',
          alignSelf: 'start'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Lock size={20} color="#194A33" />
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#333', margin: 0 }}>Đổi mật khẩu</h2>
          </div>

          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#555' }}>
                Mật khẩu hiện tại
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="Nhập mật khẩu hiện tại"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#194A33'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#555' }}>
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Nhập mật khẩu mới"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#194A33'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#555' }}>
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Nhập lại mật khẩu mới"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#194A33'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            {passwordError && (
              <div style={{ padding: '10px 12px', background: '#ffebee', color: '#c62828', borderRadius: '6px', fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div style={{ padding: '10px 12px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '6px', fontSize: '14px', marginBottom: '16px' }}>
                {passwordSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: '#194A33',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: passwordLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: passwordLoading ? 0.7 : 1,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!passwordLoading) (e.currentTarget as HTMLButtonElement).style.background = '#123624';
              }}
              onMouseLeave={(e) => {
                if (!passwordLoading) (e.currentTarget as HTMLButtonElement).style.background = '#194A33';
              }}
            >
              <Lock size={16} />
              {passwordLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </button>
          </form>
        </div>
      </div>

      {/* Email Change Modal */}
      {showEmailModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: '24px',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#333', marginBottom: '16px', marginTop: 0 }}>Đổi Email Đăng Nhập</h3>
            
            {emailStep === 1 ? (
              <form onSubmit={handleRequestEmailOtp}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#555' }}>
                    Nhập email mới
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    placeholder="ví dụ: newemail@domain.com"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #e0e0e0',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                
                {emailError && (
                  <div style={{ padding: '8px', background: '#ffebee', color: '#c62828', borderRadius: '4px', fontSize: '13px', marginBottom: '16px' }}>
                    {emailError}
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    style={{
                      padding: '8px 16px', background: '#f5f5f5', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer'
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={emailLoading}
                    style={{
                      padding: '8px 16px', background: '#194A33', color: '#fff', border: 'none', borderRadius: '4px', cursor: emailLoading ? 'not-allowed' : 'pointer', opacity: emailLoading ? 0.7 : 1
                    }}
                  >
                    {emailLoading ? 'Đang gửi...' : 'Nhận mã OTP'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailOtp}>
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '14px', color: '#555', marginBottom: '12px', lineHeight: '1.5' }}>
                    Chúng tôi đã gửi mã xác minh gồm 6 số tới email <strong>{newEmail}</strong>.
                  </p>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#555' }}>
                    Nhập mã OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    required
                    placeholder="Nhập 6 số"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #e0e0e0',
                      fontSize: '14px',
                      outline: 'none',
                      textAlign: 'center',
                      letterSpacing: '4px',
                      fontWeight: 'bold'
                    }}
                  />
                </div>
                
                {emailError && (
                  <div style={{ padding: '8px', background: '#ffebee', color: '#c62828', borderRadius: '4px', fontSize: '13px', marginBottom: '16px' }}>
                    {emailError}
                  </div>
                )}

                {emailSuccess && (
                  <div style={{ padding: '8px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', fontSize: '13px', marginBottom: '16px' }}>
                    {emailSuccess}
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailStep(1);
                      setOtpCode('');
                      setEmailError('');
                      setEmailSuccess('');
                    }}
                    style={{
                      padding: '8px 16px', background: '#f5f5f5', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer'
                    }}
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={emailLoading || otpCode.length !== 6}
                    style={{
                      padding: '8px 16px', background: '#194A33', color: '#fff', border: 'none', borderRadius: '4px', cursor: (emailLoading || otpCode.length !== 6) ? 'not-allowed' : 'pointer', opacity: (emailLoading || otpCode.length !== 6) ? 0.7 : 1
                    }}
                  >
                    {emailLoading ? 'Đang xử lý...' : 'Xác nhận'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
