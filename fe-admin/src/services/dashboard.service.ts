import { http } from '@/utils/http';
import { DashboardStats, RevenueDataPoint, RecentOrder, ReviewSentiment, WordCloudItem } from '@/types/dashboard.type';

class DashboardService {
  async getStats(): Promise<DashboardStats> {
    return await http<DashboardStats>('/admin/dashboard/stats');
  }

  async getRecentOrders(limit: number = 5, startDate?: string, endDate?: string): Promise<RecentOrder[]> {
    let url = `/admin/dashboard/recent-orders?limit=${limit}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    return await http<RecentOrder[]>(url);
  }

  async getRevenueChart(startDate?: string, endDate?: string): Promise<RevenueDataPoint[]> {
    let url = '/admin/dashboard/revenue-chart';
    const params: string[] = [];
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return await http<RevenueDataPoint[]>(url);
  }

  async getReviewSentiment(startDate?: string, endDate?: string): Promise<ReviewSentiment[]> {
    let url = '/admin/dashboard/review-sentiment';
    const params: string[] = [];
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return await http<ReviewSentiment[]>(url);
  }

  async getReviewWordCloud(startDate?: string, endDate?: string): Promise<WordCloudItem[]> {
    let url = '/admin/dashboard/review-wordcloud';
    const params: string[] = [];
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return await http<WordCloudItem[]>(url);
  }
}

export const dashboardService = new DashboardService();
