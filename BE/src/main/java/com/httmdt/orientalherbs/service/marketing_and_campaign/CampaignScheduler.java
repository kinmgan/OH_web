package com.httmdt.orientalherbs.service.marketing_and_campaign;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.httmdt.orientalherbs.dao.marketing_and_campaign.CampaignRepository;
import com.httmdt.orientalherbs.dao.marketing_and_campaign.EmailCampaignRepository;
import com.httmdt.orientalherbs.model.enums.CampaignStatus;
import com.httmdt.orientalherbs.model.enums.CampaignType;
import com.httmdt.orientalherbs.model.marketing_and_campaign.Campaign;
import com.httmdt.orientalherbs.model.marketing_and_campaign.EmailCampaign;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class CampaignScheduler {

    private static final Logger logger = LoggerFactory.getLogger(CampaignScheduler.class);
    private final CampaignRepository campaignRepository;
    private final EmailCampaignRepository emailCampaignRepository;
    private final EmailCampaignSender emailCampaignSender;

    @Scheduled(fixedRate = 60000) // Chạy mỗi 60 giây
    @Transactional
    public void updateCampaignStatuses() {
        LocalDateTime now = LocalDateTime.now();

        // --- 1. Tự động HOÀN THÀNH các chiến dịch ACTIVE đã quá ngày kết thúc ---
        List<Campaign> expiredCampaigns = campaignRepository.findExpiredActiveCampaigns(now);
        for (Campaign campaign : expiredCampaigns) {
            logger.info("[Scheduler] Auto-completing expired campaign: id={} name={}", campaign.getId(), campaign.getName());
            campaign.setStatus(CampaignStatus.COMPLETED);
        }
        if (!expiredCampaigns.isEmpty()) {
            campaignRepository.saveAll(expiredCampaigns);
        }

        // --- 2. WEB campaign: tự động ACTIVE khi đến startDate ---
        // Chỉ xử lý các campaign KHÔNG phải EMAIL (WEB campaigns)
        List<Campaign> readyWebCampaigns = campaignRepository.findReadyScheduledCampaigns(now);
        for (Campaign campaign : readyWebCampaigns) {
            if (campaign.getType() == CampaignType.EMAIL) {
                // EMAIL campaign sẽ được xử lý riêng theo scheduledAt bên dưới
                continue;
            }
            if (campaign.getEndDate() != null && campaign.getEndDate().isBefore(now)) {
                logger.info("[Scheduler] WEB campaign expired before start: id={}", campaign.getId());
                campaign.setStatus(CampaignStatus.COMPLETED);
            } else {
                logger.info("[Scheduler] Auto-activating WEB campaign: id={}", campaign.getId());
                campaign.setStatus(CampaignStatus.ACTIVE);
            }
        }
        if (!readyWebCampaigns.isEmpty()) {
            campaignRepository.saveAll(readyWebCampaigns);
        }

        // --- 3. EMAIL campaign: tự động gửi khi đến scheduledAt ---
        List<EmailCampaign> readyEmailCampaigns = emailCampaignRepository.findEmailCampaignsReadyToSend(now);
        for (EmailCampaign emailCampaign : readyEmailCampaigns) {
            logger.info("[Scheduler] Triggering email send for campaign: id={} name={}", emailCampaign.getId(), emailCampaign.getName());
            emailCampaign.setStatus(CampaignStatus.ACTIVE);
            emailCampaignRepository.save(emailCampaign);
            // Gửi email bất đồng bộ
            emailCampaignSender.sendEmailCampaign(emailCampaign.getId());
        }
    }
}
