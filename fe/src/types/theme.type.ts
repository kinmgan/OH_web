export interface ThemeConfig {
  id: number;
  themeName: string;
  coverImageUrl: string | null;
  headerImage1Url: string | null;
  headerImage2Url: string | null;
  headerImage3Url: string | null;
  headerVideoUrl: string | null;
  isActive: boolean;
  updatedAt: string | null;
}
