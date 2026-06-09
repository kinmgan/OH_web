package com.httmdt.orientalherbs.model.marketing_and_campaign;

import java.util.ArrayList;
import java.util.List;

import com.httmdt.orientalherbs.model.enums.HealthCategory;
import com.httmdt.orientalherbs.model.enums.TriggerEvent;
import com.httmdt.orientalherbs.model.email.EmailTemplate;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "email_campaigns")
// scheduledAt đã được kế thừa từ class Campaign, không khai báo lại
public class EmailCampaign extends Campaign {


    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_event")
    private TriggerEvent triggerEvent;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_health_tag", length = 50)
    private HealthCategory targetHealthCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private EmailTemplate template;

    @OneToMany(mappedBy = "emailCampaign", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EmailSendLog> sendLogs = new ArrayList<>();

    @Column(name = "total_sent")
    private Long totalSent = 0L;
}