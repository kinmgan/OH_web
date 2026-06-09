package com.httmdt.orientalherbs.controller.admin_api;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.httmdt.orientalherbs.dto.returns.RefundRequestDTO;
import com.httmdt.orientalherbs.dto.returns.ReturnResponseDTO;
import com.httmdt.orientalherbs.model.enums.ReturnStatus;
import com.httmdt.orientalherbs.service.returns.ReturnService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/admin/returns")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ReturnAdminController {

    private final ReturnService returnService;

    /**
     * Get all return requests with pagination
     */
    @GetMapping
    public ResponseEntity<Page<ReturnResponseDTO>> getAllReturns(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<ReturnResponseDTO> returns = returnService.getAllReturnRequests(pageable);
        return ResponseEntity.ok(returns);
    }

    /**
     * Get return requests by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<Page<ReturnResponseDTO>> getReturnsByStatus(
            @PathVariable ReturnStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<ReturnResponseDTO> returns = returnService.getReturnRequestsByStatus(status, pageable);
        return ResponseEntity.ok(returns);
    }

    /**
     * Get return request detail
     */
    @GetMapping("/{returnId}")
    public ResponseEntity<ReturnResponseDTO> getReturnDetail(@PathVariable Long returnId) {
        ReturnResponseDTO response = returnService.getReturnRequestDetail(returnId);
        return ResponseEntity.ok(response);
    }

    /**
     * Approve return request
     */
    @PutMapping("/{returnId}/approve")
    public ResponseEntity<ReturnResponseDTO> approveReturn(
            @PathVariable Long returnId,
            @RequestParam(required = false) String adminNote) {

        ReturnResponseDTO response = returnService.approveReturn(returnId, adminNote);
        return ResponseEntity.ok(response);
    }

    /**
     * Reject return request
     */
    @PutMapping("/{returnId}/reject")
    public ResponseEntity<ReturnResponseDTO> rejectReturn(
            @PathVariable Long returnId,
            @RequestParam(required = false) String adminNote) {

        ReturnResponseDTO response = returnService.rejectReturn(returnId, adminNote);
        return ResponseEntity.ok(response);
    }

    /**
     * Confirm return received
     */
    @PutMapping("/{returnId}/received")
    public ResponseEntity<ReturnResponseDTO> confirmReceived(@PathVariable Long returnId) {
        ReturnResponseDTO response = returnService.confirmReturnReceived(returnId);
        return ResponseEntity.ok(response);
    }

    /**
     * Process refund
     */
    @PostMapping(value = "/{returnId}/refund", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ReturnResponseDTO> processRefund(
            @PathVariable Long returnId,
            @RequestPart("data") RefundRequestDTO request,
            @RequestPart(value = "proofImage", required = true) org.springframework.web.multipart.MultipartFile proofImage) {

        ReturnResponseDTO response = returnService.processRefund(returnId, request, proofImage);
        return ResponseEntity.ok(response);
    }
}
