import { http } from '@/utils/http';
import { EmailTemplate, EmailTemplateListResponse } from '@/types/emailTemplate.type';

export const EmailTemplateService = {
  // If backend supports pagination, this might return a paginated response. 
  // We'll type it as returning EmailTemplateListResponse or EmailTemplate[] based on current BE.
  // The old code assumed `any[]`, so let's stick to `EmailTemplate[]` if the backend doesn't paginate yet,
  // or `EmailTemplateListResponse` if it does. Let's use `any` wrapper but typed response.
  getAll: async () => {
    return await http<EmailTemplate[]>('/admin/email-templates', { method: 'GET' });
  },
  getById: async (id: number) => {
    return await http<EmailTemplate>(`/admin/email-templates/${id}`, { method: 'GET' });
  },
  create: async (data: Partial<EmailTemplate>) => {
    return await http<EmailTemplate>('/admin/email-templates', { method: 'POST', body: data });
  },
  update: async (id: number, data: Partial<EmailTemplate>) => {
    return await http<EmailTemplate>(`/admin/email-templates/${id}`, { method: 'PUT', body: data });
  },
  delete: async (id: number) => {
    return await http<any>(`/admin/email-templates/${id}`, { method: 'DELETE' });
  },
  test: async (id: number, testEmail: string) => {
    return await http<any>(`/admin/email-templates/${id}/test`, { method: 'POST', body: { testEmail } });
  }
};
