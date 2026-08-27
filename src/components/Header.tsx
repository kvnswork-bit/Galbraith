import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { PortfolioSection, SiteSettings } from '../types';

interface HeaderProps {
  settings: SiteSettings;
  sections: PortfolioSection[];
  activeRoute: string; // 'home' | 'about' | 'admin' | section.slug | project id
  onNavigate: (route: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  sections,
  activeRoute,
  onNavigate
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (route: string) => {
    onNavigate(route);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navSections = (sections || [])
    .filter(s => s.isPublished !== false)
    .sort((a, b) => a.order - b.order);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md border-b border-neutral-100 py-3 md:py-4' : 'bg-white py-5 md:py-7'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* LOGO - Upper Left Corner (50% larger presentation) */}
        <button
          id="header-logo-button"
          onClick={() => handleLinkClick('home')}
          className="group relative flex items-center text-left focus:outline-none transition-opacity duration-300 hover:opacity-75"
          aria-label="Kevin Galbraith Homepage"
        >
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt="Kevin Galbraith"
              referrerPolicy="no-referrer"
              className={`w-auto object-contain transition-all duration-300 ${
                scrolled ? 'h-11 sm:h-14 md:h-16' : 'h-[54px] sm:h-[66px] md:h-[72px]'
              }`}
            />
          ) : (
            <span className="font-serif text-3xl sm:text-4xl tracking-wider text-black">Kevin Galbraith</span>
          )}
        </button>

        {/* DESKTOP NAVIGATION - Upper Right Corner */}
        <nav className="hidden lg:flex items-center space-x-7 xl:space-x-9 text-[11px] font-medium tracking-[0.2em] uppercase text-neutral-800">
          {navSections.map(section => {
            const isActive = activeRoute === section.slug;
            return (
              <button
                key={section.id}
                id={`nav-${section.slug}`}
                onClick={() => handleLinkClick(section.slug)}
                className={`relative py-1 transition-colors duration-200 hover:text-black focus:outline-none ${
                  isActive ? 'text-black font-semibold' : 'text-neutral-500'
                }`}
              >
                {section.name}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-black" />
                )}
              </button>
            );
          })}

          <button
            id="nav-about"
            onClick={() => handleLinkClick('about')}
            className={`relative py-1 transition-colors duration-200 hover:text-black focus:outline-none ${
              activeRoute === 'about' ? 'text-black font-semibold' : 'text-neutral-500'
            }`}
          >
            ABOUT
            {activeRoute === 'about' && (
              <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-black" />
            )}
          </button>
        </nav>

        {/* MOBILE MENU TOGGLE BUTTON */}
        <div className="flex items-center lg:hidden">
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -mr-2 text-black hover:text-neutral-600 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* MOBILE FULLSCREEN NAVIGATION */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu-drawer"
          className="lg:hidden fixed inset-0 top-[74px] sm:top-[88px] bg-white z-40 flex flex-col px-8 py-12 justify-between border-t border-neutral-100 overflow-y-auto animate-in fade-in duration-200"
        >
          <div className="flex flex-col space-y-6 pt-4">
            <button
              onClick={() => handleLinkClick('home')}
              className={`text-left text-xs tracking-[0.25em] uppercase font-mono py-2 ${
                activeRoute === 'home' ? 'text-black font-bold' : 'text-neutral-400'
              }`}
            >
              00 / OVERVIEW
            </button>

            {navSections.map((section, idx) => {
              const isActive = activeRoute === section.slug;
              return (
                <button
                  key={section.id}
                  onClick={() => handleLinkClick(section.slug)}
                  className={`text-left text-2xl font-serif tracking-wide py-2 transition-all flex items-baseline justify-between ${
                    isActive ? 'text-black font-semibold pl-2 border-l-2 border-black' : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  <span>{section.name}</span>
                  <span className="text-[10px] font-mono tracking-widest text-neutral-400">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </button>
              );
            })}

            <button
              onClick={() => handleLinkClick('about')}
              className={`text-left text-2xl font-serif tracking-wide py-2 transition-all flex items-baseline justify-between ${
                activeRoute === 'about' ? 'text-black font-semibold pl-2 border-l-2 border-black' : 'text-neutral-600 hover:text-black'
              }`}
            >
              <span>ABOUT</span>
              <span className="text-[10px] font-mono tracking-widest text-neutral-400">
                {String(navSections.length + 1).padStart(2, '0')}
              </span>
            </button>
          </div>

          <div className="pt-8 border-t border-neutral-100 flex flex-col space-y-2 text-xs text-neutral-500">
            <div className="font-serif italic text-sm text-black">Kevin Galbraith Studio</div>
            <div>{settings.contactEmail}</div>
            <div>{settings.contactLocation}</div>
          </div>
        </div>
      )}
    </header>
  );
};
