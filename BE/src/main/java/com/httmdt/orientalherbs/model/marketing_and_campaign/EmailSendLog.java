package com.httmdt.orientalherbs.model.marketing_and_campaign;

import java.time.LocalDateTime;

import com.httmdt.orientalherbs.model.enums.EmailSendStatus;
import com.httmdt.orientalherbs.model.user.User;
import com.httmdt.orientalherbs.model.email.EmailTemplate;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "email_send_logs")
public class EmailSendLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmailSendStatus status;

    @Column(name = "opened_at")
    private LocalDateTime openedAt;

    @Column(name = "is_click")
    private Boolean isClick;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id")
    private EmailCampaign emailCampaign;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true) // Sửa thành nullable = true vì có thể gửi cho recipientEmail không có tài khoản
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private EmailTemplate template;

    @Column(name = "recipient_email")
    private String recipientEmail;
}