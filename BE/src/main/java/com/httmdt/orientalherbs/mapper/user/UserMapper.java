package com.httmdt.orientalherbs.mapper.user;

import java.math.BigDecimal;

import com.httmdt.orientalherbs.dto.user.UserAdminDto;
import com.httmdt.orientalherbs.dto.user.UserAdminRequestDto;
import com.httmdt.orientalherbs.dto.user.UserProfileDTO;
import com.httmdt.orientalherbs.model.user.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    public UserProfileDTO toUserProfileDTO(User user) {
        if (user == null) {
            return null;
        }

        return UserProfileDTO.builder()
                .id(user.getUserId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .dateOfBirth(user.getDateOfBirth())
                .build();
    }

    public UserAdminDto toUserAdminDto(User user, Long orderCount, BigDecimal totalSpent) {
        if (user == null) {
            return null;
        }

        return UserAdminDto.builder()
                .id(user.getUserId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .orderCount(orderCount == null ? 0L : orderCount)
                .totalSpent(totalSpent == null ? BigDecimal.ZERO : totalSpent)
                .createdAt(user.getCreatedAt())
                .build();
    }

    public void updateUserFromAdminRequest(User user, UserAdminRequestDto requestDto) {
        user.setFullName(requestDto.getFullName());
        user.setEmail(requestDto.getEmail());
        user.setPhoneNumber(requestDto.getPhoneNumber());
    }
}
