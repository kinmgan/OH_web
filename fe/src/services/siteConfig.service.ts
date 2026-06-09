import { SiteConfigMap } from '@/types/siteConfig.type';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const SiteConfigService = {
  getAllConfigs: async (): Promise<SiteConfigMap> => {
    try {
      const response = await fetch(`${API_URL}/public/site-config`);
      if (!response.ok) {
        if (response.status === 204) return {};
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Record<string, string> = await response.json();
      return data;
    } catch {
      return {};
    }
  }
};
