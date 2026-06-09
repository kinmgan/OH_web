'use client';

import { useParams } from 'next/navigation';
import CampaignForm from '@/components/campaigns/CampaignForm';

export default function EditCampaignPage() {
  const params = useParams();
  const id = params.id as string;

  return <CampaignForm campaignId={parseInt(id, 10)} isEdit />;
}
