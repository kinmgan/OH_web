package com.httmdt.orientalherbs.service.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.httmdt.orientalherbs.dto.user.HealthRadarSummaryDto;
import com.httmdt.orientalherbs.dto.user.UserAdminDto;
import com.httmdt.orientalherbs.dto.user.UserAdminRequestDto;
import com.httmdt.orientalherbs.dto.user.UserHealthTagDto;

import java.util.List;

public interface UserAdminService {
    Page<UserAdminDto> getCustomers(String keyword, Pageable pageable);
    UserAdminDto getCustomerById(Long id);
    UserAdminDto updateCustomer(Long id, UserAdminRequestDto requestDto);
    void deleteCustomer(Long id);
    HealthRadarSummaryDto getHealthRadarSummary();
    List<UserHealthTagDto> getUserHealthTags(Long userId);
}
