import { http } from '@/utils/http';
import { StaticPage } from '@/types/staticPage.type';

export const StaticPageService = {
  getPage: async (slug: string): Promise<StaticPage> => {
    return http<StaticPage>(`/public/static-pages/${slug}`, { method: 'GET' });
  }
};
