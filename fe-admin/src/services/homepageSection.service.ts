import { http } from '@/utils/http';
import { HomepageSection, HomepageSectionRequest } from '@/types/homepageSection.type';

class HomepageSectionAdminService {
  async getAllSections(): Promise<HomepageSection[]> {
    return await http<HomepageSection[]>('/admin/homepage-sections');
  }

  async getSectionById(id: number): Promise<HomepageSection> {
    return await http<HomepageSection>(`/admin/homepage-sections/${id}`);
  }

  async createSection(data: HomepageSectionRequest): Promise<HomepageSection> {
    return await http<HomepageSection>('/admin/homepage-sections', {
      method: 'POST',
      body: data,
    });
  }

  async updateSection(id: number, data: HomepageSectionRequest): Promise<HomepageSection> {
    return await http<HomepageSection>(`/admin/homepage-sections/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteSection(id: number): Promise<void> {
    await http<void>(`/admin/homepage-sections/${id}`, { method: 'DELETE' });
  }

  async updateSortOrder(orderList: { id: number; sortOrder: number }[]): Promise<HomepageSection[]> {
    return await http<HomepageSection[]>('/admin/homepage-sections/reorder', {
      method: 'PUT',
      body: orderList,
    });
  }
}

export const homepageSectionAdminService = new HomepageSectionAdminService();
