'use client';

import Breadcrumb from '@/components/common/Breadcrumb';
import { ContactService } from '@/services/contact.service';
import { useContactInfo } from '@/hooks/useContactInfo';
import { AlertCircle, CheckCircle2, Mail, MapPin, Phone, Send } from 'lucide-react';
import { FormEvent, useState } from 'react';

const BREADCRUMB_ITEMS = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Liên hệ' },
];

const INITIAL_FORM = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

export default function ContactPage() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { data: contact } = useContactInfo();

  const handleChange = (field: keyof typeof INITIAL_FORM, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    if (status) setStatus(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      await ContactService.submitMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });
      setFormData(INITIAL_FORM);
      setStatus({
        type: 'success',
        message: 'Cảm ơn bạn. Ý kiến đã được gửi đến quản trị viên.',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể gửi ý kiến lúc này.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8F4EC]">
      <Breadcrumb items={BREADCRUMB_ITEMS} />

      <section className="max-w-7xl mx-auto px-6 md:px-10 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-10 items-start">
          <div className="space-y-8">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-[#A57322] font-semibold mb-3">
                Oriental Herbs
              </p>
              <h1 className="font-serif text-4xl md:text-5xl text-[#194A33] leading-tight">
                Liên hệ với chúng tôi
              </h1>
              <p className="mt-5 text-[#4c5a51] leading-7 max-w-xl">
                Gửi câu hỏi, góp ý hoặc yêu cầu hỗ trợ. Đội ngũ quản trị sẽ nhận email và phản hồi lại qua địa chỉ email bạn cung cấp.
              </p>
            </div>

            <div className="bg-white border border-[#194A33]/10 rounded-2xl p-6 space-y-5 shadow-sm">
              <div className="flex gap-4">
                <span className="w-10 h-10 rounded-full bg-[#F8F4EC] text-[#A57322] flex items-center justify-center shrink-0">
                  <Mail size={19} />
                </span>
                <div>
                  <p className="text-sm text-[#6b746e]">Email hỗ trợ</p>
                  <a
                    href={contact ? `mailto:${contact.email}` : 'mailto:support@example.com'}
                    className="font-medium text-[#194A33] hover:text-[#A57322]"
                  >
                    {contact?.email || 'support@example.com'}
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="w-10 h-10 rounded-full bg-[#F8F4EC] text-[#A57322] flex items-center justify-center shrink-0">
                  <Phone size={19} />
                </span>
                <div>
                  <p className="text-sm text-[#6b746e]">Điện thoại</p>
                  <a
                    href={contact?.phone ? `tel:${contact.phone}` : 'tel:+917038308976'}
                    className="font-medium text-[#194A33] hover:text-[#A57322]"
                  >
                    {contact?.phone || '+91 7038308976'}
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="w-10 h-10 rounded-full bg-[#F8F4EC] text-[#A57322] flex items-center justify-center shrink-0">
                  <MapPin size={19} />
                </span>
                <div>
                  <p className="text-sm text-[#6b746e]">Địa chỉ</p>
                  <p className="font-medium text-[#194A33]">
                    {contact?.address || '2972 Westheimer Rd. Santa Ana, Illinois 85486'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-[#194A33]/10 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="space-y-2">
                <span className="text-sm font-medium text-[#194A33]">Họ và tên</span>
                <input
                  required
                  maxLength={100}
                  value={formData.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  className="w-full h-12 rounded-xl border border-[#194A33]/15 bg-[#FCF8F1] px-4 text-[#24352b] outline-none focus:border-[#A57322] focus:ring-2 focus:ring-[#A57322]/20"
                  placeholder="Nguyễn Văn A"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[#194A33]">Email</span>
                <input
                  required
                  type="email"
                  maxLength={150}
                  value={formData.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  className="w-full h-12 rounded-xl border border-[#194A33]/15 bg-[#FCF8F1] px-4 text-[#24352b] outline-none focus:border-[#A57322] focus:ring-2 focus:ring-[#A57322]/20"
                  placeholder="ban@example.com"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[#194A33]">Số điện thoại</span>
                <input
                  maxLength={30}
                  value={formData.phone}
                  onChange={(event) => handleChange('phone', event.target.value)}
                  className="w-full h-12 rounded-xl border border-[#194A33]/15 bg-[#FCF8F1] px-4 text-[#24352b] outline-none focus:border-[#A57322] focus:ring-2 focus:ring-[#A57322]/20"
                  placeholder="Tùy chọn"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[#194A33]">Chủ đề</span>
                <input
                  required
                  maxLength={150}
                  value={formData.subject}
                  onChange={(event) => handleChange('subject', event.target.value)}
                  className="w-full h-12 rounded-xl border border-[#194A33]/15 bg-[#FCF8F1] px-4 text-[#24352b] outline-none focus:border-[#A57322] focus:ring-2 focus:ring-[#A57322]/20"
                  placeholder="Tôi cần tư vấn sản phẩm"
                />
              </label>
            </div>

            <label className="block space-y-2 mt-5">
              <span className="text-sm font-medium text-[#194A33]">Ý kiến của bạn</span>
              <textarea
                required
                rows={7}
                maxLength={3000}
                value={formData.message}
                onChange={(event) => handleChange('message', event.target.value)}
                className="w-full resize-none rounded-xl border border-[#194A33]/15 bg-[#FCF8F1] px-4 py-3 text-[#24352b] outline-none focus:border-[#A57322] focus:ring-2 focus:ring-[#A57322]/20"
                placeholder="Nhập nội dung bạn muốn gửi..."
              />
            </label>

            {status && (
              <div
                className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                  status.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : 'border-red-200 bg-red-50 text-red-800'
                }`}
              >
                {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{status.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 inline-flex h-12 min-w-36 items-center justify-center gap-2 rounded-xl bg-[#A57322] px-6 font-medium text-white transition-colors hover:bg-[#8f631d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={18} />
              {isSubmitting ? 'Đang gửi...' : 'Gửi ý kiến'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
