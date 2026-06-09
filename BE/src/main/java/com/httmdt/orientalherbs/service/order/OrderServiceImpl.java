package com.httmdt.orientalherbs.service.order;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.httmdt.orientalherbs.dao.catalog.ProductVariantRepository;
import com.httmdt.orientalherbs.dao.order.OrderRepository;
import com.httmdt.orientalherbs.dao.order.PaymentRepository;
import com.httmdt.orientalherbs.dao.user.UserAddressRepository;
import com.httmdt.orientalherbs.dao.user.UserRepository;
import com.httmdt.orientalherbs.dto.order.OrderDetailResponse;
import com.httmdt.orientalherbs.dto.order.OrderListItemResponse;
import com.httmdt.orientalherbs.dto.order.OrderRequest;
import com.httmdt.orientalherbs.dto.order.OrderResponse;
import com.httmdt.orientalherbs.dto.order.RefundDetailResponse;
import com.httmdt.orientalherbs.dto.order.ReturnDetailResponse;
import com.httmdt.orientalherbs.dto.pricing.PriceQuote;
import com.httmdt.orientalherbs.mapper.order.OrderMapper;
import com.httmdt.orientalherbs.model.catalog.ProductVariant;
import com.httmdt.orientalherbs.model.enums.OrderStatus;
import com.httmdt.orientalherbs.model.enums.PaymentMethod;
import com.httmdt.orientalherbs.model.enums.PaymentStatus;
import com.httmdt.orientalherbs.model.order.Order;
import com.httmdt.orientalherbs.model.order.OrderItem;
import com.httmdt.orientalherbs.model.order.Payment;
import com.httmdt.orientalherbs.model.user.User;
import com.httmdt.orientalherbs.model.user.UserAddress;
import com.httmdt.orientalherbs.service.email.EmailService;
import com.httmdt.orientalherbs.service.pricing.PricingService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final ProductVariantRepository productVariantRepository;
    private final UserRepository userRepository;
    private final UserAddressRepository userAddressRepository;
    private final PaymentRepository paymentRepository;
    private final com.httmdt.orientalherbs.dao.returns.ReturnRequestRepository returnRequestRepository;
    private final OrderMapper orderMapper;
    private final PricingService pricingService;
    private final EmailService emailService;
    
    @Override
    @Transactional
    public OrderResponse createOrder(Long userId, OrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Order order = new Order();
        order.setUser(user);
        order.setOrderStatus(request.getPaymentMethod() == PaymentMethod.COD ? OrderStatus.CONFIRMED : OrderStatus.PENDING);
        order.setShippingCarrier(request.getShippingCarrier());

        List<Long> variantIds = request.getItems().stream()
                .map(item -> item.getProductVariantId())
                .collect(Collectors.toList());
        java.util.Map<Long, PriceQuote> priceQuotes = pricingService.quoteBatch(variantIds);

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal itemsOriginalSubtotal = BigDecimal.ZERO;
        BigDecimal campaignDiscountTotal = BigDecimal.ZERO;

        List<OrderItem> orderItems = request.getItems().stream().map(itemReq -> {
            ProductVariant variant = productVariantRepository.findById(itemReq.getProductVariantId())
                    .orElseThrow(() -> new RuntimeException("Variant not found"));

            Integer currentStock = variant.getStockQuantity() == null ? 0 : variant.getStockQuantity();
            Integer orderQty = itemReq.getQuantity();
            if (orderQty == null || orderQty <= 0) {
                throw new RuntimeException("Số lượng đặt hàng không hợp lệ");
            }
            if (currentStock < orderQty) {
                throw new RuntimeException(
                        "Sản phẩm \"" + variant.getProduct().getName() + "\" - biến thể \"" + variant.getUnitName()
                                + "\" không đủ tồn kho. Còn " + currentStock + ", yêu cầu " + orderQty + ".");
            }

            variant.setStockQuantity(currentStock - orderQty);

            PriceQuote quote = priceQuotes.get(itemReq.getProductVariantId());

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProductVariant(variant);
            orderItem.setQuantity(orderQty);

            if (quote != null && quote.isHasDiscount()) {
                orderItem.setOriginalUnitPrice(quote.getOriginalPrice());
                orderItem.setUnitPrice(quote.getFinalPrice());
                orderItem.setDiscountAmount(quote.getDiscountAmount());
                orderItem.setCampaignId(quote.getCampaignId());
                orderItem.setCampaignName(quote.getCampaignName());
            } else {
                orderItem.setOriginalUnitPrice(variant.getPrice());
                orderItem.setUnitPrice(variant.getPrice());
            }
            return orderItem;
        }).collect(Collectors.toList());

        for (OrderItem item : orderItems) {
            BigDecimal itemOriginalTotal = item.getOriginalUnitPrice().multiply(new BigDecimal(item.getQuantity()));
            BigDecimal itemFinalTotal = item.getUnitPrice().multiply(new BigDecimal(item.getQuantity()));
            itemsOriginalSubtotal = itemsOriginalSubtotal.add(itemOriginalTotal);
            campaignDiscountTotal = campaignDiscountTotal.add(itemOriginalTotal.subtract(itemFinalTotal));
            subtotal = subtotal.add(itemFinalTotal);
        }

        order.setSubtotal(subtotal);
        order.setItemsOriginalSubtotal(itemsOriginalSubtotal);
        order.setCampaignDiscountAmount(campaignDiscountTotal);

        UserAddress address = userAddressRepository.findById(request.getAddressId())
                .orElseThrow(() -> new RuntimeException("Address not found"));
        order.setAddressId(address.getId());
        order.setRecipientName(address.getReceiverName());
        order.setRecipientPhone(address.getPhoneNumber());
        order.setAddressDetail(address.getDetailedAddress() + ", " + address.getWardName() + ", " + address.getDistrictName() + ", " + address.getProvinceName());

        order.setOrderItems(orderItems);

        BigDecimal totalAmount = subtotal;
        BigDecimal shippingFee = new BigDecimal("30000.00");
        order.setShippingFee(shippingFee);

        totalAmount = totalAmount.add(shippingFee);
        order.setTotalAmount(totalAmount.max(BigDecimal.ZERO));

        if (request.getPaymentMethod() == PaymentMethod.COD) {
            order.setCodAmount(totalAmount.max(BigDecimal.ZERO));
        }

        Order savedOrder = orderRepository.save(order);

        Payment payment = new Payment();
        payment.setOrder(savedOrder);
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setAmount(savedOrder.getTotalAmount());

        if (request.getPaymentMethod() == PaymentMethod.COD) {
            payment.setPaymentStatus(PaymentStatus.SUCCESS);
            payment.setPaidAt(java.time.LocalDateTime.now());
        } else {
            payment.setPaymentStatus(PaymentStatus.PENDING);
            payment.setExpiredAt(java.time.LocalDateTime.now().plusMinutes(15));
        }
        paymentRepository.save(payment);
        savedOrder.setPayment(payment);

        // Send order confirmation email for COD immediately
        if (request.getPaymentMethod() == PaymentMethod.COD) {
            try {
                java.util.Map<String, String> variables = new java.util.HashMap<>();
                variables.put("fullName", user.getFullName() != null ? user.getFullName() : "Khách hàng");
                variables.put("orderId", String.valueOf(savedOrder.getOrder_id()));
                variables.put("totalAmount", formatPrice(savedOrder.getTotalAmount()));
                variables.put("paymentMethod", getPaymentMethodLabel(request.getPaymentMethod()));
                variables.put("shippingAddress", order.getAddressDetail() != null ? order.getAddressDetail() : "");
                
                emailService.sendEmailAsync(
                    user.getEmail(),
                    "ORDER_SUCCESS",
                    variables
                );
            } catch (Exception e) {
                // Log but don't fail the order
                System.err.println("Failed to send order success email: " + e.getMessage());
                e.printStackTrace();
            }
        }

        return OrderResponse.builder()
                .orderId(savedOrder.getOrder_id())
                .totalAmount(savedOrder.getTotalAmount())
                .orderStatus(savedOrder.getOrderStatus())
                .createdAt(savedOrder.getCreatedAt())
                .paymentMethod(request.getPaymentMethod())
                .shippingCarrier(savedOrder.getShippingCarrier())
                .build();
    }

    @Override
    public Page<OrderListItemResponse> getUserOrders(Long userId, Pageable pageable) {
        return orderRepository.findByUserId(userId, pageable)
            .map(orderMapper::toListItemResponse);
    }

    @Override
    public Page<OrderListItemResponse> getUserOrdersByStatus(Long userId, OrderStatus status, Pageable pageable) {
        return orderRepository.findByUserIdAndStatus(userId, status, pageable)
            .map(orderMapper::toListItemResponse);
    }

    @Override
    public OrderDetailResponse getUserOrderDetail(Long userId, Long orderId) {
        Order order = orderRepository.findOrderWithDetails(orderId);
        if (order == null || !order.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Order not found or access denied");
        }
        OrderDetailResponse response = orderMapper.toDetailResponse(order);
        populateReturnAndRefundInfo(orderId, response);
        return response;
    }

    @Override
    public Page<OrderListItemResponse> getAllOrders(Pageable pageable) {
        return orderRepository.findAllOrders(pageable)
            .map(orderMapper::toListItemResponse);
    }

    @Override
    public Page<OrderListItemResponse> getOrdersByStatus(OrderStatus status, Pageable pageable) {
        return orderRepository.findByStatus(status, pageable)
            .map(orderMapper::toListItemResponse);
    }

    @Override
    public OrderDetailResponse getOrderDetail(Long orderId) {
        Order order = orderRepository.findOrderWithDetails(orderId);
        if (order == null) {
            throw new RuntimeException("Order not found");
        }
        OrderDetailResponse response = orderMapper.toDetailResponse(order);
        populateReturnAndRefundInfo(orderId, response);
        return response;
    }

    private void populateReturnAndRefundInfo(Long orderId, OrderDetailResponse response) {
        returnRequestRepository.findByOrderId(orderId).ifPresent(returnReq -> {
            ReturnDetailResponse returnInfo = ReturnDetailResponse.builder()
                .returnRequestId(returnReq.getId())
                .reason(returnReq.getReason().name())
                .status(returnReq.getStatus().name())
                .createdAt(returnReq.getCreatedAt())
                .evidenceImages(returnReq.getEvidenceImages())
                .build();
            response.setReturnInfo(returnInfo);

            if (returnReq.getRefundTransaction() != null) {
                RefundDetailResponse refundInfo = RefundDetailResponse.builder()
                    .refundId(returnReq.getRefundTransaction().getId())
                    .refundAmount(returnReq.getRefundTransaction().getAmount())
                    .status(returnReq.getRefundTransaction().getStatus().name())
                    .reason(returnReq.getRefundTransaction().getReason())
                    .refundedAt(returnReq.getRefundTransaction().getRefundedAt())
                    .build();
                response.setRefundInfo(refundInfo);
            }
        });
    }

    @Override
    @Transactional
    public OrderDetailResponse updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        // Validate status transition
        OrderStatus currentStatus = order.getOrderStatus();
        validateStatusTransition(currentStatus, newStatus);

        order.setOrderStatus(newStatus);
        Order savedOrder = orderRepository.save(order);

        if (newStatus == OrderStatus.DELIVERED) {
            try {
                java.util.Map<String, String> variables = new java.util.HashMap<>();
                variables.put("fullName", order.getUser().getFullName() != null ? order.getUser().getFullName() : "Khách hàng");
                variables.put("orderId", String.valueOf(savedOrder.getOrder_id()));

                emailService.sendEmailAsync(
                    order.getUser().getEmail(),
                    "DELIVERY_SUCCESS",
                    variables
                );
            } catch (Exception e) {
                // Log but don't fail the transaction
                System.err.println("Failed to send delivery success email: " + e.getMessage());
                e.printStackTrace();
            }
        }

        return orderMapper.toDetailResponse(savedOrder);
    }

    private void validateStatusTransition(OrderStatus currentStatus, OrderStatus newStatus) {
        boolean valid = switch (currentStatus) {
            case PENDING -> newStatus == OrderStatus.CONFIRMED || newStatus == OrderStatus.CANCELLED;
            case CONFIRMED -> newStatus == OrderStatus.SHIPPING || newStatus == OrderStatus.CANCELLED;
            case SHIPPING -> newStatus == OrderStatus.DELIVERED || newStatus == OrderStatus.RETURNED;
            case DELIVERED -> newStatus == OrderStatus.RETURNED;
            case CANCELLED, RETURNED -> false;
        };

        if (!valid) {
            throw new RuntimeException("Không thể chuyển từ trạng thái " + currentStatus + " sang " + newStatus);
        }
    }

    @Override
    @Transactional
    public OrderDetailResponse cancelOrder(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        // Check order belongs to user
        if (!order.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Order does not belong to user");
        }

        // Check order status - only PENDING or CONFIRMED can be cancelled
        if (order.getOrderStatus() != OrderStatus.PENDING && order.getOrderStatus() != OrderStatus.CONFIRMED) {
            throw new RuntimeException("Only pending or confirmed orders can be cancelled");
        }

        // Check if shipment exists and has been created
        if (order.getShipment() != null && 
            order.getShipment().getShipmentStatus() != com.httmdt.orientalherbs.model.enums.ShipmentStatus.PENDING) {
            throw new RuntimeException("Cannot cancel order - shipment has already been processed");
        }

        // Restore stock for each order item
        for (OrderItem item : order.getOrderItems()) {
            ProductVariant variant = item.getProductVariant();
            Integer currentStock = variant.getStockQuantity() != null ? variant.getStockQuantity() : 0;
            variant.setStockQuantity(currentStock + item.getQuantity());
            productVariantRepository.save(variant);
        }

        // Update order status to CANCELLED
        order.setOrderStatus(OrderStatus.CANCELLED);
        Order savedOrder = orderRepository.save(order);

        // Fetch order with all details for response
        Order orderWithDetails = orderRepository.findOrderWithDetails(orderId);
        return orderMapper.toDetailResponse(orderWithDetails);
    }

    private String formatPrice(java.math.BigDecimal amount) {
        if (amount == null) return "0";
        java.text.NumberFormat nf = java.text.NumberFormat.getInstance(new java.util.Locale("vi", "VN"));
        return nf.format(amount) + " ₫";
    }

    private String getPaymentMethodLabel(com.httmdt.orientalherbs.model.enums.PaymentMethod method) {
        if (method == null) return "Không xác định";
        return switch (method) {
            case COD -> "Thanh toán khi nhận hàng (COD)";
            case BANK_TRANSFER -> "Chuyển khoản ngân hàng";
            case VNPAY -> "VNPAY";
            case MOMO -> "MoMo";
            default -> throw new IllegalArgumentException("Unexpected value: " + method);
        };
    }
}
