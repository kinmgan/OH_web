package com.httmdt.orientalherbs.service.returns.impl;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.httmdt.orientalherbs.dao.order.OrderRepository;
import com.httmdt.orientalherbs.dao.returns.RefundTransactionRepository;
import com.httmdt.orientalherbs.dao.returns.ReturnItemRepository;
import com.httmdt.orientalherbs.dao.returns.ReturnRequestRepository;
import com.httmdt.orientalherbs.dao.user.UserRepository;
import com.httmdt.orientalherbs.dto.returns.RefundRequestDTO;
import com.httmdt.orientalherbs.dto.returns.ReturnRequestDTO;
import com.httmdt.orientalherbs.dto.returns.ReturnResponseDTO;
import com.httmdt.orientalherbs.model.enums.OrderStatus;
import com.httmdt.orientalherbs.model.enums.RefundStatus;
import com.httmdt.orientalherbs.model.enums.ReturnStatus;
import com.httmdt.orientalherbs.model.order.Order;
import com.httmdt.orientalherbs.model.order.OrderItem;
import com.httmdt.orientalherbs.model.returns.RefundTransaction;
import com.httmdt.orientalherbs.model.returns.ReturnItem;
import com.httmdt.orientalherbs.model.returns.ReturnRequest;
import com.httmdt.orientalherbs.model.user.User;
import com.httmdt.orientalherbs.service.returns.ReturnService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReturnServiceImpl implements ReturnService {

    private final ReturnRequestRepository returnRequestRepository;
    private final ReturnItemRepository returnItemRepository;
    private final RefundTransactionRepository refundTransactionRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final com.httmdt.orientalherbs.service.CloudinaryService cloudinaryService;

    @Override
    @Transactional
    public ReturnResponseDTO createReturnRequest(Long userId, Long orderId, ReturnRequestDTO request) {
        // Validate order
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Check order belongs to user
        if (!order.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Order does not belong to user");
        }

        // Check order status is DELIVERED
        if (order.getOrderStatus() != OrderStatus.DELIVERED) {
            throw new RuntimeException("Only delivered orders can be returned");
        }

        // Check if return request already exists
        if (returnRequestRepository.findByOrderId(orderId).isPresent()) {
            throw new RuntimeException("Return request already exists for this order");
        }

        // Check items
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new RuntimeException("At least one item is required for return");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Create return request
        ReturnRequest returnRequest = new ReturnRequest();
        returnRequest.setUser(user);
        returnRequest.setOrder(order);
        returnRequest.setReason(request.getReason());
        returnRequest.setDescription(request.getDescription());
        returnRequest.setEvidenceImages(request.getEvidenceImages() != null ? request.getEvidenceImages() : new java.util.ArrayList<>());
        returnRequest.setStatus(ReturnStatus.PENDING);

        // Create return items
        List<ReturnItem> returnItems = request.getItems().stream()
                .map(itemDto -> {
                    OrderItem orderItem = order.getOrderItems().stream()
                            .filter(oi -> oi.getId().equals(itemDto.getOrderItemId()))
                            .findFirst()
                            .orElseThrow(() -> new RuntimeException("Order item not found: " + itemDto.getOrderItemId()));

                    ReturnItem returnItem = new ReturnItem();
                    returnItem.setReturnRequest(returnRequest);
                    returnItem.setOrderItem(orderItem);
                    returnItem.setQuantity(itemDto.getQuantity());
                    returnItem.setConditionNoted(itemDto.getConditionNoted());
                    return returnItem;
                })
                .collect(Collectors.toList());

        returnRequest.setReturnItems(returnItems);
        ReturnRequest saved = returnRequestRepository.save(returnRequest);

        return toResponseDTO(saved);
    }

    @Override
    public ReturnResponseDTO getReturnByOrderId(Long userId, Long orderId) {
        ReturnRequest returnRequest = returnRequestRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Return request not found"));

        if (!returnRequest.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        return toResponseDTO(returnRequest);
    }

    @Override
    public Page<ReturnResponseDTO> getUserReturnRequests(Long userId, Pageable pageable) {
        return returnRequestRepository.findByUserId(userId, pageable)
                .map(this::toResponseDTO);
    }

    @Override
    public Page<ReturnResponseDTO> getAllReturnRequests(Pageable pageable) {
        return returnRequestRepository.findAll(pageable)
                .map(this::toResponseDTO);
    }

    @Override
    public Page<ReturnResponseDTO> getReturnRequestsByStatus(ReturnStatus status, Pageable pageable) {
        Page<ReturnRequest> allReturns = returnRequestRepository.findAll(pageable);
        List<ReturnResponseDTO> filtered = allReturns.getContent().stream()
                .map(this::toResponseDTO)
                .filter(dto -> dto.getStatus() == status)
                .collect(Collectors.toList());
        return new PageImpl<>(filtered, pageable, filtered.size());
    }

    @Override
    public ReturnResponseDTO getReturnRequestDetail(Long returnId) {
        ReturnRequest returnRequest = returnRequestRepository.findByIdWithItems(returnId)
                .orElseThrow(() -> new RuntimeException("Return request not found"));
        return toResponseDTO(returnRequest);
    }

    @Override
    @Transactional
    public ReturnResponseDTO approveReturn(Long returnId, String adminNote) {
        ReturnRequest returnRequest = returnRequestRepository.findById(returnId)
                .orElseThrow(() -> new RuntimeException("Return request not found"));

        if (returnRequest.getStatus() != ReturnStatus.PENDING) {
            throw new RuntimeException("Can only approve pending return requests");
        }

        returnRequest.setStatus(ReturnStatus.APPROVED);
        ReturnRequest saved = returnRequestRepository.save(returnRequest);

        // Update order status
        Order order = returnRequest.getOrder();
        order.setOrderStatus(OrderStatus.RETURNED);
        orderRepository.save(order);

        return toResponseDTO(saved);
    }

    @Override
    @Transactional
    public ReturnResponseDTO rejectReturn(Long returnId, String adminNote) {
        ReturnRequest returnRequest = returnRequestRepository.findById(returnId)
                .orElseThrow(() -> new RuntimeException("Return request not found"));

        if (returnRequest.getStatus() != ReturnStatus.PENDING) {
            throw new RuntimeException("Can only reject pending return requests");
        }

        returnRequest.setStatus(ReturnStatus.REJECTED);
        ReturnRequest saved = returnRequestRepository.save(returnRequest);

        return toResponseDTO(saved);
    }

    @Override
    @Transactional
    public ReturnResponseDTO confirmReturnReceived(Long returnId) {
        ReturnRequest returnRequest = returnRequestRepository.findById(returnId)
                .orElseThrow(() -> new RuntimeException("Return request not found"));

        if (returnRequest.getStatus() != ReturnStatus.APPROVED) {
            throw new RuntimeException("Can only confirm received for approved return requests");
        }

        returnRequest.setStatus(ReturnStatus.RECEIVED);
        ReturnRequest saved = returnRequestRepository.save(returnRequest);

        return toResponseDTO(saved);
    }

    @Override
    @Transactional
    public ReturnResponseDTO processRefund(Long returnId, RefundRequestDTO request, org.springframework.web.multipart.MultipartFile proofImage) {
        ReturnRequest returnRequest = returnRequestRepository.findById(returnId)
                .orElseThrow(() -> new RuntimeException("Return request not found"));

        if (returnRequest.getStatus() != ReturnStatus.RECEIVED) {
            throw new RuntimeException("Can only process refund for received return requests");
        }

        // Create refund transaction
        RefundTransaction refund = new RefundTransaction();
        refund.setReturnRequest(returnRequest);
        refund.setAmount(request.getAmount());
        refund.setRefundMethod(request.getMethod());
        refund.setStatus(RefundStatus.SUCCESS);

        if (proofImage != null && !proofImage.isEmpty()) {
            try {
                java.util.Map<String, Object> uploadResult = cloudinaryService.uploadImage(proofImage, "oriental_herbs/refunds");
                refund.setProofImage(uploadResult.get("url").toString());
            } catch (java.io.IOException e) {
                throw new RuntimeException("Failed to upload proof image", e);
            }
        } else {
            throw new RuntimeException("Proof image is required for refund");
        }
        refundTransactionRepository.save(refund);

        returnRequest.setStatus(ReturnStatus.REFUNDED);
        ReturnRequest saved = returnRequestRepository.save(returnRequest);

        // In real implementation, trigger actual refund via payment gateway here
        // For now, mark as PENDING and admin will manually process

        return toResponseDTO(saved);
    }

    private ReturnResponseDTO toResponseDTO(ReturnRequest returnRequest) {
        List<ReturnResponseDTO.ReturnItemResponseDTO> itemDTOs = returnRequest.getReturnItems().stream()
                .map(item -> ReturnResponseDTO.ReturnItemResponseDTO.builder()
                        .returnItemId(item.getId())
                        .orderItemId(item.getOrderItem().getId())
                        .productName(item.getOrderItem().getProductVariant().getProduct().getName())
                        .productImage(getProductImage(item.getOrderItem()))
                        .variantInfo(item.getOrderItem().getProductVariant().getUnitName())
                        .quantity(item.getQuantity())
                        .conditionNoted(item.getConditionNoted())
                        .build())
                .collect(Collectors.toList());

        ReturnResponseDTO.RefundInfoDTO refundInfo = null;
        if (returnRequest.getRefundTransaction() != null) {
            RefundTransaction refund = returnRequest.getRefundTransaction();
            refundInfo = ReturnResponseDTO.RefundInfoDTO.builder()
                    .refundId(refund.getId())
                    .amount(refund.getAmount())
                    .method(refund.getRefundMethod())
                    .status(refund.getStatus().name())
                    .proofImage(refund.getProofImage())
                    .build();
        }

        return ReturnResponseDTO.builder()
                .returnRequestId(returnRequest.getId())
                .orderId(returnRequest.getOrder().getOrder_id())
                .orderCode("ORD-" + String.format("%06d", returnRequest.getOrder().getOrder_id()))
                .reason(returnRequest.getReason())
                .description(returnRequest.getDescription())
                .evidenceImages(returnRequest.getEvidenceImages())
                .status(returnRequest.getStatus())
                .createdAt(returnRequest.getCreatedAt())
                .items(itemDTOs)
                .refundInfo(refundInfo)
                .build();
    }

    private String getProductImage(OrderItem item) {
        if (item.getProductVariant() != null && 
            item.getProductVariant().getProduct() != null &&
            item.getProductVariant().getProduct().getImages() != null &&
            !item.getProductVariant().getProduct().getImages().isEmpty()) {
            return item.getProductVariant().getProduct().getImages().get(0).getProductImageUrl();
        }
        return null;
    }
}
