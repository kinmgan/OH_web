'use client';

interface AnnouncementBarProps {
  text: string;
  enabled: boolean;
}

export default function AnnouncementBar({ text, enabled }: AnnouncementBarProps) {
  if (!enabled || !text) {
    return null;
  }

  return (
    <div className="w-full bg-[#194A33] text-white py-2 px-4 text-center text-sm font-medium">
      {text}
    </div>
  );
}
