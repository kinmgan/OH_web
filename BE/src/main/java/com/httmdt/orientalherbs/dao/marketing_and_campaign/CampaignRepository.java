package com.httmdt.orientalherbs.dao.marketing_and_campaign;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.httmdt.orientalherbs.model.enums.CampaignStatus;
import com.httmdt.orientalherbs.model.enums.CampaignType;
import com.httmdt.orientalherbs.model.marketing_and_campaign.Campaign;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, Long> {

    @Query("SELECT c FROM Campaign c WHERE " +
           "(:type IS NULL OR c.type = :type) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:keyword IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', cast(:keyword as string), '%')))")
    Page<Campaign> findByFilters(
            @Param("type") CampaignType type,
            @Param("status") CampaignStatus status,
            @Param("keyword") String keyword,
            Pageable pageable);

    @Query("SELECT c FROM Campaign c LEFT JOIN FETCH c.productVariants WHERE c.id = :id")
    Optional<Campaign> findByIdWithItems(@Param("id") Long id);

    @Query("SELECT c FROM Campaign c WHERE c.type = :type " +
           "AND c.status = :status " +
           "AND c.startDate <= :now " +
           "AND (c.endDate IS NULL OR c.endDate >= :now) " +
           "ORDER BY c.displayOrder ASC")
    List<Campaign> findActiveCampaigns(
            @Param("type") CampaignType type,
            @Param("status") CampaignStatus status,
            @Param("now") LocalDateTime now);

    @Query("SELECT c FROM Campaign c WHERE c.type = 'EMAIL' " +
           "AND c.status = 'SCHEDULED' " +
           "AND c.scheduledAt <= :now")
    List<Campaign> findScheduledEmailCampaignsReadyToSend(@Param("now") LocalDateTime now);

    @Query("SELECT c FROM Campaign c WHERE c.status = 'ACTIVE' AND c.endDate < :now")
    List<Campaign> findExpiredActiveCampaigns(@Param("now") LocalDateTime now);

    @Query("SELECT c FROM Campaign c WHERE c.status = 'SCHEDULED' AND c.startDate <= :now")
    List<Campaign> findReadyScheduledCampaigns(@Param("now") LocalDateTime now);
}
