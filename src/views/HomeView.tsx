import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SiteData, PortfolioProject, PortfolioSection } from '../types';
import { ArtworkImage } from '../components/ArtworkImage';

interface HomeViewProps {
  data: SiteData;
  onNavigate: (route: string) => void;
  onSelectProject: (project: PortfolioProject) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  data,
  onNavigate,
  onSelectProject
}) => {
  const { settings, sections, projects } = data;

  const activeSections = (sections || [])
    .filter(s => s.isPublished !== false)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="w-full pt-28 sm:pt-32 md:pt-36 pb-16">
      {/* -------------------------------------------------------------
          HERO SECTION — High-End Editorial Presentation
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-4 pb-16 md:pb-24">
        {/* Artistic Slogan & Role Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-end mb-10 md:mb-16">
          <div className="lg:col-span-8">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif tracking-tight text-black leading-[1.04] max-w-4xl">
              {settings.heroSlogan || 'The concept commands the medium.'}
            </h1>
          </div>
          <div className="lg:col-span-4 lg:text-right flex flex-col justify-end">
            <div className="text-[11px] font-mono tracking-[0.25em] uppercase text-neutral-400">
              MULTIDISCIPLINARY ART & DIRECTION
            </div>
            <div className="text-sm font-light text-neutral-700 tracking-wide mt-1">
              {settings.heroSubhead || 'Artist · Creative Director · Designer'}
            </div>
          </div>
        </div>

        {/* HERO IMAGE — Prominently Displayed at Large Scale */}
        <div
          id="homepage-hero-container"
          className="w-full overflow-hidden bg-neutral-100 shadow-xs border border-neutral-100 relative group cursor-pointer"
          onClick={() => {
            // If there is an architectural/hero project, open it or navigate to photography
            const heroProject = projects.find(p => p.mainImage === settings.heroImageUrl || p.id === 'photo-01');
            if (heroProject) onSelectProject(heroProject);
            else onNavigate('photography');
          }}
        >
          {settings.heroImageUrl ? (
            <div className="relative w-full max-h-[82vh] overflow-hidden flex items-center justify-center bg-black">
              <img
                src={settings.heroImageUrl}
                alt="Kevin Galbraith Studio Hero Asset"
                referrerPolicy="no-referrer"
                className="w-full h-auto max-h-[82vh] object-contain md:object-cover transition-transform duration-1000 group-hover:scale-[1.01]"
              />
              <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 bg-white/90 backdrop-blur-xs px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase text-black">
                ARCHIVE STUDY · PERSPECTIVE
              </div>
            </div>
          ) : (
            <div className="w-full h-[65vh] bg-black flex items-end p-8">
              <span className="text-xs font-mono tracking-[0.25em] text-neutral-500 uppercase">
                Hero Image Placeholder
              </span>
            </div>
          )}
        </div>
      </section>

      {/* -------------------------------------------------------------
          EDITORIAL INTRODUCTION SECTION
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 border-t border-neutral-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-4">
            <div className="text-[11px] font-mono tracking-[0.3em] uppercase text-neutral-400 sticky top-28">
              01 / STATEMENT
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <p className="text-xl sm:text-2xl md:text-3xl font-serif text-black leading-relaxed">
              {settings.editorialIntro ||
                'Kevin Galbraith operates at the confluence of contemporary art, strategic advertising, and spatial visual identity.'}
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-3 pt-4 font-mono text-xs text-neutral-600 border-t border-neutral-100">
              <span>ADVERTISING</span>
              <span>·</span>
              <span>PHOTOGRAPHY</span>
              <span>·</span>
              <span>MAGAZINES</span>
              <span>·</span>
              <span>IDENTITY</span>
              <span>·</span>
              <span>EXPERIMENTS</span>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          CURATED PORTFOLIO SECTIONS PREVIEW (EXACTLY 1 IMAGE PER SECTION)
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 space-y-24 md:space-y-32">
        {activeSections.map((section, sIdx) => {
          const sectionProjects = (projects || [])
            .filter(p => p.sectionId === section.id && p.isPublished !== false)
            .sort((a, b) => a.order - b.order);

          const leadProject = sectionProjects[0];

          return (
            <div key={section.id} id={`section-${section.slug}`} className="space-y-6">
              {/* Section Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-neutral-200">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-neutral-400">
                    DISCIPLINE 0{sIdx + 1}
                  </div>
                  <h2
                    onClick={() => onNavigate(section.slug)}
                    className="text-3xl sm:text-4xl md:text-5xl font-serif tracking-tight text-black cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {section.name}
                  </h2>
                </div>

                <div className="flex items-center space-x-6">
                  {section.description && (
                    <p className="hidden md:block text-xs text-neutral-500 max-w-sm text-right font-light">
                      {section.description}
                    </p>
                  )}
                  <button
                    onClick={() => onNavigate(section.slug)}
                    className="group inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-[0.2em] text-black hover:opacity-60 transition-opacity"
                  >
                    <span>VIEW ARCHIVE</span>
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>

              {/* Exactly ONE Cover Image per section */}
              {leadProject ? (
                <div
                  onClick={() => onNavigate(section.slug)}
                  className="group cursor-pointer space-y-3"
                >
                  <div className="relative overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-2xs">
                    <ArtworkImage
                      src={leadProject.mainImage || leadProject.images?.[0]?.url}
                      alt={leadProject.title}
                      aspectRatio={
                        section.slug === 'photography'
                          ? 'landscape'
                          : section.slug === 'logos'
                          ? 'square'
                          : 'landscape'
                      }
                      className="w-full transition-transform duration-700 group-hover:scale-[1.01]"
                    />
                    
                    {/* Floating Section Explore Badge */}
                    <div className="absolute bottom-4 right-4 bg-black/85 backdrop-blur-xs text-white px-3.5 py-1.5 text-[10px] font-mono tracking-widest uppercase flex items-center space-x-2">
                      <span>ENTER {section.name} GALLERY</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>

                  {/* Meta Information for the single lead piece */}
                  <div className="flex justify-between items-baseline pt-1">
                    <div>
                      <h3 className="text-base sm:text-lg font-serif tracking-tight text-black group-hover:underline uppercase">
                        {leadProject.title}
                      </h3>
                      {leadProject.client && (
                        <div className="text-xs text-neutral-500 font-light">
                          {leadProject.client}
                        </div>
                      )}
                    </div>
                    {leadProject.year && (
                      <div className="text-[11px] font-mono text-neutral-400">
                        {leadProject.year}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => onNavigate(section.slug)}
                  className="py-16 text-center bg-neutral-50 border border-dashed border-neutral-200 cursor-pointer"
                >
                  <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                    No works uploaded in {section.name} yet
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* -------------------------------------------------------------
          HOMEPAGE ABOUT TEASER & INVITATION
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 border-t border-neutral-100">
        <div className="bg-neutral-50 p-8 sm:p-12 md:p-16 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-neutral-400">
              PHILOSOPHY & BIOGRAPHY
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-black">
              “The concept is the architecture; the medium is merely the material chosen to build it.”
            </h2>
            <p className="text-sm text-neutral-600 font-light pt-2">
              Learn more about Kevin Galbraith's multidisciplinary background across commercial direction and independent artistic inquiry.
            </p>
          </div>

          <button
            onClick={() => onNavigate('about')}
            className="px-8 py-4 bg-black text-white text-xs font-mono uppercase tracking-[0.25em] hover:bg-neutral-800 transition-colors whitespace-nowrap"
          >
            READ BIOGRAPHY
          </button>
        </div>
      </section>
    </div>
  );
};
