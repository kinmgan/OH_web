import { http } from '@/utils/http';
import { ProductReview } from '@/types/productdetail.type';
import { ReviewEligibility, CreateReviewPayload } from '@/types/review.type';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const reviewService = {
  getProductReviews: async (productId: number): Promise<ProductReview[]> => {
    return await http<ProductReview[]>(`/reviews/public/${productId}`, {
      method: 'GET',
    });
  },

  getEligibility: async (productId: number): Promise<ReviewEligibility> => {
    return await http<ReviewEligibility>(`/products/${productId}/review-eligibility`, {
      method: 'GET',
      silent: true,
    });
  },

  createReview: async (payload: CreateReviewPayload): Promise<ProductReview> => {
    return await http<ProductReview>('/reviews', {
      method: 'POST',
      body: payload,
    });
  },

  uploadReviewImage: async (file: File): Promise<{ url: string; public_id: string }> => {
    let token = '';
    if (typeof window !== 'undefined') {
      const match = document.cookie.match(/(^|;)\s*accessToken\s*=\s*([^;]+)/);
      token = match ? match[2] : '';
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'duoc_lieu_reviews');

    const headers = new Headers();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_URL}/upload/image`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },
};
