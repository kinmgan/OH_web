package com.httmdt.orientalherbs.dao.marketing_and_campaign;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.httmdt.orientalherbs.model.marketing_and_campaign.EmailCampaign;

@Repository
public interface EmailCampaignRepository extends JpaRepository<EmailCampaign, Long> {

    @Query("SELECT ec FROM EmailCampaign ec LEFT JOIN FETCH ec.sendLogs WHERE ec.id = :id")
    Optional<EmailCampaign> findByIdWithSendLogs(@Param("id") Long id);

    /**
     * Tìm các EMAIL campaign ở trạng thái SCHEDULED và đã đến giờ gửi (scheduledAt <= now).
     * scheduledAt lưu trong bảng campaigns (field của class cha Campaign).
     */
    @Query("SELECT ec FROM EmailCampaign ec WHERE ec.status = 'SCHEDULED' AND ec.scheduledAt IS NOT NULL AND ec.scheduledAt <= :now")
    List<EmailCampaign> findEmailCampaignsReadyToSend(@Param("now") LocalDateTime now);
}
