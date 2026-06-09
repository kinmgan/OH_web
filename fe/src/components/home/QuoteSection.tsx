import Image from 'next/image';

export default function QuoteSection() {
  return (
    <section className="relative w-full h-[724px] flex items-center justify-end px-8 md:px-24">
      {/* Ảnh nền */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/theme_config/bg_home_4.png" // Thay đường dẫn này bằng ảnh vẽ Lão Tử của bạn
          fill
          className="object-cover"
          alt="Triết lý Âm Dương"
        />
      </div>

      {/* Nội dung Text đè lên */}
      <div className="max-w-xl text-right md:text-left text-[#194A33] bg-white/40 p-8 rounded backdrop-blur-sm">
        <p className="font-sans text-xl md:text-2xl leading-loose font-medium">
          "Âm dương là đạo của trời đất, là kỷ cương của muôn vật, là cha mẹ của mọi sự biến hóa, là gốc rễ của sự sống chết, là cái kho chứa đựng thần minh."
        </p>
      </div>
    </section>
  );
}