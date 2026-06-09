'use client';

import { useEffect, useState } from 'react';
import { userService } from '@/services/user.service';
import { UserProfile, UpdateProfileRequest, ChangePasswordRequest } from '@/types/user.type';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<UpdateProfileRequest>({
    fullName: '',
    phoneNumber: '',
    dateOfBirth: ''
  });

  // Password Form
  const [passwordData, setPasswordData] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [pwdErrorMsg, setPwdErrorMsg] = useState('');
  const [pwdSuccessMsg, setPwdSuccessMsg] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // Email Change
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [emailStep, setEmailStep] = useState(1);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await userService.getProfile();
      setProfile(data);
      setFormData({
        fullName: data.fullName || '',
        phoneNumber: data.phoneNumber || '',
        dateOfBirth: data.dateOfBirth || ''
      });
    } catch (error) {
      console.error('Failed to fetch profile', error);
      setErrorMsg('Không thể lấy thông tin người dùng.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSavePassword = async () => {
    setPwdErrorMsg('');
    setPwdSuccessMsg('');

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmNewPassword) {
      setPwdErrorMsg('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPwdErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      setPwdLoading(true);
      await userService.changePassword(passwordData);
      setPwdSuccessMsg('Đổi mật khẩu thành công!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setTimeout(() => setPwdSuccessMsg(''), 3000);
    } catch (error: any) {
      setPwdErrorMsg(error.message || 'Có lỗi xảy ra khi đổi mật khẩu.');
    } finally {
      setPwdLoading(false);
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

  const handleCancel = () => {
     if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        phoneNumber: profile.phoneNumber || '',
        dateOfBirth: profile.dateOfBirth || ''
      });
     }

     setErrorMsg('');
     setSuccessMsg('');
  };

  const handleSave = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Update Profile if anything changed
      let profileUpdated = false;
      if (profile && (
          formData.fullName !== profile.fullName || 
          formData.phoneNumber !== profile.phoneNumber || 
          formData.dateOfBirth !== profile.dateOfBirth
      )) {
        await userService.updateProfile(formData);
        profileUpdated = true;
      }

      if (profileUpdated) {
          setSuccessMsg('Cập nhật thành công!');
          fetchProfile();
      } else {
          setSuccessMsg('Không có thay đổi nào để cập nhật.');
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || 'Có lỗi xảy ra trong quá trình cập nhật.');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải...</div>;

  return (
    <div className="w-full">
      <h2 className="text-[20px] font-semibold text-[#A57322] mb-8">Sửa thông tin của bạn</h2>

      {/* Messages */}
      {errorMsg && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-sm">{errorMsg}</div>}
      {successMsg && <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-sm">{successMsg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <label className="block mb-2 font-medium text-[#333333]">Họ tên</label>
          <input
            name="fullName"
            value={formData.fullName}
            onChange={handleProfileChange}
            className="w-full p-4 rounded-sm border-none bg-[#F9F9F9] focus:outline-none focus:ring-1 focus:ring-[#A57322] transition-all text-gray-800"
            placeholder="Nhập họ tên"
          />
        </div>
        <div>
          <label className="block mb-2 font-medium text-[#333333]">Số điện thoại</label>
          <input
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleProfileChange}
            className="w-full p-4 rounded-sm border-none bg-[#F9F9F9] focus:outline-none focus:ring-1 focus:ring-[#A57322] transition-all text-gray-800"
            placeholder="Nhập số điện thoại"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div>
          <label className="block mb-2 font-medium text-[#333333]">Email</label>
          <div className="flex gap-2">
            <input
              name="email"
              value={profile?.email || ''}
              disabled
              className="w-full p-4 rounded-sm border-none bg-[#F9F9F9] text-gray-500 cursor-not-allowed"
              placeholder="Email"
            />
            <button
              onClick={() => setShowEmailModal(true)}
              className="px-4 py-2 bg-transparent text-[#A57322] border border-[#A57322] rounded-sm hover:bg-[#FDFBF7] transition-colors whitespace-nowrap cursor-pointer"
            >
              Thay đổi
            </button>
          </div>
        </div>
        <div>
          <label className="block mb-2 font-medium text-[#333333]">Ngày sinh</label>
          <input
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth || ''}
            onChange={handleProfileChange}
            className="w-full p-4 rounded-sm border-none bg-[#F9F9F9] focus:outline-none focus:ring-1 focus:ring-[#A57322] transition-all text-gray-800 min-h-[56px]"
          />
        </div>
      </div>



      <div className="flex justify-end gap-6 items-center">
        <button
          onClick={handleCancel}
          className="bg-transparent border-none text-[#333333] hover:text-[#000] cursor-pointer font-medium"
        >
          Hủy
        </button>
        <button
          onClick={handleSave}
          className="px-8 py-3 bg-[#A57322] text-white rounded-sm font-medium hover:bg-[#8f631d] transition-colors cursor-pointer border-none"
        >
          Lưu thay đổi
        </button>
      </div>

      {/* Password Section */}
      <div className="mt-16 border-t border-gray-200 pt-10">
        <h2 className="text-[20px] font-semibold text-[#A57322] mb-8">Đổi mật khẩu</h2>

        {pwdErrorMsg && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-sm">{pwdErrorMsg}</div>}
        {pwdSuccessMsg && <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-sm">{pwdSuccessMsg}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block mb-2 font-medium text-[#333333]">Mật khẩu hiện tại</label>
            <input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              className="w-full p-4 rounded-sm border-none bg-[#F9F9F9] focus:outline-none focus:ring-1 focus:ring-[#A57322] transition-all text-gray-800"
              placeholder="Nhập mật khẩu hiện tại"
            />
          </div>
          <div className="hidden md:block"></div>
          <div>
            <label className="block mb-2 font-medium text-[#333333]">Mật khẩu mới</label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              className="w-full p-4 rounded-sm border-none bg-[#F9F9F9] focus:outline-none focus:ring-1 focus:ring-[#A57322] transition-all text-gray-800"
              placeholder="Nhập mật khẩu mới"
            />
          </div>
          <div>
            <label className="block mb-2 font-medium text-[#333333]">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              name="confirmNewPassword"
              value={passwordData.confirmNewPassword}
              onChange={handlePasswordChange}
              className="w-full p-4 rounded-sm border-none bg-[#F9F9F9] focus:outline-none focus:ring-1 focus:ring-[#A57322] transition-all text-gray-800"
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>
        </div>

        <div className="flex justify-end gap-6 items-center">
          <button
            onClick={() => {
              setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
              setPwdErrorMsg('');
              setPwdSuccessMsg('');
            }}
            className="bg-transparent border-none text-[#333333] hover:text-[#000] cursor-pointer font-medium"
          >
            Hủy
          </button>
          <button
            onClick={handleSavePassword}
            disabled={pwdLoading}
            className={`px-8 py-3 bg-[#A57322] text-white rounded-sm font-medium hover:bg-[#8f631d] transition-colors border-none ${pwdLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {pwdLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
        </div>
      </div>

      {/* Email Change Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-sm w-full max-w-md shadow-xl">
            <h3 className="text-xl font-semibold text-[#A57322] mb-4">Đổi Email Đăng Nhập</h3>
            
            {emailStep === 1 ? (
              <form onSubmit={handleRequestEmailOtp}>
                <div className="mb-4">
                  <label className="block mb-2 font-medium text-[#333333]">Nhập email mới</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    placeholder="ví dụ: newemail@domain.com"
                    className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:border-[#A57322]"
                  />
                </div>
                
                {emailError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-sm text-sm">{emailError}</div>}
                
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-sm hover:bg-gray-200"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={emailLoading}
                    className={`px-4 py-2 bg-[#A57322] text-white rounded-sm hover:bg-[#8f631d] ${emailLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {emailLoading ? 'Đang gửi...' : 'Nhận mã OTP'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailOtp}>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Chúng tôi đã gửi mã xác minh gồm 6 số tới email <strong>{newEmail}</strong>.
                  </p>
                  <label className="block mb-2 font-medium text-[#333333]">Nhập mã OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    required
                    placeholder="Nhập 6 số"
                    className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:border-[#A57322] text-center tracking-widest font-bold"
                  />
                </div>
                
                {emailError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-sm text-sm">{emailError}</div>}
                {emailSuccess && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-sm text-sm">{emailSuccess}</div>}
                
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailStep(1);
                      setOtpCode('');
                      setEmailError('');
                      setEmailSuccess('');
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-sm hover:bg-gray-200"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={emailLoading || otpCode.length !== 6}
                    className={`px-4 py-2 bg-[#A57322] text-white rounded-sm hover:bg-[#8f631d] ${(emailLoading || otpCode.length !== 6) ? 'opacity-70 cursor-not-allowed' : ''}`}
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
