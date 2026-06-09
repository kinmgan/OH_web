export interface ThemeConfig {
  id: number;
  themeName: string;
  coverImageUrl: string | null;
  headerImage1Url: string | null;
  headerImage2Url: string | null;
  headerImage3Url: string | null;
  headerVideoUrl: string | null;
  promotionImageUrl: string | null;
  promotionImageLink: string | null;
  isActive: boolean;
  updatedAt: string | null;
}

export interface ThemeConfigRequest {
  themeName?: string;
  coverImageUrl?: string | null;
  headerImage1Url?: string | null;
  headerImage2Url?: string | null;
  headerImage3Url?: string | null;
  headerVideoUrl?: string | null;
  promotionImageUrl?: string | null;
  promotionImageLink?: string | null;
  isActive?: boolean;
}
