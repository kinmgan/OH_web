package com.httmdt.orientalherbs.service.marketing_and_campaign;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.httmdt.orientalherbs.dao.catalog.ProductVariantRepository;
import com.httmdt.orientalherbs.dao.marketing_and_campaign.CampaignProductVariantRepository;
import com.httmdt.orientalherbs.dao.marketing_and_campaign.CampaignRepository;
import com.httmdt.orientalherbs.dao.marketing_and_campaign.EmailCampaignRepository;
import com.httmdt.orientalherbs.dao.email.EmailTemplateRepository;
import com.httmdt.orientalherbs.dto.common.PageResponseDto;
import com.httmdt.orientalherbs.dto.marketing_and_campaign.CampaignCreateRequest;
import com.httmdt.orientalherbs.dto.marketing_and_campaign.CampaignListItemResponse;
import com.httmdt.orientalherbs.dto.marketing_and_campaign.CampaignProductVariantRequest;
import com.httmdt.orientalherbs.dto.marketing_and_campaign.CampaignProductVariantResponse;
import com.httmdt.orientalherbs.dto.marketing_and_campaign.CampaignResponse;
import com.httmdt.orientalherbs.dto.marketing_and_campaign.CampaignStatusUpdateRequest;
import com.httmdt.orientalherbs.dto.marketing_and_campaign.CampaignUpdateRequest;
import com.httmdt.orientalherbs.model.catalog.ProductVariant;
import com.httmdt.orientalherbs.model.email.EmailTemplate;
import com.httmdt.orientalherbs.model.enums.CampaignStatus;
import com.httmdt.orientalherbs.model.enums.CampaignType;
import com.httmdt.orientalherbs.model.enums.DiscountType;
import com.httmdt.orientalherbs.model.marketing_and_campaign.Campaign;
import com.httmdt.orientalherbs.model.marketing_and_campaign.CampaignProductVariant;
import com.httmdt.orientalherbs.model.marketing_and_campaign.EmailCampaign;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CampaignServiceImpl implements CampaignService {

    private final CampaignRepository campaignRepository;
    private final CampaignProductVariantRepository campaignProductVariantRepository;
    private final ProductVariantRepository productVariantRepository;
    private final EmailCampaignRepository emailCampaignRepository;
    private final EmailTemplateRepository emailTemplateRepository;
    private final EmailCampaignSender emailCampaignSender;

    // ===========================
    // CREATE
    // ===========================

    @Override
    @Transactional
    public CampaignResponse createCampaign(CampaignCreateRequest request) {
        Campaign campaign;

        if (request.getType() == CampaignType.EMAIL) {
            EmailCampaign emailCampaign = new EmailCampaign();
            emailCampaign.setName(request.getName());
            emailCampaign.setDescription(request.getDescription());
            emailCampaign.setType(request.getType());
            emailCampaign.setStartDate(request.getStartDate());
            emailCampaign.setEndDate(request.getEndDate());
            emailCampaign.setScheduledAt(request.getScheduledAt());
            emailCampaign.setStatus(CampaignStatus.DRAFT);
            emailCampaign.setDisplayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0);

            emailCampaign.setTargetHealthCategory(request.getTargetHealthCategory());

            if (request.getTemplateId() != null) {
                EmailTemplate template = emailTemplateRepository.findById(request.getTemplateId()).orElse(null);
                emailCampaign.setTemplate(template);
            }

            EmailCampaign saved = emailCampaignRepository.save(emailCampaign);

            // EMAIL campaign cũng có thể gắn sản phẩm (optional)
            if (request.getItems() != null && !request.getItems().isEmpty()) {
                for (CampaignProductVariantRequest itemReq : request.getItems()) {
                    CampaignProductVariant item = createCampaignProductVariant(saved, itemReq);
                    saved.getProductVariants().add(item);
                }
                emailCampaignRepository.save(saved);
            }

            campaign = saved;

        } else {
            // WEB campaign
            campaign = new Campaign();
            campaign.setName(request.getName());
            campaign.setDescription(request.getDescription());
            campaign.setType(request.getType());
            campaign.setStartDate(request.getStartDate());
            campaign.setEndDate(request.getEndDate());
            campaign.setScheduledAt(request.getScheduledAt());
            campaign.setStatus(CampaignStatus.DRAFT);
            campaign.setDisplayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0);

            Campaign savedCampaign = campaignRepository.save(campaign);

            if (request.getItems() != null && !request.getItems().isEmpty()) {
                for (CampaignProductVariantRequest itemReq : request.getItems()) {
                    CampaignProductVariant item = createCampaignProductVariant(savedCampaign, itemReq);
                    savedCampaign.getProductVariants().add(item);
                }
                savedCampaign = campaignRepository.save(savedCampaign);
            }
            campaign = savedCampaign;
        }

        return toResponse(campaign);
    }

    // ===========================
    // UPDATE
    // ===========================

    @Override
    @Transactional
    public CampaignResponse updateCampaign(Long id, CampaignUpdateRequest request) {
        Campaign campaign = campaignRepository.findByIdWithItems(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found: " + id));

        if (campaign.getStatus() == CampaignStatus.COMPLETED || campaign.getStatus() == CampaignStatus.CANCELLED) {
            throw new RuntimeException("Không thể sửa chiến dịch đã kết thúc hoặc đã hủy");
        }

        // Cập nhật các field chung
        campaign.setName(request.getName());
        campaign.setDescription(request.getDescription());
        campaign.setStartDate(request.getStartDate());
        campaign.setEndDate(request.getEndDate());
        campaign.setScheduledAt(request.getScheduledAt());

        if (request.getDisplayOrder() != null) {
            campaign.setDisplayOrder(request.getDisplayOrder());
        }

        // Cập nhật items (sản phẩm) – áp dụng cho cả WEB và EMAIL
        if (request.getItems() != null) {
            campaign.getProductVariants().clear();
            for (CampaignProductVariantRequest itemReq : request.getItems()) {
                CampaignProductVariant item = createCampaignProductVariant(campaign, itemReq);
                campaign.getProductVariants().add(item);
            }
        }

        // Nếu là EMAIL campaign: cập nhật thêm các field riêng
        if (campaign instanceof EmailCampaign emailCampaign) {

            emailCampaign.setTargetHealthCategory(request.getTargetHealthCategory());

            if (request.getTemplateId() != null) {
                EmailTemplate template = emailTemplateRepository.findById(request.getTemplateId()).orElse(null);
                emailCampaign.setTemplate(template);
            } else {
                emailCampaign.setTemplate(null);
            }

            EmailCampaign saved = emailCampaignRepository.save(emailCampaign);
            return toResponse(saved);
        }

        Campaign savedCampaign = campaignRepository.save(campaign);
        return toResponse(savedCampaign);
    }

    // ===========================
    // READ
    // ===========================

    @Override
    @Transactional(readOnly = true)
    public CampaignResponse getCampaign(Long id) {
        Campaign campaign = campaignRepository.findByIdWithItems(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found: " + id));
        return toResponse(campaign);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponseDto<CampaignListItemResponse> getCampaigns(CampaignType type, CampaignStatus status,
            String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        String safeKeyword = keyword == null ? "" : keyword;
        Page<Campaign> campaignPage = campaignRepository.findByFilters(type, status, safeKeyword, pageable);

        List<CampaignListItemResponse> content = campaignPage.getContent().stream()
                .map(this::toListItemResponse)
                .collect(Collectors.toList());

        PageResponseDto<CampaignListItemResponse> response = new PageResponseDto<>();
        response.setContent(content);
        response.setPageNo(campaignPage.getNumber());
        response.setPageSize(campaignPage.getSize());
        response.setTotalElements(campaignPage.getTotalElements());
        response.setTotalPages(campaignPage.getTotalPages());
        response.setLast(campaignPage.isLast());

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CampaignResponse> getActiveWebCampaigns() {
        List<Campaign> campaigns = campaignRepository.findActiveCampaigns(
                CampaignType.WEB, CampaignStatus.ACTIVE, LocalDateTime.now());
        return campaigns.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ===========================
    // DELETE / STATUS
    // ===========================

    @Override
    @Transactional
    public void deleteOrCancelCampaign(Long id) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found: " + id));

        if (campaign.getStatus() == CampaignStatus.ACTIVE || campaign.getStatus() == CampaignStatus.SCHEDULED) {
            campaign.setStatus(CampaignStatus.CANCELLED);
            campaignRepository.save(campaign);
        } else {
            campaignRepository.delete(campaign);
        }
    }

    @Override
    @Transactional
    public CampaignResponse updateStatus(Long id, CampaignStatusUpdateRequest request) {
        Campaign campaign = campaignRepository.findByIdWithItems(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found: " + id));

        CampaignStatus currentStatus = campaign.getStatus();
        CampaignStatus newStatus = request.getStatus();

        if (currentStatus == CampaignStatus.COMPLETED || currentStatus == CampaignStatus.CANCELLED) {
            throw new RuntimeException("Không thể thay đổi trạng thái của chiến dịch đã " + currentStatus);
        }

        if (newStatus == CampaignStatus.ACTIVE) {
            LocalDateTime now = LocalDateTime.now();

            if (campaign.getType() == CampaignType.EMAIL) {
                // ---- Logic EMAIL campaign: dùng scheduledAt ----
                EmailCampaign emailCampaign = (EmailCampaign) campaign;
                LocalDateTime scheduledAt = emailCampaign.getScheduledAt();

                if (scheduledAt != null && scheduledAt.isAfter(now)) {
                    // scheduledAt ở tương lai → SCHEDULED, scheduler sẽ gửi đúng giờ
                    newStatus = CampaignStatus.SCHEDULED;
                } else {
                    // scheduledAt đã qua hoặc không điền → ACTIVE và gửi ngay
                    newStatus = CampaignStatus.ACTIVE;
                }

                campaign.setStatus(newStatus);
                Campaign savedCampaign = campaignRepository.save(campaign);

                if (newStatus == CampaignStatus.ACTIVE) {
                    // Gửi email ngay lập tức (bất đồng bộ)
                    emailCampaignSender.sendEmailCampaign(campaign.getId());
                }

                return toResponse(savedCampaign);

            } else {
                // ---- Logic WEB campaign: dùng startDate ----
                if (campaign.getStartDate() == null || campaign.getEndDate() == null) {
                    throw new RuntimeException("Chiến dịch WEB cần có ngày bắt đầu và ngày kết thúc");
                }

                if (now.isAfter(campaign.getEndDate())) {
                    throw new RuntimeException("Không thể kích hoạt chiến dịch đã quá ngày kết thúc");
                }

                if (now.isBefore(campaign.getStartDate())) {
                    // startDate ở tương lai → SCHEDULED
                    newStatus = CampaignStatus.SCHEDULED;
                }

                validateNoOverlap(
                        campaign.getProductVariants().stream()
                                .map(item -> item.getProductVariant().getProductVariantId())
                                .collect(Collectors.toList()),
                        campaign.getStartDate(),
                        campaign.getEndDate(),
                        campaign.getId());
            }
        }

        campaign.setStatus(newStatus);
        Campaign savedCampaign = campaignRepository.save(campaign);
        return toResponse(savedCampaign);
    }

    // ===========================
    // VALIDATION
    // ===========================

    @Override
    public void validateNoOverlap(List<Long> variantIds, LocalDateTime startDate, LocalDateTime endDate,
            Long excludeCampaignId) {
        if (variantIds == null || variantIds.isEmpty()) {
            return;
        }

        for (Long variantId : variantIds) {
            List<CampaignProductVariant> overlapping = campaignProductVariantRepository
                    .findOverlappingCampaigns(variantId, startDate, endDate);

            if (excludeCampaignId != null) {
                overlapping = overlapping.stream()
                        .filter(cpv -> !cpv.getCampaign().getId().equals(excludeCampaignId))
                        .collect(Collectors.toList());
            }

            if (!overlapping.isEmpty()) {
                CampaignProductVariant overlap = overlapping.get(0);
                throw new RuntimeException("Variant " + variantId + " đang có chiến dịch khác trùng thời gian: " +
                        overlap.getCampaign().getName() +
                        " (từ " + overlap.getCampaign().getStartDate() + " đến " + overlap.getCampaign().getEndDate()
                        + ")");
            }
        }
    }

    // ===========================
    // PRIVATE HELPERS
    // ===========================

    private CampaignProductVariant createCampaignProductVariant(Campaign campaign,
            CampaignProductVariantRequest itemReq) {
        ProductVariant variant = productVariantRepository.findById(itemReq.getProductVariantId())
                .orElseThrow(() -> new RuntimeException("Product variant not found: " + itemReq.getProductVariantId()));

        BigDecimal originalPrice = variant.getPrice();
        BigDecimal discountAmount;
        BigDecimal finalPrice;

        if (itemReq.getDiscountType() == DiscountType.PERCENTAGE) {
            if (itemReq.getDiscountValue().doubleValue() < 0 || itemReq.getDiscountValue().doubleValue() > 100) {
                throw new RuntimeException("Phần trăm giảm giá phải từ 0 đến 100");
            }
            discountAmount = originalPrice.multiply(itemReq.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            if (itemReq.getDiscountValue().compareTo(originalPrice) >= 0) {
                throw new RuntimeException("Giá trị giảm cố định phải nhỏ hơn giá gốc");
            }
            if (itemReq.getDiscountValue().compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("Giá trị giảm giá không được âm");
            }
            discountAmount = itemReq.getDiscountValue();
        }

        finalPrice = originalPrice.subtract(discountAmount);

        CampaignProductVariant item = new CampaignProductVariant();
        item.setCampaign(campaign);
        item.setProductVariant(variant);
        item.setDiscountType(itemReq.getDiscountType());
        item.setDiscountValue(itemReq.getDiscountValue());
        item.setOriginalPriceSnapshot(originalPrice);
        item.setDiscountAmountSnapshot(discountAmount);
        item.setFinalPriceSnapshot(finalPrice);
        item.setDisplayOrder(itemReq.getDisplayOrder() != null ? itemReq.getDisplayOrder() : 0);

        return item;
    }

    private CampaignResponse toResponse(Campaign campaign) {
        List<CampaignProductVariantResponse> items = new ArrayList<>();

        if (campaign.getProductVariants() != null) {
            for (CampaignProductVariant cpv : campaign.getProductVariants()) {
                String imageUrl = null;
                if (cpv.getProductVariant().getProduct().getImages() != null
                        && !cpv.getProductVariant().getProduct().getImages().isEmpty()) {
                    imageUrl = cpv.getProductVariant().getProduct().getImages().stream()
                            .filter(img -> Boolean.TRUE.equals(img.getIsDefault()))
                            .findFirst()
                            .orElse(cpv.getProductVariant().getProduct().getImages().get(0))
                            .getProductImageUrl();
                }

                items.add(CampaignProductVariantResponse.builder()
                        .id(cpv.getId())
                        .productId(cpv.getProductVariant().getProduct().getId())
                        .productName(cpv.getProductVariant().getProduct().getName())
                        .productVariantId(cpv.getProductVariant().getProductVariantId())
                        .unitName(cpv.getProductVariant().getUnitName())
                        .originalPrice(cpv.getOriginalPriceSnapshot())
                        .discountType(cpv.getDiscountType())
                        .discountValue(cpv.getDiscountValue())
                        .discountAmount(cpv.getDiscountAmountSnapshot())
                        .finalPrice(cpv.getFinalPriceSnapshot())
                        .displayOrder(cpv.getDisplayOrder())
                        .imageUrl(imageUrl)
                        .build());
            }
        }

        CampaignResponse.CampaignResponseBuilder builder = CampaignResponse.builder()
                .id(campaign.getId())
                .name(campaign.getName())
                .description(campaign.getDescription())
                .type(campaign.getType())
                .status(campaign.getStatus())
                .startDate(campaign.getStartDate())
                .endDate(campaign.getEndDate())
                .scheduledAt(campaign.getScheduledAt())
                .createdAt(campaign.getCreatedAt())
                .updatedAt(campaign.getUpdatedAt())
                .items(items)
                .displayOrder(campaign.getDisplayOrder() != null ? campaign.getDisplayOrder() : 0);

        // Nếu là EmailCampaign: thêm các field riêng
        if (campaign instanceof EmailCampaign emailCampaign) {

            builder.targetHealthCategory(emailCampaign.getTargetHealthCategory())
                    .totalSent(emailCampaign.getTotalSent())
                    .templateId(emailCampaign.getTemplate() != null ? emailCampaign.getTemplate().getId() : null);
        }

        return builder.build();
    }

    private CampaignListItemResponse toListItemResponse(Campaign campaign) {
        CampaignListItemResponse.CampaignListItemResponseBuilder builder = CampaignListItemResponse.builder()
                .id(campaign.getId())
                .name(campaign.getName())
                .type(campaign.getType())
                .status(campaign.getStatus())
                .startDate(campaign.getStartDate())
                .endDate(campaign.getEndDate())
                .scheduledAt(campaign.getScheduledAt())
                .itemCount(campaign.getProductVariants() != null ? campaign.getProductVariants().size() : 0)
                .displayOrder(campaign.getDisplayOrder() != null ? campaign.getDisplayOrder() : 0);

        if (campaign instanceof EmailCampaign emailCampaign) {
            builder.totalSent(emailCampaign.getTotalSent());
        }

        return builder.build();
    }
}
