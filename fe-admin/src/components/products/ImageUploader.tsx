"use client";

import React, { useCallback, useState, useId } from 'react';
import { X, UploadCloud, Image as ImageIcon, Star } from 'lucide-react';
import { ProductImage } from '@/types/product.type';

interface ImageUploaderProps {
  existingImages: ProductImage[];
  onRemoveExistingImage: (publicId: string) => void;
  newFiles: File[];
  onAddFiles: (files: File[]) => void;
  onRemoveNewFile: (index: number) => void;
  defaultImageIdentifier?: string;
  onSetDefaultImage?: (id: string) => void;
}

export default function ImageUploader({
  existingImages,
  onRemoveExistingImage,
  newFiles,
  onAddFiles,
  onRemoveNewFile,
  defaultImageIdentifier,
  onSetDefaultImage
}: ImageUploaderProps) {
  
  const id = useId();
  const inputId = `image-upload-input-${id.replace(/:/g, "")}`;
  
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
      if (droppedFiles.length > 0) {
        onAddFiles(droppedFiles);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
      if (selectedFiles.length > 0) {
        onAddFiles(selectedFiles);
      }
    }
    e.target.value = ''; // Reset input so same file can be selected again
  };

  return (
    <div className="w-full">
      <div 
        className={`w-full border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragOver ? 'border-[#A57322] bg-[#FDFBF7]' : 'border-gray-300 hover:bg-gray-50'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById(inputId)?.click()}
      >
        <input 
          id={inputId} 
          type="file" 
          multiple 
          accept="image/*" 
          className="hidden" 
          onChange={handleChange} 
        />
        <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
        <p className="text-sm font-medium text-gray-600">Kéo thả ảnh vào đây hoặc click để chọn file</p>
        <p className="text-xs text-gray-400 mt-1">Hỗ trợ JPG, PNG, WEBP</p>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Render Existing Images */}
        {existingImages.map((img) => {
          const isDefault = defaultImageIdentifier ? defaultImageIdentifier === img.imagePublicId : img.isDefault;
          return (
          <div key={img.imagePublicId} className="relative group aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
            <img src={img.productImageUrl} alt="Existing" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {onSetDefaultImage && !isDefault && (
                <button 
                  type="button" 
                  onClick={(e) => { e.preventDefault(); onSetDefaultImage(img.imagePublicId); }}
                  className="bg-white text-yellow-500 p-1.5 rounded-full hover:bg-yellow-50"
                  title="Đặt làm ảnh mặc định"
                >
                  <Star className="w-4 h-4" />
                </button>
              )}
              <button 
                type="button" 
                onClick={(e) => { e.preventDefault(); onRemoveExistingImage(img.imagePublicId); }}
                className="bg-white text-red-500 p-1.5 rounded-full hover:bg-red-50"
                title="Xóa ảnh"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {isDefault && (
              <div className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium shadow-sm">Ảnh mặc định</div>
            )}
          </div>
        )})}

        {/* Render New Uploading Files Preview */}
        {newFiles.map((file, idx) => {
          const isDefault = defaultImageIdentifier === `new_${idx}`;
          return (
          <div key={idx} className="relative group aspect-square rounded-lg border border-[#A57322] overflow-hidden bg-gray-50">
            <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {onSetDefaultImage && !isDefault && (
                <button 
                  type="button" 
                  onClick={(e) => { e.preventDefault(); onSetDefaultImage(`new_${idx}`); }}
                  className="bg-white text-yellow-500 p-1.5 rounded-full hover:bg-yellow-50"
                  title="Đặt làm ảnh mặc định"
                >
                  <Star className="w-4 h-4" />
                </button>
              )}
              <button 
                type="button" 
                onClick={(e) => { e.preventDefault(); onRemoveNewFile(idx); }}
                className="bg-white text-red-500 p-1.5 rounded-full hover:bg-red-50"
                title="Xóa ảnh"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {isDefault ? (
               <div className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium shadow-sm">
                 Ảnh mặc định
               </div>
            ) : (
               <div className="absolute top-1 right-1 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium shadow-sm">
                 Mới
               </div>
            )}
          </div>
        )})}
      </div>
    </div>
  );
}
