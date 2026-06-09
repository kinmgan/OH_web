'use client';

import { ContactService } from '@/services/contact.service';
import { ContactInfo } from '@/types/contact.type';
import { useEffect, useState } from 'react';

export function useContactInfo() {
  const [data, setData] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ContactService.getContactInfo()
      .then(setData)
      .catch(() => setError('Khong the tai thong tin lien he.'))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
