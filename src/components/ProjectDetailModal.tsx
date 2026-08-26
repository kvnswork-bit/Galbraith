import React, { useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { PortfolioProject, PortfolioSection } from '../types';
import { ArtworkImage } from './ArtworkImage';

interface ProjectDetailProps {
  project: PortfolioProject;
  section?: PortfolioSection;
  onClose: () => void;
  onNavigateSection?: (slug: string) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailProps> = ({
  project,
  section,
  onClose,
  onNavigateSection
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  const handleBack = () => {
    if (section && onNavigateSection) {
      onNavigateSection(section.slug);
    } else {
      onClose();
    }
  };

  return (
    <div
      id="project-detail-view"
      className="fixed inset-0 z-50 bg-white overflow-y-auto animate-in fade-in duration-300"
    >
      {/* Top sticky minimalist control bar */}
      <div className="sticky top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-b border-neutral-100 px-6 md:px-12 py-4 flex items-center justify-between">
        <button
          id="project-back-button"
          onClick={handleBack}
          className="group flex items-center space-x-2 text-xs font-mono uppercase tracking-[0.2em] text-neutral-600 hover:text-black transition-colors"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          <span>BACK / {section ? section.name : 'ALL WORK'}</span>
        </button>

        <button
          onClick={onClose}
          className="p-1 text-neutral-500 hover:text-black transition-colors"
          aria-label="Close project view"
        >
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-12 py-10 md:py-16">
        {/* Project Meta Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 pb-12 md:pb-16 border-b border-neutral-100">
          <div className="lg:col-span-8 space-y-4">
            {section && (
              <div className="text-[11px] font-mono tracking-[0.25em] text-neutral-400 uppercase">
                {section.name} {project.category ? `· ${project.category}` : ''}
              </div>
            )}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif tracking-tight text-black leading-[1.05]">
              {project.title}
            </h1>
            {project.description && (
              <p className="text-base sm:text-lg text-neutral-700 font-light leading-relaxed pt-2 max-w-2xl">
                {project.description}
              </p>
            )}
          </div>

          <div className="lg:col-span-4 flex flex-col justify-end space-y-3 font-mono text-xs text-neutral-600 lg:border-l lg:border-neutral-100 lg:pl-8">
            {project.client && (
              <div>
                <span className="text-neutral-400 tracking-wider block text-[10px] uppercase">Client / Brand</span>
                <span className="text-black font-medium">{project.client}</span>
              </div>
            )}
            {project.year && (
              <div>
                <span className="text-neutral-400 tracking-wider block text-[10px] uppercase">Year</span>
                <span className="text-black">{project.year}</span>
              </div>
            )}
            {project.category && (
              <div>
                <span className="text-neutral-400 tracking-wider block text-[10px] uppercase">Medium / Discipline</span>
                <span className="text-black">{project.category}</span>
              </div>
            )}
          </div>
        </div>

        {/* Primary Artwork / Main Image */}
        <div className="py-10 md:py-16">
          <ArtworkImage
            src={project.mainImage}
            alt={project.title}
            aspectRatio={project.images?.[0]?.aspectRatio || 'landscape'}
            className="w-full shadow-xs"
            priority={true}
          />
        </div>

        {/* Additional Images / Spreads / Gallery */}
        {project.images && project.images.length > 0 && (
          <div className="space-y-12 md:space-y-20 pt-4">
            {project.images.map((img, index) => (
              <div key={img.id || index} className="space-y-3">
                <ArtworkImage
                  src={img.url}
                  alt={`${project.title} plate ${index + 1}`}
                  aspectRatio={img.aspectRatio || 'landscape'}
                  className="w-full"
                />
                {img.caption && (
                  <div className="text-xs font-mono text-neutral-500 tracking-wide pt-1 flex items-baseline justify-between">
                    <span>{img.caption}</span>
                    <span className="text-[10px] text-neutral-400 font-mono">PLATE {String(index + 1).padStart(2, '0')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bottom Back Action */}
        <div className="mt-20 pt-10 border-t border-neutral-100 flex justify-between items-center">
          <button
            onClick={handleBack}
            className="group flex items-center space-x-2 text-xs font-mono uppercase tracking-[0.2em] text-neutral-600 hover:text-black transition-colors"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
            <span>BACK / {section ? section.name : 'ALL WORK'}</span>
          </button>

          <div className="text-[11px] font-mono text-neutral-400">
            KEVIN GALBRAITH STUDIO ARCHIVE
          </div>
        </div>
      </div>
    </div>
  );
};
