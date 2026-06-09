package com.httmdt.orientalherbs.util;

import org.springframework.stereotype.Component;
import java.util.Map;

@Component
public class EmailTemplateRenderer {
    public String render(String templateContent, Map<String, String> variables) {
        if (templateContent == null) return "";
        if (variables == null || variables.isEmpty()) return templateContent;

        String rendered = templateContent;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            rendered = rendered.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        return rendered;
    }
}
