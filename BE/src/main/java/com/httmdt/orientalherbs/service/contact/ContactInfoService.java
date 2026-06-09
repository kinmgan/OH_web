package com.httmdt.orientalherbs.service.contact;

import com.httmdt.orientalherbs.dto.contact.ContactInfoDto;
import com.httmdt.orientalherbs.dto.contact.ContactInfoRequest;

public interface ContactInfoService {
    ContactInfoDto getContactInfo();
    ContactInfoDto updateContactInfo(ContactInfoRequest request);
}
