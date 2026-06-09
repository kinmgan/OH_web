import { ContactInfo, ContactMessageRequest, ContactMessageResponse } from '@/types/contact.type';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const ContactService = {
  getContactInfo: async (): Promise<ContactInfo> => {
    const response = await fetch(`${API_URL}/public/contact`, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch contact info: ${response.status}`);
    }
    return response.json();
  },

  submitMessage: async (params: ContactMessageRequest): Promise<ContactMessageResponse> => {
    const response = await fetch(`${API_URL}/public/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      let message = 'Khong the gui y kien luc nay. Vui long thu lai sau.';
      try {
        const errorData = await response.json();
        message = errorData?.error || errorData?.message || message;
      } catch {
        // Keep the default friendly message.
      }
      throw new Error(message);
    }

    return { success: true, message: 'Thanh cong' };
  },
};
