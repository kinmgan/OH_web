import { HomepageSectionResponse } from '@/types/homepageSection.type';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const HomepageSectionService = {
  getActiveSections: async (): Promise<HomepageSectionResponse[]> => {
    const response = await fetch(`${API_URL}/public/homepage/sections`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  }
};
