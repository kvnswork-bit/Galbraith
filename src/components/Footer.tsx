import React from 'react';
import { Lock } from 'lucide-react';
import { SiteSettings } from '../types';

interface FooterProps {
  settings: SiteSettings;
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onNavigate }) => {
  return (
    <footer className="w-full bg-white border-t border-neutral-100 py-12 md:py-16 mt-20 md:mt-32">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-2">
          <div className="text-xs font-semibold tracking-[0.25em] uppercase text-black">
            KEVIN GALBRAITH
          </div>
          <div className="text-[13px] text-neutral-500 font-light tracking-wide">
            Artist / Creative Director / Designer
          </div>
          <div className="text-[11px] text-neutral-400 font-mono pt-2">
            {settings.contactLocation}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:items-center gap-6 sm:gap-10 text-[11px] text-neutral-400 font-mono">
          <div>{settings.copyrightText}</div>

          {/* Discreet Studio Admin Entry */}
          <button
            id="footer-admin-link"
            onClick={() => onNavigate('admin')}
            className="flex items-center space-x-1.5 text-neutral-400 hover:text-black transition-colors focus:outline-none"
            title="Studio Administration"
          >
            <Lock size={11} strokeWidth={1.5} />
            <span className="tracking-widest uppercase text-[10px]">Studio Access</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
