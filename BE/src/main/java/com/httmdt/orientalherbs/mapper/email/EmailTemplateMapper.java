package com.httmdt.orientalherbs.mapper.email;

import com.httmdt.orientalherbs.dto.email.EmailTemplateDto;
import com.httmdt.orientalherbs.dto.email.EmailTemplateRequestDto;
import com.httmdt.orientalherbs.model.email.EmailTemplate;
import org.springframework.stereotype.Component;

@Component
public class EmailTemplateMapper {

    public EmailTemplateDto toDto(EmailTemplate template) {
        if (template == null) return null;
        return EmailTemplateDto.builder()
                .id(template.getId())
                .templateCode(template.getTemplateCode())
                .templateType(template.getTemplateType().name())
                .name(template.getName())
                .description(template.getDescription())
                .subject(template.getSubject())
                .bodyHtml(template.getBodyHtml())
                .bodyText(template.getBodyText())
                .isActive(template.getIsActive())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .build();
    }

    public void updateEntityFromRequest(EmailTemplate entity, EmailTemplateRequestDto requestDto) {
        if (requestDto.getTemplateCode() != null) entity.setTemplateCode(requestDto.getTemplateCode());
        if (requestDto.getTemplateType() != null) entity.setTemplateType(requestDto.getTemplateType());
        if (requestDto.getName() != null) entity.setName(requestDto.getName());
        if (requestDto.getDescription() != null) entity.setDescription(requestDto.getDescription());
        if (requestDto.getSubject() != null) entity.setSubject(requestDto.getSubject());
        if (requestDto.getBodyHtml() != null) entity.setBodyHtml(requestDto.getBodyHtml());
        if (requestDto.getBodyText() != null) entity.setBodyText(requestDto.getBodyText());
        if (requestDto.getIsActive() != null) entity.setIsActive(requestDto.getIsActive());
    }
}
