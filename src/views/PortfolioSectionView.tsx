import React, { useState } from 'react';
import { ArrowLeft, Images, FileText, Grid, LayoutGrid } from 'lucide-react';
import { PortfolioSection, PortfolioProject } from '../types';
import { ArtworkImage } from '../components/ArtworkImage';

interface PortfolioSectionViewProps {
  section: PortfolioSection;
  projects: PortfolioProject[];
  onSelectProject: (project: PortfolioProject) => void;
  onNavigateHome: () => void;
}

export const PortfolioSectionView: React.FC<PortfolioSectionViewProps> = ({
  section,
  projects,
  onSelectProject,
  onNavigateHome
}) => {
  const [columns, setColumns] = useState<'2-col' | '3-col'>('3-col');

  const sectionProjects = (projects || [])
    .filter(p => p.sectionId === section.id && p.isPublished !== false)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="w-full pt-32 sm:pt-36 md:pt-40 pb-24 max-w-7xl mx-auto px-6 md:px-12 animate-in fade-in duration-300">
      {/* Top back navigation */}
      <button
        onClick={onNavigateHome}
        className="group flex items-center space-x-2 text-xs font-mono uppercase tracking-[0.2em] text-neutral-500 hover:text-black transition-colors mb-10"
      >
        <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-1" />
        <span>BACK / OVERVIEW</span>
      </button>

      {/* Section Header */}
      <div className="pb-10 md:pb-14 mb-10 md:mb-14 border-b border-neutral-200 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-neutral-400 mb-2">
            DISCIPLINE ARCHIVE · {sectionProjects.length} {sectionProjects.length === 1 ? 'WORK' : 'WORKS'}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif tracking-tight text-black">
            {section.name}
          </h1>
          {section.description && (
            <p className="text-base sm:text-lg text-neutral-600 font-light max-w-3xl mt-4 leading-relaxed">
              {section.description}
            </p>
          )}
        </div>

        {/* View density toggle */}
        {sectionProjects.length > 0 && (
          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="text-neutral-400 text-[10px] uppercase tracking-widest mr-2">Layout:</span>
            <button
              onClick={() => setColumns('2-col')}
              className={`p-2 border transition-colors ${
                columns === '2-col' ? 'bg-black text-white border-black' : 'bg-white text-neutral-600 border-neutral-200 hover:border-black'
              }`}
              title="2 Columns (Large)"
            >
              <Grid size={15} />
            </button>
            <button
              onClick={() => setColumns('3-col')}
              className={`p-2 border transition-colors ${
                columns === '3-col' ? 'bg-black text-white border-black' : 'bg-white text-neutral-600 border-neutral-200 hover:border-black'
              }`}
              title="3 Columns (Standard)"
            >
              <LayoutGrid size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Main Content Layout — 1 Cover Image per Project */}
      {sectionProjects.length === 0 ? (
        <div className="py-24 text-center space-y-3 bg-neutral-50 p-8 border border-neutral-200">
          <p className="text-sm font-mono uppercase tracking-widest text-neutral-400">
            No projects in {section.name} yet
          </p>
          <p className="text-xs text-neutral-500 font-light">
            Upload artwork and create projects via the studio administration panel.
          </p>
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 ${
            columns === '2-col' ? 'md:grid-cols-2 gap-10 md:gap-14' : 'md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10'
          }`}
        >
          {sectionProjects.map((project, idx) => {
            const hasMultipleImages = project.images && project.images.length > 1;
            const isGalleryMode = project.displayMode === 'gallery' || (!project.displayMode && hasMultipleImages);
            const totalPlates = (project.images && project.images.length > 0) ? project.images.length : (project.mainImage ? 1 : 0);

            return (
              <article
                key={project.id}
                id={`project-card-${project.id}`}
                onClick={() => onSelectProject(project)}
                className="group cursor-pointer space-y-4 transition-all duration-300"
              >
                {/* 1 Clean Cover Image */}
                <div className="relative overflow-hidden bg-neutral-100 border border-neutral-200/70 shadow-2xs">
                  <ArtworkImage
                    src={project.mainImage || project.images?.[0]?.url}
                    alt={project.title}
                    aspectRatio={
                      section.slug === 'logos'
                        ? 'square'
                        : section.slug === 'photography'
                        ? idx % 2 === 0 ? 'portrait' : 'landscape'
                        : 'landscape'
                    }
                    className="w-full transition-transform duration-700 group-hover:scale-[1.02]"
                  />

                  {/* Mode & Image Count Badge */}
                  <div className="absolute top-3 right-3 flex items-center space-x-1.5 bg-black/80 backdrop-blur-xs text-white text-[9px] font-mono uppercase tracking-widest px-2.5 py-1">
                    {isGalleryMode ? (
                      <>
                        <Images size={11} className="text-neutral-300" />
                        <span>GALLERY ({totalPlates})</span>
                      </>
                    ) : (
                      <>
                        <FileText size={11} className="text-neutral-300" />
                        <span>ARTWORK</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Meta details */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-baseline gap-2">
                    <h2 className="text-base sm:text-lg font-serif text-black group-hover:underline tracking-tight">
                      {project.title}
                    </h2>
                    {project.year && (
                      <span className="text-[11px] font-mono text-neutral-400 flex-shrink-0">
                        {project.year}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500 font-light">
                    {project.client && (
                      <span className="font-medium text-neutral-700">{project.client}</span>
                    )}
                    {project.client && project.category && (
                      <span className="text-neutral-300">·</span>
                    )}
                    {project.category && (
                      <span>{project.category}</span>
                    )}
                  </div>

                  {project.description && (
                    <p className="text-xs text-neutral-600 font-light line-clamp-2 pt-1 leading-relaxed">
                      {project.description}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
