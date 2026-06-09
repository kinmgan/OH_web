import { http } from '@/utils/http';
import { StaticPage, StaticPageRequest } from '@/types/staticPage.type';

export const StaticPageService = {
  getPage: async (slug: string): Promise<StaticPage> => {
    return http<StaticPage>(`/public/static-pages/${slug}`, { method: 'GET', silent: true });
  },

  updatePage: async (slug: string, data: StaticPageRequest): Promise<StaticPage> => {
    return http<StaticPage>(`/admin/static-pages/${slug}`, {
      method: 'PUT',
      body: data
    });
  }
};
