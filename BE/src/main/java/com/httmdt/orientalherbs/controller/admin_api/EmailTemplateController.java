package com.httmdt.orientalherbs.controller.admin_api;

import com.httmdt.orientalherbs.dao.email.EmailTemplateRepository;
import com.httmdt.orientalherbs.dto.email.EmailTemplateDto;
import com.httmdt.orientalherbs.dto.email.EmailTemplateRequestDto;
import com.httmdt.orientalherbs.dto.email.EmailTemplateTestRequestDto;
import com.httmdt.orientalherbs.mapper.email.EmailTemplateMapper;
import com.httmdt.orientalherbs.model.email.EmailTemplate;
import com.httmdt.orientalherbs.service.email.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/email-templates")
public class EmailTemplateController {

    @Autowired
    private EmailTemplateRepository repository;

    @Autowired
    private EmailTemplateMapper mapper;
    
    @Autowired
    private EmailService emailService;

    @GetMapping
    public ResponseEntity<List<EmailTemplateDto>> getAllTemplates() {
        return ResponseEntity.ok(repository.findAll().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTemplate(@PathVariable Long id) {
        return repository.findById(id)
                .map(t -> ResponseEntity.ok(mapper.toDto(t)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<EmailTemplateDto> createTemplate(@RequestBody EmailTemplateRequestDto dto) {
        EmailTemplate template = new EmailTemplate();
        mapper.updateEntityFromRequest(template, dto);
        return ResponseEntity.ok(mapper.toDto(repository.save(template)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTemplate(@PathVariable Long id, @RequestBody EmailTemplateRequestDto dto) {
        return repository.findById(id).map(template -> {
            mapper.updateEntityFromRequest(template, dto);
            return ResponseEntity.ok(mapper.toDto(repository.save(template)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTemplate(@PathVariable Long id) {
        return repository.findById(id).map(template -> {
            template.setIsActive(false); // soft delete
            repository.save(template);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/{id}/test")
    public ResponseEntity<?> testTemplate(@PathVariable Long id, @RequestBody EmailTemplateTestRequestDto dto) {
        return repository.findById(id).map(template -> {
            emailService.sendEmailAsync(dto.getTestEmail(), template.getTemplateCode(), Map.of(
                "fullName", "Test User",
                "loginTime", java.time.LocalDateTime.now().toString()
            ));
            return ResponseEntity.ok(Map.of("message", "Test email sent"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
