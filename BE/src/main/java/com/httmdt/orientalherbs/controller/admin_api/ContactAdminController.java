package com.httmdt.orientalherbs.controller.admin_api;

import com.httmdt.orientalherbs.dto.contact.ContactInfoDto;
import com.httmdt.orientalherbs.dto.contact.ContactInfoRequest;
import com.httmdt.orientalherbs.service.contact.ContactInfoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/contact")
public class ContactAdminController {

    private final ContactInfoService contactInfoService;

    public ContactAdminController(ContactInfoService contactInfoService) {
        this.contactInfoService = contactInfoService;
    }

    @GetMapping
    public ResponseEntity<ContactInfoDto> getContactInfo() {
        return ResponseEntity.ok(contactInfoService.getContactInfo());
    }

    @PutMapping
    public ResponseEntity<ContactInfoDto> updateContactInfo(@Valid @RequestBody ContactInfoRequest request) {
        return ResponseEntity.ok(contactInfoService.updateContactInfo(request));
    }
}
