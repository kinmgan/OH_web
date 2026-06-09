package com.httmdt.orientalherbs.service.contact.impl;

import com.httmdt.orientalherbs.dao.theme_configuration.ContactRepository;
import com.httmdt.orientalherbs.dto.contact.ContactInfoDto;
import com.httmdt.orientalherbs.dto.contact.ContactInfoRequest;
import com.httmdt.orientalherbs.model.theme_configuration.Contact;
import com.httmdt.orientalherbs.service.contact.ContactInfoService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContactInfoServiceImpl implements ContactInfoService {

    private final ContactRepository contactRepository;

    public ContactInfoServiceImpl(ContactRepository contactRepository) {
        this.contactRepository = contactRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public ContactInfoDto getContactInfo() {
        return contactRepository.findFirstByOrderByIdAsc()
                .map(this::toDto)
                .orElseGet(this::defaultContactInfo);
    }

    @Override
    @Transactional
    public ContactInfoDto updateContactInfo(ContactInfoRequest request) {
        Contact contact = contactRepository.findFirstByOrderByIdAsc().orElseGet(Contact::new);

        contact.setPhone(clean(request.phone()));
        contact.setEmail(clean(request.email()));
        contact.setAddress(clean(request.address()));
        contact.setFacebook(clean(request.facebook()));
        contact.setZalo(clean(request.zalo()));
        contact.setInstagram(clean(request.instagram()));

        return toDto(contactRepository.save(contact));
    }

    private ContactInfoDto toDto(Contact contact) {
        return new ContactInfoDto(
                contact.getId(),
                contact.getPhone(),
                contact.getEmail(),
                contact.getAddress(),
                contact.getFacebook(),
                contact.getZalo(),
                contact.getInstagram()
        );
    }

    private ContactInfoDto defaultContactInfo() {
        return new ContactInfoDto(
                null,
                "+91 7038308976",
                "tkngan666@gmail.com",
                "2972 Westheimer Rd. Santa Ana, Illinois 85486",
                "",
                "",
                ""
        );
    }

    private String clean(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
