export interface SiteConfig {
  configKey: string;
  configValue: string;
  description?: string;
}

export interface SiteConfigMap {
  [key: string]: string;
}
