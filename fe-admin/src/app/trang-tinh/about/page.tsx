'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { StaticPageService } from '@/services/staticPage.service';
import 'react-quill-new/dist/quill.snow.css';
import { Save, AlertCircle, CheckCircle2, ChevronRight, FileText } from 'lucide-react';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function AboutEditPage() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchPage();
  }, []);

  const fetchPage = async () => {
    try {
      const page = await StaticPageService.getPage('about');
      setContent(page.content || '');
      setTitle(page.title || '');
    } catch (error) {
      console.error('Failed to load page', error);
      setMessage({ type: 'error', text: 'Không thể tải trang Về Chúng Tôi.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await StaticPageService.updatePage('about', { title, content });
      setMessage({ type: 'success', text: 'Lưu thay đổi thành công!' });
      
      // Auto clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Failed to save page', error);
      setMessage({ type: 'error', text: 'Đã có lỗi xảy ra khi lưu.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCF8F1]">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 border-4 border-[#A57322] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#A57322] font-medium">Đang tải nội dung...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Breadcrumb & Header section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <div className="flex items-center text-sm text-gray-500 mb-2 font-medium">
            <span className="hover:text-[#A57322] cursor-pointer transition-colors">Quản lý</span>
            <ChevronRight className="w-4 h-4 mx-1" />
            <span className="hover:text-[#A57322] cursor-pointer transition-colors">Trang tĩnh</span>
            <ChevronRight className="w-4 h-4 mx-1" />
            <span className="text-[#A57322]">Về Chúng Tôi</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight flex items-center gap-3" style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#111827', margin: '0.5rem 0' }}>
            <FileText className="w-8 h-8 text-[#A57322]" />
            Chỉnh sửa Trang Về Chúng Tôi
          </h1>
          <p className="text-gray-500 mt-2" style={{ color: '#6b7280' }}>Cập nhật nội dung giới thiệu về công ty và thương hiệu.</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '0.875rem 2rem', borderRadius: '0.75rem', backgroundColor: '#A57322', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
          className="group relative transition-all duration-200 hover:bg-[#8b601c] hover:shadow-[0_8px_20px_-6px_rgba(165,115,34,0.4)]"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Đang lưu...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Lưu Thay Đổi
            </span>
          )}
        </button>
      </div>

      {/* Notification Toast */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 shadow-sm transform transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
          message.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {/* Main Form Content */}
      <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 24px -8px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6' }} className="overflow-hidden">
        <div className="space-y-8" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Title Input */}
          <div className="space-y-3" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label className="text-sm font-semibold text-gray-900 flex items-center gap-2" style={{ fontWeight: '600', color: '#111827' }}>
              Tiêu đề trang
              <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề trang..."
                style={{ width: '100%', padding: '0.875rem 1.25rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.75rem', outline: 'none' }}
                className="text-gray-900 transition-all duration-200 focus:bg-white focus:border-[#A57322] focus:ring-4 focus:ring-[#A57322]/10 hover:border-gray-300 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Editor Content */}
          <div className="space-y-3" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label className="text-sm font-semibold text-gray-900 flex items-center gap-2" style={{ fontWeight: '600', color: '#111827' }}>
              Nội dung chi tiết
              <span className="text-red-500">*</span>
            </label>
            <div style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #e5e7eb', backgroundColor: 'white' }} className="focus-within:border-[#A57322] focus-within:ring-4 focus-within:ring-[#A57322]/10 transition-all duration-200">

              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                placeholder="Bắt đầu viết nội dung về chúng tôi ở đây..."
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ color: [] }, { background: [] }],
                    [{ align: [] }],
                    [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
                    ['link', 'image', 'video'],
                    ['blockquote', 'code-block'],
                    ['clean'],
                  ],
                }}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
