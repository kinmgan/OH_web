package com.httmdt.orientalherbs.controller.admin_api;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.httmdt.orientalherbs.dto.user.HealthRadarSummaryDto;
import com.httmdt.orientalherbs.dto.user.UserAdminDto;
import com.httmdt.orientalherbs.dto.user.UserAdminRequestDto;
import com.httmdt.orientalherbs.dto.user.UserHealthTagDto;
import com.httmdt.orientalherbs.service.user.UserAdminService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/admin/customers")
@RequiredArgsConstructor
public class UserAdminController {
    private final UserAdminService userAdminService;

    @GetMapping
    public ResponseEntity<Page<UserAdminDto>> getCustomers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(userAdminService.getCustomers(keyword, pageable));
    }

    @GetMapping("/health-radar")
    public ResponseEntity<HealthRadarSummaryDto> getHealthRadarSummary() {
        return ResponseEntity.ok(userAdminService.getHealthRadarSummary());
    }

    @GetMapping("/{id}/health-tags")
    public ResponseEntity<List<UserHealthTagDto>> getUserHealthTags(@PathVariable Long id) {
        return ResponseEntity.ok(userAdminService.getUserHealthTags(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserAdminDto> getCustomerById(@PathVariable Long id) {
        return ResponseEntity.ok(userAdminService.getCustomerById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserAdminDto> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody UserAdminRequestDto requestDto) {
        return ResponseEntity.ok(userAdminService.updateCustomer(id, requestDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) {
        userAdminService.deleteCustomer(id);
        return ResponseEntity.noContent().build();
    }
}
