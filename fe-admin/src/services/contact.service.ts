import { http } from '@/utils/http';
import { ContactInfo, ContactInfoRequest } from '@/types/contact.type';

class ContactAdminService {
  async getContactInfo(): Promise<ContactInfo> {
    return await http<ContactInfo>('/admin/contact');
  }

  async updateContactInfo(data: ContactInfoRequest): Promise<ContactInfo> {
    return await http<ContactInfo>('/admin/contact', {
      method: 'PUT',
      body: data,
    });
  }
}

export const contactAdminService = new ContactAdminService();
