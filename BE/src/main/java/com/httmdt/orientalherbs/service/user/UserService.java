package com.httmdt.orientalherbs.service.user;

import com.httmdt.orientalherbs.dto.user.ChangePasswordRequest;
import com.httmdt.orientalherbs.dto.user.UpdateProfileRequest;
import com.httmdt.orientalherbs.dto.user.UserProfileDTO;

public interface UserService {
    UserProfileDTO getUserProfile(Long userId);
    UserProfileDTO updateUserProfile(Long userId, UpdateProfileRequest request);
    void changePassword(Long userId, ChangePasswordRequest request);
}
