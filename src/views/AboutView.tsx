import React, { useState } from 'react';
import { ArrowLeft, Mail, MapPin, Check } from 'lucide-react';
import { SiteSettings } from '../types';

interface AboutViewProps {
  settings: SiteSettings;
  onNavigateHome: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ settings, onNavigateHome }) => {
  const [formSent, setFormSent] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMsg, setFormMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail || !formMsg) return;
    setFormSent(true);
    setTimeout(() => {
      setFormSent(false);
      setFormName('');
      setFormEmail('');
      setFormMsg('');
    }, 4000);
  };

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

      {/* Main About Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        {/* Left Column: Logo mark, Role, Contact */}
        <div className="lg:col-span-5 space-y-10 lg:border-r lg:border-neutral-100 lg:pr-12">
          {/* Logo Mark Placement */}
          <div className="p-8 bg-neutral-50 border border-neutral-100 space-y-4">
            <div className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
              STUDIO EMBLEM
            </div>
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Kevin Galbraith Signature"
                referrerPolicy="no-referrer"
                className="max-h-20 w-auto object-contain"
              />
            ) : (
              <div className="text-2xl font-serif text-black">Kevin Galbraith</div>
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-black">
              {settings.aboutTitle || 'KEVIN GALBRAITH'}
            </h1>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-500">
              {settings.aboutRole || 'Artist / Creative Director / Designer'}
            </p>
          </div>

          {/* Philosophy Statement Quote */}
          <div className="border-l-2 border-black pl-5 py-2">
            <p className="text-base sm:text-lg font-serif italic text-black leading-relaxed">
              {settings.aboutPhilosophy ||
                '“The concept is the architecture; the medium is merely the material chosen to build it.”'}
            </p>
          </div>

          {/* Contact Details */}
          <div className="pt-6 border-t border-neutral-100 space-y-4 font-mono text-xs text-neutral-600">
            <div className="text-[10px] tracking-[0.25em] text-neutral-400 uppercase">
              REPRESENTATION & INQUIRIES
            </div>
            <div className="flex items-center space-x-3">
              <Mail size={14} className="text-black" />
              <a
                href={`mailto:${settings.contactEmail}`}
                className="text-black hover:underline font-medium"
              >
                {settings.contactEmail || 'studio@kevingalbraith.art'}
              </a>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin size={14} className="text-black" />
              <span>{settings.contactLocation || 'Los Angeles / New York / Paris'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: In-depth Biography, Disciplines, Inquiries Form */}
        <div className="lg:col-span-7 space-y-12">
          {/* Biography */}
          <div className="space-y-6">
            <div className="text-[10px] font-mono tracking-[0.25em] text-neutral-400 uppercase">
              BIOGRAPHICAL PROFILE
            </div>
            <div className="space-y-4 text-base sm:text-lg text-neutral-800 font-light leading-relaxed whitespace-pre-line">
              {settings.aboutBio}
            </div>
          </div>

          {/* Multidisciplinary Scope */}
          <div className="pt-8 border-t border-neutral-100 space-y-6">
            <div className="text-[10px] font-mono tracking-[0.25em] text-neutral-400 uppercase">
              AREAS OF PRACTICE & DISCIPLINE
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(settings.aboutDisciplines || []).map((disc, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-neutral-50 border-l border-neutral-300 text-xs font-mono tracking-wide text-neutral-800 flex items-center space-x-3"
                >
                  <span className="text-neutral-400 text-[10px]">0{idx + 1}</span>
                  <span>{disc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Editorial Inquiries Form */}
          <div className="pt-8 border-t border-neutral-100 space-y-6">
            <div className="text-[10px] font-mono tracking-[0.25em] text-neutral-400 uppercase">
              DIRECT STUDIO INQUIRY
            </div>
            {formSent ? (
              <div className="p-6 bg-neutral-900 text-white flex items-center space-x-3 animate-in fade-in duration-300">
                <Check size={18} className="text-emerald-400" />
                <div className="text-xs font-mono tracking-wider uppercase">
                  Your transmission has been logged. The studio will review your inquiry.
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                      Name / Organization
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="Jane Doe / Atelier Studio"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-xs font-mono text-black focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      placeholder="inquiries@organization.com"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-xs font-mono text-black focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Commission / Project Scope
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formMsg}
                    onChange={e => setFormMsg(e.target.value)}
                    placeholder="Brief description of the exhibition, commission, campaign, or editorial proposal..."
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-xs font-mono text-black focus:outline-none focus:border-black resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-8 py-3.5 bg-black text-white text-xs font-mono uppercase tracking-[0.25em] hover:bg-neutral-800 transition-colors"
                >
                  TRANSMIT INQUIRY
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
