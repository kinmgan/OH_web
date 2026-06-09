export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string | null;
}

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}
