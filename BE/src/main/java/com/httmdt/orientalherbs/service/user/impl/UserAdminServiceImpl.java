package com.httmdt.orientalherbs.service.user.impl;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.httmdt.orientalherbs.dao.user.HealthCategoryCount;
import com.httmdt.orientalherbs.dao.user.UserCustomerSummaryProjection;
import com.httmdt.orientalherbs.dao.user.UserHealthTagRepository;
import com.httmdt.orientalherbs.dao.user.UserRepository;
import com.httmdt.orientalherbs.dto.user.HealthRadarSummaryDto;
import com.httmdt.orientalherbs.dto.user.UserAdminDto;
import com.httmdt.orientalherbs.dto.user.UserAdminRequestDto;
import com.httmdt.orientalherbs.dto.user.UserHealthTagDto;
import com.httmdt.orientalherbs.mapper.user.UserMapper;
import com.httmdt.orientalherbs.model.enums.HealthCategory;
import com.httmdt.orientalherbs.model.enums.HealthStatus;
import com.httmdt.orientalherbs.model.enums.UserRole;
import com.httmdt.orientalherbs.model.user.User;
import com.httmdt.orientalherbs.model.user.UserHealthTag;
import com.httmdt.orientalherbs.service.user.UserAdminService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserAdminServiceImpl implements UserAdminService {
    private final UserRepository userRepository;
    private final UserHealthTagRepository userHealthTagRepository;
    private final UserMapper userMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<UserAdminDto> getCustomers(String keyword, Pageable pageable) {
        String safeKeyword = (keyword == null || keyword.trim().isEmpty()) ? "" : keyword.trim();
        return userRepository.searchCustomers(UserRole.ROLE_USER, safeKeyword, pageable)
                .map(this::mapProjectionToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public UserAdminDto getCustomerById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng với id: " + id));

        if (user.getRole() != UserRole.ROLE_USER) {
            throw new RuntimeException("Người dùng này không thuộc nhóm khách hàng");
        }

        Long orderCount = user.getOrders() == null ? 0L : (long) user.getOrders().size();
        BigDecimal totalSpent = user.getOrders() == null
                ? BigDecimal.ZERO
                : user.getOrders().stream()
                        .map(order -> order.getTotalAmount() == null ? BigDecimal.ZERO : order.getTotalAmount())
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        return userMapper.toUserAdminDto(user, orderCount, totalSpent);
    }

    @Override
    @Transactional
    public UserAdminDto updateCustomer(Long id, UserAdminRequestDto requestDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng với id: " + id));

        if (user.getRole() != UserRole.ROLE_USER) {
            throw new RuntimeException("Người dùng này không thuộc nhóm khách hàng");
        }

        if (userRepository.existsByEmailAndUserIdNot(requestDto.getEmail(), id)) {
            throw new RuntimeException("Email đã tồn tại trong hệ thống");
        }

        userMapper.updateUserFromAdminRequest(user, requestDto);
        User updated = userRepository.save(user);

        Long orderCount = updated.getOrders() == null ? 0L : (long) updated.getOrders().size();
        BigDecimal totalSpent = updated.getOrders() == null
                ? BigDecimal.ZERO
                : updated.getOrders().stream()
                        .map(order -> order.getTotalAmount() == null ? BigDecimal.ZERO : order.getTotalAmount())
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        return userMapper.toUserAdminDto(updated, orderCount, totalSpent);
    }

    @Override
    @Transactional
    public void deleteCustomer(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng với id: " + id));

        if (user.getRole() != UserRole.ROLE_USER) {
            throw new RuntimeException("Người dùng này không thuộc nhóm khách hàng");
        }

        if (user.getOrders() != null && !user.getOrders().isEmpty()) {
            throw new RuntimeException("Không thể xóa khách hàng đã phát sinh đơn hàng");
        }

        userRepository.delete(user);
    }

    @Override
    @Transactional(readOnly = true)
    public HealthRadarSummaryDto getHealthRadarSummary() {
        List<HealthCategoryCount> categoryCounts = userHealthTagRepository.countByCategory();

        Map<HealthCategory, Long> countMap = categoryCounts.stream()
                .collect(Collectors.toMap(
                        HealthCategoryCount::getCategory,
                        HealthCategoryCount::getCount
                ));

        List<HealthRadarSummaryDto.CategoryCount> categories = Arrays.stream(HealthCategory.values())
                .map(category -> {
                    long count = countMap.getOrDefault(category, 0L);
                    return new HealthRadarSummaryDto.CategoryCount(
                            category.name(),
                            category.getDisplayName(),
                            count
                    );
                })
                .collect(Collectors.toList());

        long totalTags = categories.stream()
                .mapToLong(HealthRadarSummaryDto.CategoryCount::getCount)
                .sum();

        return new HealthRadarSummaryDto(categories, (int) totalTags);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserHealthTagDto> getUserHealthTags(Long userId) {
        List<UserHealthTag> tags = userHealthTagRepository.findByUserUserId(userId);

        return tags.stream()
                .map(this::mapToUserHealthTagDto)
                .collect(Collectors.toList());
    }

    private UserHealthTagDto mapToUserHealthTagDto(UserHealthTag tag) {
        String categoryDisplay = tag.getCategory() != null
                ? tag.getCategory().getDisplayName()
                : "Không phân loại";
        String statusDisplay = tag.getStatus() != null
                ? getStatusDisplayName(tag.getStatus())
                : "Không rõ";

        return new UserHealthTagDto(
                tag.getId(),
                tag.getTagName(),
                tag.getCategory() != null ? tag.getCategory().name() : null,
                categoryDisplay,
                tag.getStatus() != null ? tag.getStatus().name() : null,
                statusDisplay,
                tag.getNotes(),
                tag.getConfidenceScore(),
                tag.getDetectedAt()
        );
    }

    private String getStatusDisplayName(HealthStatus status) {
        return switch (status) {
            case ACTIVE -> "Đang mắc";
            case RESOLVED -> "Đã khỏi";
            case CHRONIC -> "Mãn tính";
            case UNKNOWN -> "Không rõ";
        };
    }

    private UserAdminDto mapProjectionToDto(UserCustomerSummaryProjection projection) {
        return UserAdminDto.builder()
                .id(projection.getId())
                .fullName(projection.getFullName())
                .email(projection.getEmail())
                .phoneNumber(projection.getPhoneNumber())
                .orderCount(projection.getOrderCount() == null ? 0L : projection.getOrderCount())
                .totalSpent(projection.getTotalSpent() == null ? BigDecimal.ZERO : projection.getTotalSpent())
                .createdAt(projection.getCreatedAt())
                .build();
    }
}
