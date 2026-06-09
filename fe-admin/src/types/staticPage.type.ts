export interface StaticPage {
  id: number;
  slug: string;
  title: string;
  content: string;
}

export interface StaticPageRequest {
  title: string;
  content: string;
}
