package com.httmdt.orientalherbs.dao.email;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.httmdt.orientalherbs.model.email.EmailTemplate;
import com.httmdt.orientalherbs.model.enums.EmailTemplateType;

@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, Long> {
    
    Optional<EmailTemplate> findByTemplateCode(String templateCode);
    
    List<EmailTemplate> findByTemplateType(EmailTemplateType type);
    
    List<EmailTemplate> findByIsActiveTrue();
}
