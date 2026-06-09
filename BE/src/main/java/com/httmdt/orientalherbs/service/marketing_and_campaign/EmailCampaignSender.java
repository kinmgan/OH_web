package com.httmdt.orientalherbs.service.marketing_and_campaign;

import com.httmdt.orientalherbs.dao.marketing_and_campaign.EmailSendLogRepository;
import com.httmdt.orientalherbs.dao.marketing_and_campaign.EmailCampaignRepository;
import com.httmdt.orientalherbs.dao.user.UserRepository;
import com.httmdt.orientalherbs.dao.user.UserHealthTagRepository;
import com.httmdt.orientalherbs.model.enums.EmailSendStatus;
import com.httmdt.orientalherbs.model.enums.HealthCategory;
import com.httmdt.orientalherbs.model.enums.UserRole;
import com.httmdt.orientalherbs.model.marketing_and_campaign.EmailCampaign;
import com.httmdt.orientalherbs.model.marketing_and_campaign.EmailSendLog;
import com.httmdt.orientalherbs.model.user.User;
import com.httmdt.orientalherbs.service.email.EmailService;
import com.httmdt.orientalherbs.util.EmailTemplateRenderer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailCampaignSender {

    private final EmailCampaignRepository emailCampaignRepository;
    private final UserRepository userRepository;
    private final UserHealthTagRepository userHealthTagRepository;
    private final EmailSendLogRepository emailSendLogRepository;
    private final EmailService emailService;
    private final EmailTemplateRenderer renderer;

    @org.springframework.beans.factory.annotation.Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Async
    @Transactional
    public void sendEmailCampaign(Long emailCampaignId) {
        log.info("[EmailCampaign] Starting bulk send for campaign ID: {}", emailCampaignId);

        EmailCampaign emailCampaign = emailCampaignRepository.findById(emailCampaignId)
                .orElse(null);

        if (emailCampaign == null) {
            log.error("[EmailCampaign] Campaign not found: {}", emailCampaignId);
            return;
        }

        if (emailCampaign.getTemplate() == null) {
            log.error("[EmailCampaign] Campaign {} has no template assigned", emailCampaignId);
            return;
        }

        HealthCategory targetCategory = emailCampaign.getTargetHealthCategory();
        List<User> users;

        if (targetCategory != null) {
            users = userHealthTagRepository.findUsersByHealthTag(targetCategory);
            log.info("[EmailCampaign] Targeting {} users with health category: {} ({})",
                    users.size(), targetCategory.name(), targetCategory.getDisplayName());
        } else {
            users = userRepository.findAllUsersWithRole(UserRole.ROLE_USER);
            log.info("[EmailCampaign] Targeting all {} users (no health category filter)", users.size());
        }

        int successCount = 0;
        int failCount = 0;

        for (User user : users) {
            String email = user.getEmail();
            if (email == null || email.isBlank()) {
                log.warn("[EmailCampaign] Skipping user {} - no email", user.getUserId());
                continue;
            }

            Map<String, String> variables = new HashMap<>();
            variables.put("fullName", user.getFullName() != null ? user.getFullName() : "Khach hang");
            variables.put("campaignName", emailCampaign.getName());
            variables.put("campaignDescription", emailCampaign.getDescription() != null ? emailCampaign.getDescription() : "");

            EmailSendLog sendLog = new EmailSendLog();
            sendLog.setEmailCampaign(emailCampaign);
            sendLog.setUser(user);
            sendLog.setRecipientEmail(email);
            sendLog.setSentAt(LocalDateTime.now());
            sendLog.setStatus(EmailSendStatus.SUCCESS);

            try {
                String subject = renderer.render(emailCampaign.getTemplate().getSubject(), variables);
                String baseBodyHtml = renderer.render(emailCampaign.getTemplate().getBodyHtml(), variables);

                StringBuilder productsHtml = new StringBuilder();
                List<com.httmdt.orientalherbs.model.marketing_and_campaign.CampaignProductVariant> variants = emailCampaign.getProductVariants();
                if (variants != null && !variants.isEmpty()) {
                    productsHtml.append("<div style=\"margin-top: 30px; font-family: sans-serif;\">");
                    productsHtml.append("<h3 style=\"color: #A57322; border-bottom: 1px solid #eee; padding-bottom: 10px;\">Sản phẩm ưu đãi trong chiến dịch:</h3>");
                    productsHtml.append("<table style=\"width: 100%; border-collapse: collapse;\">");
                    
                    for (com.httmdt.orientalherbs.model.marketing_and_campaign.CampaignProductVariant cpv : variants) {
                        com.httmdt.orientalherbs.model.catalog.ProductVariant pv = cpv.getProductVariant();
                        com.httmdt.orientalherbs.model.catalog.Product product = pv.getProduct();
                        String productName = product.getName() + " - " + pv.getUnitName();
                        String imageUrl = "";
                        if (product.getImages() != null && !product.getImages().isEmpty()) {
                            imageUrl = product.getImages().get(0).getProductImageUrl();
                        }
                        String productLink = frontendUrl + "/san-pham/" + product.getId();
                        
                        productsHtml.append("<tr>");
                        productsHtml.append("<td style=\"padding: 15px 0; border-bottom: 1px solid #eee; width: 80px;\">");
                        if (!imageUrl.isEmpty()) {
                            productsHtml.append("<a href=\"").append(productLink).append("\" target=\"_blank\">");
                            productsHtml.append("<img src=\"").append(imageUrl).append("\" alt=\"").append(productName).append("\" style=\"width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: none;\"/>");
                            productsHtml.append("</a>");
                        }
                        productsHtml.append("</td>");
                        productsHtml.append("<td style=\"padding: 15px 15px; border-bottom: 1px solid #eee;\">");
                        productsHtml.append("<h4 style=\"margin: 0 0 5px 0; font-size: 16px;\">");
                        productsHtml.append("<a href=\"").append(productLink).append("\" target=\"_blank\" style=\"color: #333; text-decoration: none;\">").append(productName).append("</a>");
                        productsHtml.append("</h4>");
                        productsHtml.append("<div style=\"margin: 5px 0;\">");
                        productsHtml.append("<span style=\"color: #e53935; font-weight: bold; font-size: 15px;\">").append(String.format("%,.0f", cpv.getFinalPriceSnapshot())).append("đ</span> ");
                        productsHtml.append("<span style=\"color: #999; text-decoration: line-through; font-size: 13px;\">").append(String.format("%,.0f", cpv.getOriginalPriceSnapshot())).append("đ</span>");
                        productsHtml.append("</div>");
                        productsHtml.append("</td>");
                        productsHtml.append("</tr>");
                    }
                    productsHtml.append("</table>");
                    productsHtml.append("</div>");
                }
                
                String finalBodyHtml = baseBodyHtml + productsHtml.toString();
                emailService.sendDirectEmail(email, subject, finalBodyHtml);
                sendLog.setStatus(EmailSendStatus.SUCCESS);
                successCount++;
            } catch (Exception e) {
                log.error("[EmailCampaign] Failed to send to {}: {}", email, e.getMessage());
                sendLog.setStatus(EmailSendStatus.FAILED);
                failCount++;
            }

            emailSendLogRepository.save(sendLog);
        }

        emailCampaign.setTotalSent((long) successCount);
        emailCampaignRepository.save(emailCampaign);

        log.info("[EmailCampaign] Completed campaign {}. Success: {}, Failed: {}",
                emailCampaignId, successCount, failCount);
    }
}
