import { http } from '@/utils/http';
import { SiteConfig, SiteConfigMap } from '@/types/siteConfig.type';

class SiteConfigService {
  async getAllConfigs(): Promise<SiteConfig[]> {
    return await http<SiteConfig[]>('/admin/site-config');
  }

  async getAllConfigsAsMap(): Promise<SiteConfigMap> {
    try {
      return await http<SiteConfigMap>('/admin/site-config', { silent: true });
    } catch {
      return {};
    }
  }

  async updateConfig(key: string, value: string): Promise<SiteConfig> {
    return await http<SiteConfig>(`/admin/site-config/${key}`, {
      method: 'PUT',
      body: { configValue: value },
    });
  }
}

export const siteConfigService = new SiteConfigService();
