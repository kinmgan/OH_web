import { http, httpFormData } from '@/utils/http';
import { ThemeConfig, ThemeConfigRequest } from '@/types/theme.type';

class ThemeService {
  async getAllThemes(): Promise<ThemeConfig[]> {
    return await http<ThemeConfig[]>('/admin/theme');
  }

  async getActiveTheme(): Promise<ThemeConfig | null> {
    try {
      return await http<ThemeConfig>('/admin/theme/active', { silent: true });
    } catch {
      return null;
    }
  }

  async getThemeById(id: number): Promise<ThemeConfig> {
    return await http<ThemeConfig>(`/admin/theme/${id}`);
  }

  async updateTheme(id: number, data: ThemeConfigRequest): Promise<ThemeConfig> {
    return await http<ThemeConfig>(`/admin/theme/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async updateThemeWithFiles(id: number, formData: FormData): Promise<ThemeConfig> {
    return await httpFormData<ThemeConfig>(`/admin/theme/${id}`, formData, 'PUT');
  }
}

export const themeService = new ThemeService();
