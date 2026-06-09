package com.httmdt.orientalherbs.controller.public_api;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.httmdt.orientalherbs.dto.contact.ContactInfoDto;
import com.httmdt.orientalherbs.dto.contact.ContactMessageRequest;
import com.httmdt.orientalherbs.service.contact.ContactInfoService;
import com.httmdt.orientalherbs.service.contact.ContactMessageService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/public/contact")
public class ContactPublicController {

    private final ContactInfoService contactInfoService;
    private final ContactMessageService contactMessageService;

    public ContactPublicController(ContactInfoService contactInfoService, ContactMessageService contactMessageService) {
        this.contactInfoService = contactInfoService;
        this.contactMessageService = contactMessageService;
    }

    @GetMapping
    public ResponseEntity<ContactInfoDto> getContactInfo() {
        return ResponseEntity.ok(contactInfoService.getContactInfo());
    }

    @PostMapping
    public ResponseEntity<Void> submitContactMessage(@Valid @RequestBody ContactMessageRequest request) {
        contactMessageService.sendToAdmin(request);
        return ResponseEntity.ok().build();
    }
}
