package com.httmdt.orientalherbs.dao.marketing_and_campaign;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.httmdt.orientalherbs.model.enums.CampaignStatus;
import com.httmdt.orientalherbs.model.marketing_and_campaign.CampaignProductVariant;

@Repository
public interface CampaignProductVariantRepository extends JpaRepository<CampaignProductVariant, Long> {

    List<CampaignProductVariant> findByCampaignId(Long campaignId);

    @Query("SELECT cpv FROM CampaignProductVariant cpv " +
           "JOIN cpv.campaign c " +
           "WHERE cpv.productVariant.productVariantId = :productVariantId " +
           "AND c.status = :status " +
           "AND c.startDate <= :now " +
           "AND (c.endDate IS NULL OR c.endDate >= :now)")
    Optional<CampaignProductVariant> findActiveDiscountByProductVariantId(
            @Param("productVariantId") Long productVariantId,
            @Param("status") CampaignStatus status,
            @Param("now") LocalDateTime now);

    @Query("SELECT cpv FROM CampaignProductVariant cpv " +
           "JOIN cpv.campaign c " +
           "WHERE cpv.productVariant.productVariantId = :productVariantId " +
           "AND c.status = 'ACTIVE' " +
           "AND c.startDate <= :endDate " +
           "AND (c.endDate IS NULL OR c.endDate >= :startDate)")
    List<CampaignProductVariant> findOverlappingCampaigns(
            @Param("productVariantId") Long productVariantId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT cpv FROM CampaignProductVariant cpv " +
           "JOIN cpv.campaign c " +
           "WHERE cpv.productVariant.productVariantId IN :productVariantIds " +
           "AND c.status = 'ACTIVE' " +
           "AND c.startDate <= :now " +
           "AND (c.endDate IS NULL OR c.endDate >= :now)")
    List<CampaignProductVariant> findActiveDiscountsByProductVariantIds(
            @Param("productVariantIds") List<Long> productVariantIds,
            @Param("now") LocalDateTime now);

    @Query("SELECT cpv FROM CampaignProductVariant cpv " +
           "JOIN FETCH cpv.productVariant pv " +
           "JOIN FETCH pv.product " +
           "WHERE cpv.campaign.id = :campaignId " +
           "ORDER BY cpv.displayOrder ASC")
    List<CampaignProductVariant> findByCampaignIdWithDetails(@Param("campaignId") Long campaignId);

    void deleteByCampaignId(Long campaignId);
}
