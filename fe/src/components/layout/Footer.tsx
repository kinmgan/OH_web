'use client';

import Link from 'next/link';
import { useContactInfo } from '@/hooks/useContactInfo';
import { Facebook, Instagram, MessageCircle } from 'lucide-react';

export default function Footer({ className }: { className?: string }) {
  const { data: contact } = useContactInfo();

  return (
    <footer className={`bg-[#A57322] text-white py-12 px-8 ${className || ''}`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        
        {/* Cột 1: Thông tin cơ sở */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold uppercase tracking-wider mb-4 border-b border-white/20 pb-2 inline-block">
            Nhà Thuốc Đông Y
          </h3>
          <div className="space-y-3 text-sm leading-relaxed opacity-90">
            <p>
              <strong className="font-semibold">Địa chỉ:</strong><br />
              {contact?.address || 'Đang cập nhật địa chỉ...'}
            </p>
            <p>
              <strong className="font-semibold">Hotline/Zalo:</strong><br />
              {contact?.zalo || contact?.phone || 'Đang cập nhật số điện thoại...'}
            </p>
            {contact?.email && (
              <p>
                <strong className="font-semibold">Email:</strong><br />
                <a href={`mailto:${contact.email}`} className="hover:underline hover:text-gray-200 transition-colors">
                  {contact.email}
                </a>
              </p>
            )}

            {/* Mạng xã hội */}
            {(contact?.facebook || contact?.instagram || contact?.zalo) && (
              <div className="pt-4 border-t border-white/20 mt-4">
                <strong className="font-semibold mb-3 block">Kết nối với chúng tôi:</strong>
                <div className="flex gap-4">
                  {contact.facebook && (
                    <a href={contact.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-gray-200 transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20" title="Facebook">
                      <Facebook size={20} />
                    </a>
                  )}
                  {contact.instagram && (
                    <a href={contact.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-gray-200 transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20" title="Instagram">
                      <Instagram size={20} />
                    </a>
                  )}
                  {contact.zalo && (
                    <a href={contact.zalo.startsWith('http') ? contact.zalo : `https://zalo.me/${contact.zalo}`} target="_blank" rel="noopener noreferrer" className="hover:text-gray-200 transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20" title="Zalo">
                      <MessageCircle size={20} />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cột 2: Miễn trừ trách nhiệm */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold mb-4 border-b border-white/20 pb-2 inline-block">
            Miễn trừ trách nhiệm
          </h3>
          <div className="text-sm leading-relaxed opacity-90 text-justify italic bg-white/5 p-4 rounded-lg border border-white/10">
            Lưu ý: Các sản phẩm dược liệu mang tính chất hỗ trợ, hiệu quả sử dụng tùy thuộc vào cơ địa mỗi người. Thông tin trên website chỉ mang tính chất tham khảo, không thay thế cho việc chẩn đoán hay điều trị y khoa. Vui lòng tham khảo ý kiến bác sĩ/lương y trước khi sử dụng.
          </div>
        </div>

        {/* Cột 3: Hỗ trợ khách hàng */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold mb-4 border-b border-white/20 pb-2 inline-block">
            Hỗ trợ khách hàng
          </h3>
          <div className="text-sm opacity-90 space-y-4">
            <p>
              <Link href="/about" className="hover:underline hover:text-gray-200 transition-colors font-medium text-base">
                Về Chúng Tôi
              </Link>
            </p>
            <p>
              <Link href="/chinh-sach" className="hover:underline hover:text-gray-200 transition-colors font-medium text-base">
                Chính sách Mua hàng & Hỗ trợ
              </Link>
            </p>
            <ul className="list-disc ml-5 space-y-2 text-gray-200">
              <li>Cách giao hàng</li>
              <li>Điều kiện trả hàng</li>
              <li>Cam kết bảo mật thông tin</li>
            </ul>
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-sm">
                Hỗ trợ và khiếu nại đơn hàng, vui lòng gọi trực tiếp Hotline:<br />
                <strong className="text-lg block mt-1 text-[#FACC15]">{contact?.phone || 'Đang cập nhật...'}</strong>
              </p>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}