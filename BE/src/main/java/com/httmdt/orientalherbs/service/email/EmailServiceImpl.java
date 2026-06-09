package com.httmdt.orientalherbs.service.email;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.httmdt.orientalherbs.dao.email.EmailTemplateRepository;
import com.httmdt.orientalherbs.model.email.EmailTemplate;
import com.httmdt.orientalherbs.util.EmailTemplateRenderer;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private EmailTemplateRepository templateRepository;

    @Autowired
    private EmailTemplateRenderer renderer;

    @Value("${app.mail.sender}")
    private String senderEmail;

    @Override
    public void sendEmail(String to, String templateCode, Map<String, String> variables) {
        log.info("[EMAIL] Attempting to send email to {} with template {}", to, templateCode);

        EmailTemplate template = templateRepository.findByTemplateCode(templateCode)
                .orElse(null);

        if (template == null) {
            log.error("[EMAIL] Template not found: {}", templateCode);
            return;
        }

        if (!template.getIsActive()) {
            log.warn("[EMAIL] Template {} is inactive, skip sending to {}", templateCode, to);
            return;
        }

        String subject = renderer.render(template.getSubject(), variables);
        String bodyHtml = renderer.render(template.getBodyHtml(), variables);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail, "Oriental Herbs");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(
                    template.getBodyText() != null ? renderer.render(template.getBodyText(), variables) : "",
                    bodyHtml
            );

            mailSender.send(message);
            log.info("[EMAIL] Successfully sent email to {} with template {}", to, templateCode);
        } catch (Exception e) {
            log.error("[EMAIL] Failed to send email to {} with template {}: {}", to, templateCode, e.getMessage(), e);
        }
    }

    @Override
    @Async
    public void sendEmailAsync(String to, String templateCode, Map<String, String> variables) {
        log.info("[EMAIL] Async email queued: to={}, template={}", to, templateCode);
        sendEmail(to, templateCode, variables);
    }

    @Override
    public void sendDirectEmail(String to, String subject, String bodyHtml) {
        log.info("[EMAIL] Attempting to send direct email to {}", to);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(senderEmail, "Oriental Herbs");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(bodyHtml, true);
            mailSender.send(message);
            log.info("[EMAIL] Successfully sent direct email to {}", to);
        } catch (Exception e) {
            log.error("[EMAIL] Failed to send direct email to {}: {}", to, e.getMessage(), e);
        }
    }

    @Override
    @Async
    public void sendDirectEmailAsync(String to, String subject, String bodyHtml) {
        log.info("[EMAIL] Async direct email queued: to={}", to);
        sendDirectEmail(to, subject, bodyHtml);
    }
}
