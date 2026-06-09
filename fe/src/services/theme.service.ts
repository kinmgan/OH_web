import { ThemeConfig } from '@/types/theme.type';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const ThemeService = {
  getActiveTheme: async (): Promise<ThemeConfig | null> => {
    try {
      const response = await fetch(`${API_URL}/public/theme/active`);
      if (!response.ok) {
        if (response.status === 204) return null;
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch {
      return null;
    }
  }
};
