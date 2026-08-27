import React, { useState } from 'react';
import { ArrowLeft, Images, FileText, Grid, LayoutGrid, Eye, EyeOff, Maximize2 } from 'lucide-react';
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
  const [showDetails, setShowDetails] = useState<boolean>(true);

  // Filter published projects for this section
  const sectionProjects = (projects || [])
    .filter(p => p.sectionId === section.id && p.isPublished !== false)
    .sort((a, b) => a.order - b.order);

  // The lead/primary project is the first one in the section
  const leadProject = sectionProjects[0];
  // Additional projects are all other projects in this section
  const additionalProjects = sectionProjects.slice(1);

  // Selected lead project index (user can click any additional work to promote it to the enlarged stage)
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

  const currentEnlarged = (activeLeadId ? sectionProjects.find(p => p.id === activeLeadId) : leadProject) || leadProject;

  return (
    <div className="w-full pt-28 sm:pt-32 md:pt-36 pb-24 max-w-7xl mx-auto px-6 md:px-12 animate-in fade-in duration-300">
      {/* Top Navigation & Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <button
          onClick={onNavigateHome}
          className="group flex items-center space-x-2 text-xs font-mono uppercase tracking-[0.2em] text-neutral-500 hover:text-black transition-colors"
        >
          <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-1" />
          <span>BACK TO ALL DISCIPLINES</span>
        </button>

        {/* Global Details Toggle Switch */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`px-3.5 py-1.5 border text-xs font-mono uppercase tracking-wider flex items-center space-x-2 transition-all ${
              showDetails
                ? 'bg-black text-white border-black shadow-xs'
                : 'bg-white text-neutral-600 border-neutral-300 hover:border-black'
            }`}
            title="Toggle between detailed descriptions and pure visual artwork"
          >
            {showDetails ? <Eye size={13} /> : <EyeOff size={13} />}
            <span>{showDetails ? 'DETAILS: ON' : 'DETAILS: OFF'}</span>
          </button>
        </div>
      </div>

      {/* Section Discipline Heading */}
      <div className="pb-8 mb-10 border-b border-neutral-200 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-neutral-400 mb-2">
            DISCIPLINE ARCHIVE · {sectionProjects.length} {sectionProjects.length === 1 ? 'WORK' : 'WORKS'}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif tracking-tight text-black">
            {section.name}
          </h1>
          {showDetails && section.description && (
            <p className="text-base sm:text-lg text-neutral-600 font-light max-w-3xl mt-4 leading-relaxed">
              {section.description}
            </p>
          )}
        </div>
      </div>

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
        <div className="space-y-16 md:space-y-24">
          {/* =========================================================================
              PART 1: ENLARGED PRIMARY IMAGE STAGE
              ========================================================================= */}
          {currentEnlarged && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-mono tracking-[0.25em] text-neutral-400 uppercase">
                  PRIMARY EXHIBITION WORK
                </div>
                <button
                  onClick={() => onSelectProject(currentEnlarged)}
                  className="text-xs font-mono uppercase tracking-wider text-neutral-500 hover:text-black flex items-center space-x-1.5"
                >
                  <Maximize2 size={12} />
                  <span>EXPAND / SLIDESHOW</span>
                </button>
              </div>

              {/* High-Impact Enlarged Artwork Stage */}
              <div
                onClick={() => onSelectProject(currentEnlarged)}
                className="group relative cursor-pointer overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-xs"
              >
                <ArtworkImage
                  src={currentEnlarged.mainImage || currentEnlarged.images?.[0]?.url}
                  alt={currentEnlarged.title}
                  aspectRatio="full"
                  className="w-full max-h-[82vh] transition-transform duration-700 group-hover:scale-[1.01]"
                />

                {/* Floating expand hint badge */}
                <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-xs text-white text-[10px] font-mono tracking-widest uppercase px-3 py-1.5 flex items-center space-x-2">
                  <Images size={12} />
                  <span>CLICK TO VIEW SLIDESHOW ({currentEnlarged.images?.length || 1})</span>
                </div>
              </div>

              {/* Curatorial Details & Information (Respects Details Toggle) */}
              {showDetails && (
                <div className="pt-2 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                    <h2 className="text-2xl sm:text-3xl font-serif tracking-tight text-black">
                      {currentEnlarged.title}
                    </h2>
                    {currentEnlarged.year && (
                      <span className="text-xs font-mono text-neutral-400">
                        DATE / {currentEnlarged.year}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-600 font-mono">
                    {currentEnlarged.client && (
                      <span className="font-semibold text-neutral-900">{currentEnlarged.client}</span>
                    )}
                    {currentEnlarged.client && currentEnlarged.category && (
                      <span className="text-neutral-300">·</span>
                    )}
                    {currentEnlarged.category && (
                      <span>{currentEnlarged.category}</span>
                    )}
                  </div>

                  {currentEnlarged.description && (
                    <div className="max-w-3xl pt-2">
                      <p className="text-sm sm:text-base text-neutral-700 font-light leading-relaxed whitespace-pre-line">
                        {currentEnlarged.description}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              PART 2: ADDITIONAL WORKS IN A GALLERY LAYOUT
              ========================================================================= */}
          {sectionProjects.length > 1 && (
            <div className="space-y-8 pt-10 border-t border-neutral-200">
              {/* Gallery Header & Density Controls */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="text-[10px] font-mono tracking-[0.25em] text-neutral-400 uppercase">
                    GALLERY ARCHIVE
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-serif tracking-tight text-black">
                    Additional {section.name} Works ({sectionProjects.length - 1})
                  </h3>
                </div>

                <div className="flex items-center space-x-2 font-mono text-xs">
                  <span className="text-neutral-400 text-[10px] uppercase tracking-widest mr-2">Layout:</span>
                  <button
                    onClick={() => setColumns('2-col')}
                    className={`p-2 border transition-colors ${
                      columns === '2-col' ? 'bg-black text-white border-black' : 'bg-white text-neutral-600 border-neutral-200 hover:border-black'
                    }`}
                    title="2 Columns"
                  >
                    <Grid size={15} />
                  </button>
                  <button
                    onClick={() => setColumns('3-col')}
                    className={`p-2 border transition-colors ${
                      columns === '3-col' ? 'bg-black text-white border-black' : 'bg-white text-neutral-600 border-neutral-200 hover:border-black'
                    }`}
                    title="3 Columns"
                  >
                    <LayoutGrid size={15} />
                  </button>
                </div>
              </div>

              {/* Gallery Grid */}
              <div
                className={`grid grid-cols-1 ${
                  columns === '2-col' ? 'md:grid-cols-2 gap-10 md:gap-14' : 'md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10'
                }`}
              >
                {sectionProjects.map((project, idx) => {
                  const isCurrentActive = currentEnlarged?.id === project.id;
                  const totalPlates = (project.images && project.images.length > 0)
                    ? project.images.length
                    : (project.mainImage ? 1 : 0);

                  return (
                    <article
                      key={project.id}
                      id={`gallery-project-${project.id}`}
                      onClick={() => onSelectProject(project)}
                      className={`group cursor-pointer space-y-3 transition-all duration-300 ${
                        isCurrentActive ? 'opacity-90 ring-1 ring-black p-2 bg-neutral-50' : ''
                      }`}
                    >
                      {/* Image Thumbnail */}
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

                        {/* Top Badge with plate count */}
                        <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5 bg-black/80 backdrop-blur-xs text-white text-[9px] font-mono uppercase tracking-widest px-2.5 py-1">
                          <Images size={11} className="text-neutral-300" />
                          <span>{totalPlates} {totalPlates === 1 ? 'PLATE' : 'PLATES'}</span>
                        </div>
                      </div>

                      {/* Details (Shown when showDetails is ON) */}
                      {showDetails && (
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between items-baseline gap-2">
                            <h4 className="text-sm sm:text-base font-serif text-black group-hover:underline tracking-tight">
                              {project.title}
                            </h4>
                            {project.year && (
                              <span className="text-[11px] font-mono text-neutral-400 flex-shrink-0">
                                {project.year}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2 text-xs text-neutral-500 font-light">
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
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
