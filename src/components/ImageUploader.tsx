import React, { useState, useRef } from 'react';
import { Upload, X, ArrowUp, ArrowDown, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import { apiService } from '../services/api';
import { ProjectImage } from '../types';

interface ImageUploaderProps {
  images: ProjectImage[];
  onChange: (images: ProjectImage[]) => void;
  singleMode?: boolean; // For single hero or logo uploads
  onSingleUpload?: (url: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  singleMode = false,
  onSingleUpload
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMessage(null);
    setUploading(true);

    try {
      const files = Array.from(fileList);
      const uploadedUrls = await apiService.uploadFiles(files);

      if (singleMode && onSingleUpload && uploadedUrls.length > 0) {
        onSingleUpload(uploadedUrls[0]);
      } else {
        const newImages: ProjectImage[] = uploadedUrls.map((url, idx) => ({
          id: `img-${Date.now()}-${idx}`,
          url,
          caption: '',
          order: images.length + idx + 1,
          aspectRatio: 'landscape'
        }));
        onChange([...images, ...newImages]);
      }
    } catch (err: any) {
      console.error('File upload failed', err);
      setErrorMessage(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (id: string) => {
    onChange(images.filter(img => img.id !== id));
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const newItems = [...images];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    // update order numbers
    newItems.forEach((img, i) => { img.order = i + 1; });
    onChange(newItems);
  };

  const updateCaption = (id: string, caption: string) => {
    onChange(images.map(img => img.id === id ? { ...img, caption } : img));
  };

  const updateAspect = (id: string, aspectRatio: 'portrait' | 'landscape' | 'square' | 'full') => {
    onChange(images.map(img => img.id === id ? { ...img, aspectRatio } : img));
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed p-8 md:p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-black bg-neutral-100'
            : 'border-neutral-200 hover:border-neutral-400 bg-neutral-50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple={!singleMode}
          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif"
          onChange={e => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-black mb-1" />
              <p className="text-xs font-mono tracking-wider uppercase text-neutral-600">
                Uploading and optimizing imagery...
              </p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-neutral-400 mb-1" />
              <p className="text-xs font-mono tracking-wider uppercase text-black font-medium">
                {singleMode ? 'Click or Drop to replace image' : 'Drag & Drop Artwork or Click to Browse'}
              </p>
              <p className="text-[11px] text-neutral-400 font-mono">
                Supports JPG, PNG, WEBP, SVG up to 50MB
              </p>
            </>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-neutral-900 text-white text-xs font-mono">
          {errorMessage}
        </div>
      )}

      {/* Image list & reorder controls */}
      {!singleMode && images.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="text-[10px] font-mono tracking-[0.25em] uppercase text-neutral-400">
            ATTACHED PLATES & SPREADS ({images.length})
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {images.map((img, index) => (
              <div
                key={img.id}
                className="p-3 bg-white border border-neutral-200 flex items-center justify-between gap-4"
              >
                {/* Thumbnail Preview */}
                <div className="w-16 h-12 bg-black flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {img.url ? (
                    <img
                      src={img.url}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-[8px] font-mono text-neutral-500 uppercase">Black</span>
                  )}
                </div>

                {/* Caption & Aspect selector */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Caption or plate description..."
                    value={img.caption || ''}
                    onChange={e => updateCaption(img.id, e.target.value)}
                    className="w-full px-2 py-1.5 bg-neutral-50 border border-neutral-200 text-xs font-mono text-black focus:outline-none focus:border-black"
                  />

                  <select
                    value={img.aspectRatio || 'landscape'}
                    onChange={e => updateAspect(img.id, e.target.value as any)}
                    className="px-2 py-1.5 bg-neutral-50 border border-neutral-200 text-xs font-mono text-black focus:outline-none focus:border-black"
                  >
                    <option value="landscape">Landscape (16:10)</option>
                    <option value="portrait">Portrait (3:4)</option>
                    <option value="square">Square (1:1)</option>
                    <option value="full">Panoramic (21:9)</option>
                  </select>
                </div>

                {/* Reorder and Delete */}
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveImage(index, 'up')}
                    className="p-1 text-neutral-400 hover:text-black disabled:opacity-20"
                    title="Move up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={index === images.length - 1}
                    onClick={() => moveImage(index, 'down')}
                    className="p-1 text-neutral-400 hover:text-black disabled:opacity-20"
                    title="Move down"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="p-1 text-neutral-400 hover:text-red-600 ml-1"
                    title="Delete image"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
