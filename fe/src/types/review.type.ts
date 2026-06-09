export interface ReviewImage {
  id?: number;
  imageUrl: string;
  imagePublicId?: string;
  displayOrder?: number;
}

export interface ReviewableOrderItem {
  orderItemId: number;
  orderId: number;
  productId: number;
  productName: string;
  variantInfo: string;
  quantity: number;
}

export interface ReviewEligibility {
  canReview: boolean;
  reviewableItems: ReviewableOrderItem[];
}

export interface CreateReviewPayload {
  orderItemId: number;
  productId: number;
  rating: number;
  comment?: string;
  images?: {
    imageUrl: string;
    imagePublicId?: string;
    displayOrder?: number;
  }[];
}
