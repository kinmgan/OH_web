export interface Category {
  id: number;
  name: string;
  description: string;
  cate_code: string;
  productCount: number;
  displayOrder?: number;
}

export interface CategoryRequest {
  name: string;
  description: string;
  cateCode: string;
  displayOrder?: number;
}
