import { http } from '@/utils/http';
import {
  CampaignListItem,
  CampaignDetail,
  CampaignCreateRequest,
  CampaignUpdateRequest,
  CampaignStatusUpdateRequest,
  PaginatedResponse,
} from '@/types/campaign.type';

class CampaignService {
  async getCampaigns(
    page: number = 0,
    size: number = 10,
    type?: string,
    status?: string,
    keyword?: string
  ): Promise<PaginatedResponse<CampaignListItem>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    if (keyword) params.append('keyword', keyword);

    const response = await http<PaginatedResponse<CampaignListItem>>(`/admin/campaigns?${params.toString()}`);
    return response;
  }

  async getCampaign(id: number): Promise<CampaignDetail> {
    const response = await http<CampaignDetail>(`/admin/campaigns/${id}`);
    return response;
  }

  async createCampaign(data: CampaignCreateRequest): Promise<CampaignDetail> {
    const response = await http<CampaignDetail>('/admin/campaigns', {
      method: 'POST',
      body: data,
    });
    return response;
  }

  async updateCampaign(id: number, data: CampaignUpdateRequest): Promise<CampaignDetail> {
    const response = await http<CampaignDetail>(`/admin/campaigns/${id}`, {
      method: 'PUT',
      body: data,
    });
    return response;
  }

  async updateCampaignStatus(id: number, data: CampaignStatusUpdateRequest): Promise<CampaignDetail> {
    const response = await http<CampaignDetail>(`/admin/campaigns/${id}/status`, {
      // @ts-ignore
      method: 'PATCH',
      body: data,
    });
    return response;
  }

  async deleteCampaign(id: number): Promise<void> {
    await http(`/admin/campaigns/${id}`, { method: 'DELETE' });
  }
}

export const campaignService = new CampaignService();
