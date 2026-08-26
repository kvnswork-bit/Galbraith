import React, { useState } from 'react';

interface ArtworkImageProps {
  src?: string;
  alt: string;
  aspectRatio?: 'portrait' | 'landscape' | 'square' | 'full' | 'auto';
  className?: string;
  showPlaceholderNotice?: boolean;
  priority?: boolean;
  onClick?: () => void;
}

export const ArtworkImage: React.FC<ArtworkImageProps> = ({
  src,
  alt,
  aspectRatio = 'landscape',
  className = '',
  showPlaceholderNotice = false,
  priority = false,
  onClick
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'portrait':
        return 'aspect-[3/4]';
      case 'landscape':
        return 'aspect-[16/10]';
      case 'square':
        return 'aspect-square';
      case 'full':
        return 'aspect-[21/9]';
      case 'auto':
      default:
        return 'min-h-[260px]';
    }
  };

  // If no image source or error occurred, render intentional solid black rectangular placeholder
  if (!src || error) {
    return (
      <div
        onClick={onClick}
        className={`w-full ${getAspectClass()} bg-black relative flex items-end p-4 md:p-6 transition-all duration-300 select-none ${onClick ? 'cursor-pointer hover:bg-neutral-900' : ''} ${className}`}
        id={`placeholder-${alt.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      >
        {showPlaceholderNotice && (
          <div className="text-[10px] tracking-[0.2em] uppercase text-neutral-400 font-mono">
            Placeholder Archive
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative w-full ${getAspectClass()} bg-neutral-100 overflow-hidden ${onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-all duration-700 ease-out ${
          loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'
        } ${onClick ? 'group-hover:scale-[1.02]' : ''}`}
      />
    </div>
  );
};
