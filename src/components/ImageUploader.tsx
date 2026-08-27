import React, { useState, useRef } from 'react';
import { Upload, X, ArrowUp, ArrowDown, Images, Image as ImageIcon, Loader2, Plus, Layers, Trash2 } from 'lucide-react';
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
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<'bulk' | 'single'>(singleMode ? 'single' : 'bulk');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMessage(null);
    setUploading(true);
    setUploadProgressText(`Uploading and processing ${fileList.length} image${fileList.length > 1 ? 's' : ''}...`);

    try {
      const files = Array.from(fileList);
      const uploadedUrls = await apiService.uploadFiles(files);

      if (singleMode && onSingleUpload && uploadedUrls.length > 0) {
        onSingleUpload(uploadedUrls[0]);
      } else if (uploadMode === 'single' && uploadedUrls.length > 0) {
        // Replace or add 1 image
        const newImg: ProjectImage = {
          id: `img-${Date.now()}-0`,
          url: uploadedUrls[0],
          caption: '',
          order: images.length + 1,
          aspectRatio: 'landscape'
        };
        onChange([...images, newImg]);
      } else {
        // Bulk add all uploaded images to gallery
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
      setUploadProgressText('');
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

  const clearAllImages = () => {
    if (images.length === 0) return;
    if (confirm('Remove all uploaded images in this gallery?')) {
      onChange([]);
    }
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
      {/* Upload Mode Selector (Bulk vs Single) */}
      {!singleMode && (
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setUploadMode('bulk')}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider flex items-center space-x-1.5 border transition-all ${
                uploadMode === 'bulk'
                  ? 'bg-black text-white border-black font-semibold'
                  : 'bg-white text-neutral-600 border-neutral-300 hover:border-black'
              }`}
            >
              <Layers size={13} />
              <span>Gallery Bulk Upload (Multiple Files)</span>
            </button>

            <button
              type="button"
              onClick={() => setUploadMode('single')}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider flex items-center space-x-1.5 border transition-all ${
                uploadMode === 'single'
                  ? 'bg-black text-white border-black font-semibold'
                  : 'bg-white text-neutral-600 border-neutral-300 hover:border-black'
              }`}
            >
              <ImageIcon size={13} />
              <span>Single Image Upload</span>
            </button>
          </div>

          {images.length > 0 && (
            <button
              type="button"
              onClick={clearAllImages}
              className="text-[11px] font-mono uppercase tracking-wider text-red-500 hover:text-red-700 flex items-center space-x-1"
            >
              <Trash2 size={12} />
              <span>Clear Gallery ({images.length})</span>
            </button>
          )}
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed p-8 md:p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-black bg-neutral-100 scale-[1.005]'
            : 'border-neutral-300 hover:border-black bg-neutral-50 hover:bg-neutral-100/60'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple={!singleMode && uploadMode === 'bulk'}
          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif"
          onChange={e => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-black mb-1" />
              <p className="text-xs font-mono tracking-wider uppercase text-neutral-800 font-semibold">
                {uploadProgressText || 'Uploading imagery to studio archive...'}
              </p>
            </>
          ) : (
            <>
              {uploadMode === 'bulk' && !singleMode ? (
                <Layers className="w-9 h-9 text-black mb-1" />
              ) : (
                <Upload className="w-8 h-8 text-neutral-500 mb-1" />
              )}

              <p className="text-xs font-mono tracking-wider uppercase text-black font-semibold">
                {singleMode
                  ? 'Click or Drop to replace image'
                  : uploadMode === 'bulk'
                  ? 'DROP MULTIPLE GALLERY IMAGES HERE (BULK UPLOAD)'
                  : 'DROP SINGLE ARTWORK IMAGE HERE'}
              </p>
              <p className="text-[11px] text-neutral-500 font-mono">
                Supports JPG, PNG, WEBP, SVG · Select 1 to 50 files simultaneously
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
          <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.25em] uppercase text-neutral-400">
            <span>ATTACHED GALLERY PLATES & SPREADS ({images.length})</span>
            <span className="text-neutral-500 font-normal">First image serves as project cover</span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {images.map((img, index) => (
              <div
                key={img.id}
                className="p-3 bg-white border border-neutral-200 flex items-center justify-between gap-4"
              >
                {/* Index & Thumbnail Preview */}
                <div className="flex items-center space-x-2.5 flex-shrink-0">
                  <span className="text-[10px] font-mono text-neutral-400 w-4">
                    #{index + 1}
                  </span>
                  <div className="w-16 h-12 bg-black flex-shrink-0 overflow-hidden flex items-center justify-center border border-neutral-200">
                    {img.url ? (
                      <img
                        src={img.url}
                        alt={`Plate ${index + 1}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-[8px] font-mono text-neutral-500 uppercase">Black</span>
                    )}
                  </div>
                </div>

                {/* Caption & Aspect selector */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Plate caption or editorial description..."
                    value={img.caption || ''}
                    onChange={e => updateCaption(img.id, e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 text-xs font-mono text-black focus:outline-none focus:border-black"
                  />

                  <select
                    value={img.aspectRatio || 'landscape'}
                    onChange={e => updateAspect(img.id, e.target.value as any)}
                    className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 text-xs font-mono text-black focus:outline-none focus:border-black"
                  >
                    <option value="landscape">Landscape (16:10)</option>
                    <option value="portrait">Portrait (3:4)</option>
                    <option value="square">Square (1:1)</option>
                    <option value="full">Panoramic / Full (21:9)</option>
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
                    title="Delete plate"
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
