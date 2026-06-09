import { http } from '@/utils/http';
import { UserProfile, UpdateProfileRequest, ChangePasswordRequest } from '@/types/user.type';

const ENDPOINT = '/user/profile';

export const userService = {
  async getProfile(): Promise<UserProfile> {
    return http<UserProfile>(ENDPOINT);
  },

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    return http<UserProfile>(ENDPOINT, {
      method: 'PUT',
      body: data
    });
  },

  async changePassword(data: ChangePasswordRequest): Promise<{ success: boolean; message: string }> {
    return http<{ success: boolean; message: string }>(`${ENDPOINT}/password`, {
      method: 'PUT',
      body: data
    });
  },

  async requestChangeEmailOtp(newEmail: string): Promise<void> {
    return http<void>(`${ENDPOINT}/email/request-otp`, {
      method: 'POST',
      body: { newEmail }
    });
  },

  async verifyAndChangeEmail(newEmail: string, otpCode: string): Promise<void> {
    return http<void>(`${ENDPOINT}/email/verify-otp`, {
      method: 'PUT',
      body: { newEmail, otpCode }
    });
  }
};
