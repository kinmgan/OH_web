'use client';
import HeroSlider from '@/components/home/HeroSlider';
import QuoteSection from '@/components/home/QuoteSection';
import CampaignSection from '@/components/home/CampaignSection';
import HomepageSectionRenderer from '@/components/home/HomepageSectionRenderer';
import React, { useState, useEffect } from 'react';
import { CampaignService } from '@/services/campaign.service';
import { WebCampaign } from '@/types/campaign.type';
import { HomepageSectionService } from '@/services/homepageSection.service';
import { HomepageSectionResponse } from '@/types/homepageSection.type';
import CategoryList from '@/components/product/CategoryList';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<WebCampaign[]>([]);
  const [homepageSections, setHomepageSections] = useState<HomepageSectionResponse[]>([]);

  useEffect(() => {
    CampaignService.getActiveWebCampaigns()
      .then(setCampaigns)
      .catch(console.error);
    HomepageSectionService.getActiveSections()
      .then(setHomepageSections)
      .catch(console.error);
  }, []);

  return (
    <div className="w-full">
      <HeroSlider />
      <QuoteSection />
      {campaigns.map(campaign => (
        <CampaignSection key={campaign.id} campaign={campaign} />
      ))}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8">
        <CategoryList
          onSelectCategory={(id) => {
            if (id) {
              router.push(`/san-pham?category=${id}`);
            } else {
              router.push('/san-pham');
            }
          }}
        />
      </div>
      <HomepageSectionRenderer sections={homepageSections} />
    </div>
  );
}
