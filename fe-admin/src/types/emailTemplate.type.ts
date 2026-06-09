export type EmailTemplateType = 'TRANSACTIONAL' | 'MARKETING';

export interface EmailTemplate {
  id: number;
  templateCode: string;
  templateType: EmailTemplateType;
  name: string;
  description?: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface EmailTemplateListResponse {
  content: EmailTemplate[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
