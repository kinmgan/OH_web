export interface ContactInfo {
  id: number;
  phone: string;
  email: string;
  address: string;
  facebook: string;
  zalo: string;
  instagram: string;
}

export interface ContactInfoRequest {
  phone?: string;
  email?: string;
  address?: string;
  facebook?: string;
  zalo?: string;
  instagram?: string;
}
