package com.httmdt.orientalherbs.dto.email;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class EmailTemplateDto {
    private Long id;
    private String templateCode;
    private String templateType;
    private String name;
    private String description;
    private String subject;
    private String bodyHtml;
    private String bodyText;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
