package com.httmdt.orientalherbs.service.contact.impl;

import com.httmdt.orientalherbs.dto.contact.ContactMessageRequest;
import com.httmdt.orientalherbs.service.contact.ContactInfoService;
import com.httmdt.orientalherbs.service.contact.ContactMessageService;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

@Service
public class ContactMessageServiceImpl implements ContactMessageService {

    private final JavaMailSender mailSender;
    private final ContactInfoService contactInfoService;

    @Value("${app.mail.sender:tkngan666@gmail.com}")
    private String senderEmail;

    @Value("${app.contact.admin-email:tkngan666@gmail.com}")
    private String adminEmail;

    public ContactMessageServiceImpl(JavaMailSender mailSender, ContactInfoService contactInfoService) {
        this.mailSender = mailSender;
        this.contactInfoService = contactInfoService;
    }

    @Override
    public void sendToAdmin(ContactMessageRequest request) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail, "Oriental Herbs");
            helper.setReplyTo(request.email());
            helper.setTo(resolveAdminEmail());
            helper.setSubject("[Oriental Herbs Contact] " + request.subject());
            helper.setText(buildTextBody(request), buildHtmlBody(request));

            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Could not send contact message. Please try again later.", e);
        }
    }

    private String buildTextBody(ContactMessageRequest request) {
        return """
                New contact message

                Name: %s
                Email: %s
                Phone: %s
                Subject: %s

                Message:
                %s
                """.formatted(
                request.name(),
                request.email(),
                request.phone() == null || request.phone().isBlank() ? "-" : request.phone(),
                request.subject(),
                request.message()
        );
    }

    private String buildHtmlBody(ContactMessageRequest request) {
        return """
                <div style="font-family:Arial,sans-serif;line-height:1.6;color:#24352b">
                  <h2 style="color:#194A33;margin:0 0 16px">New contact message</h2>
                  <p><strong>Name:</strong> %s</p>
                  <p><strong>Email:</strong> %s</p>
                  <p><strong>Phone:</strong> %s</p>
                  <p><strong>Subject:</strong> %s</p>
                  <div style="margin-top:18px;padding:16px;border-left:4px solid #A57322;background:#FCF8F1">
                    %s
                  </div>
                </div>
                """.formatted(
                escape(request.name()),
                escape(request.email()),
                escape(request.phone() == null || request.phone().isBlank() ? "-" : request.phone()),
                escape(request.subject()),
                escape(request.message()).replace("\n", "<br>")
        );
    }

    private String escape(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value);
    }

    private String resolveAdminEmail() {
        String contactEmail = contactInfoService.getContactInfo().email();
        return contactEmail == null || contactEmail.isBlank() ? adminEmail : contactEmail;
    }
}
