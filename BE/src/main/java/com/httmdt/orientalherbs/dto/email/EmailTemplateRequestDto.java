package com.httmdt.orientalherbs.dto.email;

import lombok.Data;
import com.httmdt.orientalherbs.model.enums.EmailTemplateType;

@Data
public class EmailTemplateRequestDto {
    private String templateCode;
    private EmailTemplateType templateType;
    private String name;
    private String description;
    private String subject;
    private String bodyHtml;
    private String bodyText;
    private Boolean isActive;
}
