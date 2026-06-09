package com.httmdt.orientalherbs.service.contact;

import com.httmdt.orientalherbs.dto.contact.ContactMessageRequest;

public interface ContactMessageService {
    void sendToAdmin(ContactMessageRequest request);
}
