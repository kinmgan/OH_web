package com.httmdt.orientalherbs.service.email;

import java.util.Map;

public interface EmailService {
    void sendEmail(String to, String templateCode, Map<String, String> variables);
    void sendEmailAsync(String to, String templateCode, Map<String, String> variables);
    void sendDirectEmail(String to, String subject, String bodyHtml);
    void sendDirectEmailAsync(String to, String subject, String bodyHtml);
}
