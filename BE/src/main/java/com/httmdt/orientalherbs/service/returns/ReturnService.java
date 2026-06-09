package com.httmdt.orientalherbs.service.returns;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.httmdt.orientalherbs.dto.returns.RefundRequestDTO;
import com.httmdt.orientalherbs.dto.returns.ReturnRequestDTO;
import com.httmdt.orientalherbs.dto.returns.ReturnResponseDTO;
import com.httmdt.orientalherbs.model.enums.ReturnStatus;

public interface ReturnService {
    // User operations
    ReturnResponseDTO createReturnRequest(Long userId, Long orderId, ReturnRequestDTO request);
    ReturnResponseDTO getReturnByOrderId(Long userId, Long orderId);
    Page<ReturnResponseDTO> getUserReturnRequests(Long userId, Pageable pageable);

    // Admin operations
    Page<ReturnResponseDTO> getAllReturnRequests(Pageable pageable);
    Page<ReturnResponseDTO> getReturnRequestsByStatus(ReturnStatus status, Pageable pageable);
    ReturnResponseDTO getReturnRequestDetail(Long returnId);
    ReturnResponseDTO approveReturn(Long returnId, String adminNote);
    ReturnResponseDTO rejectReturn(Long returnId, String adminNote);
    ReturnResponseDTO confirmReturnReceived(Long returnId);
    ReturnResponseDTO processRefund(Long returnId, RefundRequestDTO request, org.springframework.web.multipart.MultipartFile proofImage);
}
