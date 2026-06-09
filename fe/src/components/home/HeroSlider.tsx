'use client';
import { useEffect, useState } from 'react';
import { ThemeService } from '@/services/theme.service';
import { ThemeConfig } from '@/types/theme.type';

const STATIC_VIDEO = '/theme_config/hero banner.mp4';
const STATIC_POSTER = '/theme_config/hero banner.png';

export default function HeroSlider() {
  const [theme, setTheme] = useState<ThemeConfig | null>(null);

  useEffect(() => {
    ThemeService.getActiveTheme().then(setTheme).catch(() => setTheme(null));
  }, []);

  const videoUrl = theme?.headerVideoUrl || STATIC_VIDEO;
  const posterUrl = theme?.headerImage1Url || STATIC_POSTER;

  return (
    <div className="relative w-full h-[600px] overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster={posterUrl}
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* Nội dung đè lên */}
      <div className="absolute inset-0 z-20 flex items-center justify-center text-center">
        <div className="max-w-7xl mx-auto px-8 w-full flex flex-col items-center">
          <div className="max-w-xl">
            <h1
              className="font-serif text-6xl md:text-8xl mb-6 leading-tight text-white font-bold"
              style={{
                WebkitTextStroke: '1px #4F240B',
              }}
            >
              Dược Liệu<br />Đông Y
            </h1>
            <p className="font-serif italic text-xl md:text-2xl mb-10 font-medium text-white">
              Mỗi vị thuốc, một tấm lòng.<br />Mỗi sản phẩm, một cam kết.
            </p>
            <button className="bg-white text-[#194A33] font-sans font-semibold px-8 py-3 tracking-wider hover:bg-gray-100 transition-colors shadow-md rounded">
              XEM THÊM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
