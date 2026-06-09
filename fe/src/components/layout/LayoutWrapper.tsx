'use client';

import { useState, useEffect } from 'react';
import AnnouncementBar from './Topbar';
import { SiteConfigService } from '@/services/siteConfig.service';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      const configs = await SiteConfigService.getAllConfigs();
      setAnnouncementEnabled(configs.announcement_bar_enabled === 'true');
      setAnnouncementText(configs.announcement_bar_text || '');
    };
    fetchConfig();
  }, []);

  return (
    <>
      <AnnouncementBar text={announcementText} enabled={announcementEnabled} />
      {children}
    </>
  );
}
