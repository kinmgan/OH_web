"use client";

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// ReactQuill must be loaded dynamically on the client side in Next.js
const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-50 animate-pulse rounded-md border border-gray-200"></div>
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string; // Add this prop
}

export default function RichTextEditor({ value, onChange, placeholder, className = '' }: RichTextEditorProps) {
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ],
  }), []);

  return (
    <div className={`rich-text-container ${className}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
        className="h-64 mb-12"
      />
      <style jsx global>{`
        .rich-text-container .ql-container {
          font-family: inherit;
          font-size: 15px;
          min-height: 250px;
        }
        .rich-text-container .ql-editor {
          min-height: 250px;
        }
      `}</style>
    </div>
  );
}
