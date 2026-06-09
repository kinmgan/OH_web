import { WebCampaign } from '@/types/campaign.type';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const CampaignService = {
  getActiveWebCampaigns: async (): Promise<WebCampaign[]> => {
    const response = await fetch(`${API_URL}/public/campaigns/web`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  }
};
