import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight,
  Images,
  FileText,
  Maximize2,
  Minimize2,
  Grid,
  SlidersHorizontal
} from 'lucide-react';
import { PortfolioProject, PortfolioSection, ProjectImage } from '../types';
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
  // Assemble all images (mainImage + images array) without duplicates
  const allImages: ProjectImage[] = React.useMemo(() => {
    const list: ProjectImage[] = [];
    if (project.images && project.images.length > 0) {
      return project.images;
    }
    if (project.mainImage) {
      list.push({
        id: 'main-0',
        url: project.mainImage,
        order: 1,
        caption: project.title
      });
    }
    return list;
  }, [project]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [galleryViewType, setGalleryViewType] = useState<'slider' | 'grid'>('slider');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(true);

  const isGalleryMode = project.displayMode === 'gallery' || (!project.displayMode && allImages.length > 1);

  const handlePrev = useCallback(() => {
    setActiveIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
  }, [allImages.length]);

  const handleNext = useCallback(() => {
    setActiveIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
  }, [allImages.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose, isFullscreen, handlePrev, handleNext]);

  const handleBack = () => {
    if (section && onNavigateSection) {
      onNavigateSection(section.slug);
    } else {
      onClose();
    }
  };

  const activeImage: ProjectImage = allImages[activeIndex] || {
    id: 'placeholder',
    url: project.mainImage || '',
    order: 1,
    caption: project.title
  };

  return (
    <div
      id="project-detail-view"
      className="fixed inset-0 z-50 bg-white overflow-y-auto animate-in fade-in duration-300 flex flex-col"
    >
      {/* Top sticky minimalist control bar */}
      <header className="sticky top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 px-4 sm:px-8 md:px-12 py-3.5 flex items-center justify-between">
        <button
          id="project-back-button"
          onClick={handleBack}
          className="group flex items-center space-x-2 text-xs font-mono uppercase tracking-[0.2em] text-neutral-600 hover:text-black transition-colors"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          <span>BACK / {section ? section.name : 'ARCHIVE'}</span>
        </button>

        {/* Center mode indicator */}
        <div className="hidden sm:flex items-center space-x-2 text-[11px] font-mono uppercase tracking-widest text-neutral-400">
          {isGalleryMode ? (
            <>
              <Images size={13} className="text-black" />
              <span className="text-black">GALLERY VIEW</span>
              <span>·</span>
              <span>{allImages.length} {allImages.length === 1 ? 'IMAGE' : 'IMAGES'}</span>
            </>
          ) : (
            <>
              <FileText size={13} className="text-black" />
              <span className="text-black">INDIVIDUAL ARTWORK</span>
            </>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="p-1 text-neutral-500 hover:text-black transition-colors"
            aria-label="Close project view"
          >
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* =========================================================================
          MODE 1: MULTI-IMAGE GALLERY PRESENTATION
          ========================================================================= */}
      {isGalleryMode ? (
        <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-8 md:px-12 py-6 md:py-10 space-y-8">
          {/* Project Title & Meta Banner */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-200">
            <div className="space-y-2">
              <div className="text-[10px] font-mono tracking-[0.25em] text-neutral-400 uppercase">
                {section?.name || 'STUDIO ARCHIVE'} {project.category ? `· ${project.category}` : ''}
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif text-black tracking-tight">
                {project.title}
              </h1>
            </div>

            {/* Gallery View Controls */}
            <div className="flex items-center space-x-3 font-mono text-xs">
              <div className="flex items-center bg-neutral-100 p-0.5 border border-neutral-200">
                <button
                  onClick={() => setGalleryViewType('slider')}
                  className={`px-3 py-1.5 flex items-center space-x-1.5 transition-colors ${
                    galleryViewType === 'slider' ? 'bg-white text-black shadow-2xs' : 'text-neutral-500 hover:text-black'
                  }`}
                >
                  <SlidersHorizontal size={13} />
                  <span>SLIDES</span>
                </button>
                <button
                  onClick={() => setGalleryViewType('grid')}
                  className={`px-3 py-1.5 flex items-center space-x-1.5 transition-colors ${
                    galleryViewType === 'grid' ? 'bg-white text-black shadow-2xs' : 'text-neutral-500 hover:text-black'
                  }`}
                >
                  <Grid size={13} />
                  <span>GRID</span>
                </button>
              </div>

              <button
                onClick={() => setShowInfo(!showInfo)}
                className={`px-3 py-1.5 border transition-colors ${
                  showInfo ? 'bg-black text-white border-black' : 'bg-white text-neutral-600 border-neutral-200 hover:border-black'
                }`}
              >
                INFO
              </button>
            </div>
          </div>

          {/* Slider / Carousel View */}
          {galleryViewType === 'slider' ? (
            <div className="space-y-6">
              {/* Main Image Stage */}
              <div className="relative bg-neutral-50 border border-neutral-200 min-h-[450px] sm:min-h-[550px] md:min-h-[650px] flex items-center justify-center p-4 sm:p-8 overflow-hidden group">
                {activeImage.url ? (
                  <img
                    src={activeImage.url}
                    alt={activeImage.caption || `${project.title} - Image ${activeIndex + 1}`}
                    referrerPolicy="no-referrer"
                    className="max-h-[72vh] max-w-full object-contain shadow-xs transition-all duration-300"
                  />
                ) : (
                  <div className="w-64 h-64 bg-black flex items-center justify-center">
                    <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">No Image</span>
                  </div>
                )}

                {/* Left/Right Navigation Arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-black hover:text-white text-black p-3 shadow-md transition-all duration-200 border border-neutral-200"
                      aria-label="Previous plate"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-black hover:text-white text-black p-3 shadow-md transition-all duration-200 border border-neutral-200"
                      aria-label="Next plate"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}

                {/* Counter Badge */}
                <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-xs text-white text-[10px] font-mono tracking-widest uppercase px-3 py-1.5">
                  PLATE {String(activeIndex + 1).padStart(2, '0')} / {String(allImages.length).padStart(2, '0')}
                </div>
              </div>

              {/* Caption */}
              {activeImage.caption && (
                <div className="text-center py-1">
                  <p className="text-xs font-mono text-neutral-600 tracking-wide">
                    {activeImage.caption}
                  </p>
                </div>
              )}

              {/* Bottom Thumbnail Filmstrip */}
              {allImages.length > 1 && (
                <div className="pt-2">
                  <div className="flex items-center space-x-3 overflow-x-auto py-2 px-1 scrollbar-thin">
                    {allImages.map((img, idx) => (
                      <button
                        key={img.id || idx}
                        onClick={() => setActiveIndex(idx)}
                        className={`relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 bg-neutral-100 border-2 overflow-hidden transition-all duration-200 ${
                          activeIndex === idx ? 'border-black scale-105 shadow-sm' : 'border-neutral-200 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={`Thumbnail ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 right-0 bg-black/80 text-white text-[8px] font-mono px-1">
                          {idx + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Multi-Image Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 pt-4">
              {allImages.map((img, idx) => (
                <div
                  key={img.id || idx}
                  onClick={() => {
                    setActiveIndex(idx);
                    setGalleryViewType('slider');
                  }}
                  className="group cursor-pointer space-y-2 bg-neutral-50 p-2 border border-neutral-200 hover:border-black transition-colors"
                >
                  <div className="aspect-[4/3] bg-neutral-100 overflow-hidden flex items-center justify-center">
                    <img
                      src={img.url}
                      alt={img.caption || `Plate ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 pt-1 px-1">
                    <span>{img.caption || `PLATE 0${idx + 1}`}</span>
                    <span>#{idx + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Project Details & Editorial Info Drawer */}
          {showInfo && (
            <div className="bg-neutral-50 border border-neutral-200 p-6 sm:p-10 space-y-6 mt-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-4">
                  <div className="text-[10px] font-mono tracking-[0.25em] text-neutral-400 uppercase">
                    PROJECT OVERVIEW & EDITORIAL CONTEXT
                  </div>
                  <p className="text-sm sm:text-base text-neutral-800 font-light leading-relaxed whitespace-pre-line">
                    {project.description || 'No descriptive notes added for this gallery set.'}
                  </p>
                </div>

                <div className="lg:col-span-4 space-y-4 font-mono text-xs border-t lg:border-t-0 lg:border-l border-neutral-200 pt-6 lg:pt-0 lg:pl-8">
                  {project.client && (
                    <div>
                      <span className="text-neutral-400 text-[10px] tracking-wider uppercase block">Client / Collection</span>
                      <span className="text-black font-medium">{project.client}</span>
                    </div>
                  )}
                  {project.year && (
                    <div>
                      <span className="text-neutral-400 text-[10px] tracking-wider uppercase block">Year</span>
                      <span className="text-black">{project.year}</span>
                    </div>
                  )}
                  {project.category && (
                    <div>
                      <span className="text-neutral-400 text-[10px] tracking-wider uppercase block">Classification</span>
                      <span className="text-black">{project.category}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-neutral-400 text-[10px] tracking-wider uppercase block">Gallery Volume</span>
                    <span className="text-black">{allImages.length} Plates in Set</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* =========================================================================
            MODE 2: INDIVIDUAL ART PIECE / EXHIBITION PRESENTATION
            ========================================================================= */
        <div className="max-w-6xl w-full mx-auto px-6 md:px-12 py-10 md:py-16 space-y-12 md:space-y-16">
          {/* Curatorial Header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 pb-10 md:pb-12 border-b border-neutral-200">
            <div className="lg:col-span-8 space-y-3">
              {section && (
                <div className="text-[10px] font-mono tracking-[0.25em] text-neutral-400 uppercase">
                  {section.name} {project.category ? `· ${project.category}` : ''}
                </div>
              )}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif tracking-tight text-black leading-[1.05]">
                {project.title}
              </h1>
            </div>

            <div className="lg:col-span-4 flex flex-col justify-end space-y-3 font-mono text-xs text-neutral-600 lg:border-l lg:border-neutral-200 lg:pl-8">
              {project.client && (
                <div>
                  <span className="text-neutral-400 tracking-wider block text-[10px] uppercase">Client / Brand / Collection</span>
                  <span className="text-black font-medium">{project.client}</span>
                </div>
              )}
              {project.year && (
                <div>
                  <span className="text-neutral-400 tracking-wider block text-[10px] uppercase">Date / Year</span>
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

          {/* Primary Artwork Exhibition Display */}
          <div className="w-full bg-neutral-50 border border-neutral-200 p-4 sm:p-8 md:p-12 flex items-center justify-center">
            {project.mainImage || allImages[0]?.url ? (
              <img
                src={project.mainImage || allImages[0]?.url}
                alt={project.title}
                referrerPolicy="no-referrer"
                className="max-h-[82vh] max-w-full object-contain shadow-xs"
              />
            ) : (
              <div className="w-full h-96 bg-black flex items-center justify-center">
                <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Black Placeholder</span>
              </div>
            )}
          </div>

          {/* Curatorial Plaque & Project Description */}
          {project.description && (
            <div className="bg-white border-l-2 border-black pl-6 sm:pl-8 py-2 max-w-3xl">
              <div className="text-[10px] font-mono tracking-[0.25em] text-neutral-400 uppercase mb-2">
                EDITORIAL NOTES & ARTIST STATEMENT
              </div>
              <p className="text-base sm:text-lg text-neutral-800 font-light leading-relaxed whitespace-pre-line">
                {project.description}
              </p>
            </div>
          )}

          {/* Supporting Plates / Process Sketches if any */}
          {allImages.length > 1 && (
            <div className="space-y-8 pt-8 border-t border-neutral-200">
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-neutral-400">
                SUPPORTING PLATES & DETAIL PERSPECTIVES ({allImages.length - 1})
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {allImages.slice(1).map((img, i) => (
                  <div key={img.id || i} className="space-y-3 bg-neutral-50 p-4 border border-neutral-200">
                    <img
                      src={img.url}
                      alt={img.caption || `${project.title} detail ${i + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-auto object-contain"
                    />
                    {img.caption && (
                      <div className="text-xs font-mono text-neutral-500 tracking-wide pt-1 flex justify-between">
                        <span>{img.caption}</span>
                        <span className="text-[10px] text-neutral-400">DETAIL 0{i + 1}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Navigation */}
      <footer className="mt-auto border-t border-neutral-200 bg-neutral-50 px-6 md:px-12 py-6 flex justify-between items-center text-xs font-mono">
        <button
          onClick={handleBack}
          className="group flex items-center space-x-2 uppercase tracking-[0.2em] text-neutral-600 hover:text-black transition-colors"
        >
          <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-1" />
          <span>RETURN TO {section ? section.name : 'ARCHIVE'}</span>
        </button>

        <div className="text-[11px] text-neutral-400 tracking-widest uppercase">
          KEVIN GALBRAITH STUDIO ARCHIVE
        </div>
      </footer>
    </div>
  );
};
