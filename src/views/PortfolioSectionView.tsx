import React from 'react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
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
  const sectionProjects = (projects || [])
    .filter(p => p.sectionId === section.id && p.isPublished !== false)
    .sort((a, b) => a.order - b.order);

  // RENDER BASED ON SECTION TYPE / SLUG
  const renderLayout = () => {
    switch (section.slug) {
      case 'advertisement':
        return renderAdvertisementLayout();
      case 'photography':
        return renderPhotographyLayout();
      case 'magazines':
        return renderMagazinesLayout();
      case 'logos':
        return renderLogosLayout();
      case 'idle-mind':
        return renderIdleMindLayout();
      default:
        return renderGenericEditorialLayout();
    }
  };

  // 1. ADVERTISEMENT: Combination of large lead campaign images, full-width spreads, and supporting detail images
  const renderAdvertisementLayout = () => (
    <div className="space-y-24 md:space-y-36">
      {sectionProjects.map((project, idx) => {
        const isAlternate = idx % 2 === 1;
        return (
          <article
            key={project.id}
            id={`adv-project-${project.id}`}
            onClick={() => onSelectProject(project)}
            className="group cursor-pointer border-b border-neutral-100 pb-16 md:pb-24 space-y-8"
          >
            {/* Meta header */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-baseline">
              <div className="lg:col-span-8">
                <div className="text-[10px] font-mono tracking-[0.25em] text-neutral-400 uppercase mb-2">
                  CASE 0{idx + 1} {project.category ? `· ${project.category}` : ''}
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-black group-hover:underline">
                  {project.title}
                </h2>
              </div>
              <div className="lg:col-span-4 lg:text-right font-mono text-xs text-neutral-500">
                <div>{project.client}</div>
                <div className="text-neutral-400">{project.year}</div>
              </div>
            </div>

            {/* Visual compositions */}
            {idx === 0 ? (
              // Full Hero Lead Campaign layout
              <div className="space-y-6">
                <ArtworkImage
                  src={project.mainImage}
                  alt={project.title}
                  aspectRatio="full"
                  className="w-full"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {project.images?.slice(0, 2).map((img, i) => (
                    <ArtworkImage
                      key={img.id || i}
                      src={img.url}
                      alt={`${project.title} detail ${i + 1}`}
                      aspectRatio={img.aspectRatio || 'landscape'}
                    />
                  ))}
                </div>
              </div>
            ) : (
              // Editorial 2-column asymmetric layout
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className={`lg:col-span-8 ${isAlternate ? 'lg:order-2' : 'lg:order-1'}`}>
                  <ArtworkImage
                    src={project.mainImage}
                    alt={project.title}
                    aspectRatio="landscape"
                  />
                </div>
                <div className={`lg:col-span-4 ${isAlternate ? 'lg:order-1' : 'lg:order-2'} space-y-6`}>
                  {project.images?.[0] && (
                    <ArtworkImage
                      src={project.images[0].url}
                      alt={`${project.title} detail`}
                      aspectRatio="portrait"
                    />
                  )}
                  <p className="text-sm text-neutral-600 font-light leading-relaxed">
                    {project.description}
                  </p>
                  <div className="inline-flex items-center space-x-2 text-xs font-mono tracking-widest uppercase text-black">
                    <span>VIEW CASE STUDY</span>
                    <ArrowUpRight size={13} />
                  </div>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );

  // 2. PHOTOGRAPHY: Art Gallery feel with generous whitespace, preserving vertical/horizontal/square proportions
  const renderPhotographyLayout = () => (
    <div className="space-y-20 md:space-y-32">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-12 items-start">
        {sectionProjects.map((project, idx) => {
          // Asymmetric editorial gallery rhythm
          let colSpan = 'lg:col-span-6';
          let aspect: 'portrait' | 'landscape' | 'square' | 'full' = 'portrait';

          if (idx === 0) {
            colSpan = 'lg:col-span-8';
            aspect = 'portrait';
          } else if (idx === 1) {
            colSpan = 'lg:col-span-4';
            aspect = 'portrait';
          } else if (idx === 2) {
            colSpan = 'lg:col-span-12';
            aspect = 'landscape';
          } else if (idx === 3) {
            colSpan = 'lg:col-span-5';
            aspect = 'square';
          } else if (idx === 4) {
            colSpan = 'lg:col-span-7';
            aspect = 'landscape';
          } else {
            colSpan = 'lg:col-span-6';
            aspect = 'portrait';
          }

          return (
            <div
              key={project.id}
              onClick={() => onSelectProject(project)}
              className={`${colSpan} group cursor-pointer space-y-4`}
            >
              <ArtworkImage
                src={project.mainImage}
                alt={project.title}
                aspectRatio={aspect}
                className="w-full shadow-2xs"
              />
              <div className="flex justify-between items-baseline pt-1">
                <div>
                  <h3 className="text-sm font-medium uppercase tracking-wider text-black group-hover:underline">
                    {project.title}
                  </h3>
                  <div className="text-xs text-neutral-500 font-light">
                    {project.category || project.client}
                  </div>
                </div>
                <div className="text-[10px] font-mono text-neutral-400">
                  {project.year}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // 3. MAGAZINES: Editorial Archive with covers and interior spreads
  const renderMagazinesLayout = () => (
    <div className="space-y-24 md:space-y-36">
      {sectionProjects.map((project, idx) => (
        <div
          key={project.id}
          onClick={() => onSelectProject(project)}
          className="group cursor-pointer border-b border-neutral-100 pb-16 md:pb-24 space-y-8"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-mono tracking-[0.25em] text-neutral-400 uppercase mb-1">
                PUBLICATION ARCHIVE 0{idx + 1}
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif text-black group-hover:underline">
                {project.title}
              </h2>
            </div>
            <div className="font-mono text-xs text-neutral-500 md:text-right">
              <div>{project.client}</div>
              <div className="text-neutral-400">{project.year} · {project.images?.length || 1} SPREADS</div>
            </div>
          </div>

          {/* Magazine Spreads Preview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-4">
              <ArtworkImage
                src={project.mainImage || project.images?.[0]?.url}
                alt={`${project.title} Cover`}
                aspectRatio="portrait"
                className="w-full shadow-xs"
              />
              <div className="text-[10px] font-mono text-neutral-400 tracking-wider pt-2 uppercase">
                Front Cover / Binding
              </div>
            </div>

            <div className="md:col-span-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {project.images?.slice(1, 3).map((img, i) => (
                  <div key={img.id || i} className="space-y-2">
                    <ArtworkImage
                      src={img.url}
                      alt={`${project.title} spread ${i + 1}`}
                      aspectRatio="landscape"
                    />
                    <div className="text-[10px] font-mono text-neutral-400 tracking-wider">
                      {img.caption || `Spread 0${i + 1}`}
                    </div>
                  </div>
                ))}
              </div>

              {project.description && (
                <p className="text-sm text-neutral-600 font-light leading-relaxed pt-2">
                  {project.description}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // 4. LOGOS: Minimalist Identity Gallery with generous negative space
  const renderLogosLayout = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
      {sectionProjects.map((project, idx) => (
        <div
          key={project.id}
          onClick={() => onSelectProject(project)}
          className="group cursor-pointer p-8 md:p-12 bg-neutral-50 hover:bg-neutral-100 transition-colors duration-300 flex flex-col justify-between min-h-[360px] space-y-8"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono tracking-widest text-neutral-400">
              0{idx + 1}
            </span>
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
              {project.year}
            </span>
          </div>

          {/* Centered Logo Mark */}
          <div className="py-6 flex items-center justify-center">
            {project.mainImage ? (
              <img
                src={project.mainImage}
                alt={project.title}
                referrerPolicy="no-referrer"
                className="max-h-24 max-w-[80%] object-contain filter group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-24 h-24 bg-black flex items-center justify-center">
                <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-500">
                  Mark
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-neutral-200 pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-black">
              {project.title}
            </h3>
            <div className="text-xs text-neutral-500 font-light">
              {project.client}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // 5. IDLE MIND: Experimental, Unpredictable Artistic Layout
  const renderIdleMindLayout = () => (
    <div className="space-y-20 md:space-y-32">
      <div className="max-w-2xl pb-8 border-b border-neutral-100">
        <p className="text-lg font-serif italic text-neutral-800">
          “The studio archive of speculative prototypes, sculptural materials, and non-linear ideas that do not submit to commercial classification.”
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12">
        {sectionProjects.map((project, idx) => (
          <div
            key={project.id}
            onClick={() => onSelectProject(project)}
            className="group cursor-pointer space-y-4"
          >
            <div className="relative">
              <ArtworkImage
                src={project.mainImage}
                alt={project.title}
                aspectRatio={idx % 3 === 0 ? 'portrait' : idx % 3 === 1 ? 'square' : 'landscape'}
                className="w-full"
              />
              <div className="absolute top-3 left-3 bg-black text-white text-[9px] font-mono px-2 py-1 tracking-widest uppercase">
                EXP. 0{idx + 1}
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-serif text-black group-hover:underline">
                {project.title}
              </h3>
              <div className="text-xs font-mono text-neutral-500">
                {project.category || 'Mixed Media / Studio Study'}
              </div>
              {project.description && (
                <p className="text-xs text-neutral-600 font-light line-clamp-2 pt-1">
                  {project.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Fallback for custom sections added via CMS
  const renderGenericEditorialLayout = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
      {sectionProjects.map(project => (
        <div
          key={project.id}
          onClick={() => onSelectProject(project)}
          className="group cursor-pointer space-y-4"
        >
          <ArtworkImage
            src={project.mainImage}
            alt={project.title}
            aspectRatio="landscape"
            className="w-full"
          />
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-black group-hover:underline">
              {project.title}
            </h3>
            {project.client && (
              <div className="text-xs text-neutral-500 font-light">
                {project.client} · {project.year}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full pt-28 md:pt-36 pb-20 max-w-7xl mx-auto px-6 md:px-12 animate-in fade-in duration-300">
      {/* Top back navigation */}
      <button
        onClick={onNavigateHome}
        className="group flex items-center space-x-2 text-xs font-mono uppercase tracking-[0.2em] text-neutral-500 hover:text-black transition-colors mb-10"
      >
        <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-1" />
        <span>BACK / OVERVIEW</span>
      </button>

      {/* Section Header */}
      <div className="pb-12 md:pb-16 mb-12 md:mb-16 border-b border-neutral-200">
        <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-neutral-400 mb-2">
          PORTFOLIO ARCHIVE
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

      {/* Main Content Layout */}
      {sectionProjects.length === 0 ? (
        <div className="py-24 text-center space-y-3 bg-neutral-50 p-8">
          <p className="text-sm font-mono uppercase tracking-widest text-neutral-400">
            No projects in this section yet
          </p>
          <p className="text-xs text-neutral-500">
            Upload artwork and create projects via the studio administration panel.
          </p>
        </div>
      ) : (
        renderLayout()
      )}
    </div>
  );
};
