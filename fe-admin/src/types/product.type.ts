export interface ProductVariant {
  productVariantId?: number;
  unitName: string;
  price: number;
  stockQuantity: number;
  weightGram?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}

export interface ProductImage {
  id?: number;
  productImageUrl: string;
  imagePublicId: string;
  isDefault?: boolean;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  origin: string;
  soldQuantity: number;
  averageRating: number;
  minPrice: number;
  categoryId: number;
  categoryName: string;
  properties: string[];
  flavors: string[];
  meridians: string[];
  tags: string[];
  createdAt: string;
  variants: ProductVariant[];
  images: ProductImage[];
  certificateImages?: string[];
}

export interface ProductRequest {
  name: string;
  sku: string;
  description: string;
  origin: string;
  minPrice: number;
  categoryId: number;
  properties: string[];
  flavors: string[];
  meridians: string[];
  tags: string[];
  variants: ProductVariant[];
  keepImagePublicIds: string[];
  defaultImageIdentifier?: string;
  keepCertificateImages?: string[];
}
