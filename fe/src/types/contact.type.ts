export interface ContactMessageRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface ContactMessageResponse {
  success: boolean;
  message: string;
}

export interface ContactInfo {
  id: number;
  phone: string;
  email: string;
  address: string;
  facebook: string;
  zalo: string;
  instagram: string;
}
