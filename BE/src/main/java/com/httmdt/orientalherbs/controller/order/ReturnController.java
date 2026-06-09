package com.httmdt.orientalherbs.controller.order;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.httmdt.orientalherbs.dto.returns.ReturnRequestDTO;
import com.httmdt.orientalherbs.dto.returns.ReturnResponseDTO;
import com.httmdt.orientalherbs.security.user.CustomUserDetails;
import com.httmdt.orientalherbs.service.returns.ReturnService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class ReturnController {

    private final ReturnService returnService;

    /**
     * User creates a return request for an order
     */
    @PostMapping("/{orderId}/return")
    public ResponseEntity<ReturnResponseDTO> createReturnRequest(
            @PathVariable Long orderId,
            @RequestBody ReturnRequestDTO request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

          Long userId = userDetails.getId();
        ReturnResponseDTO response = returnService.createReturnRequest(userId, orderId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * User gets return request for an order
     */
    @GetMapping("/{orderId}/return")
    public ResponseEntity<ReturnResponseDTO> getReturnByOrderId(
            @PathVariable Long orderId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

          Long userId = userDetails.getId();
        ReturnResponseDTO response = returnService.getReturnByOrderId(userId, orderId);
        return ResponseEntity.ok(response);
    }

    /**
     * User gets their list of return requests
     */
    @GetMapping("/my-returns")
    public ResponseEntity<Page<ReturnResponseDTO>> getMyReturns(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

          Long userId = userDetails.getId();
        Pageable pageable = PageRequest.of(page, size);
        Page<ReturnResponseDTO> returns = returnService.getUserReturnRequests(userId, pageable);
        return ResponseEntity.ok(returns);
    }
}
