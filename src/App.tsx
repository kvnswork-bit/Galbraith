import React, { useState, useEffect } from 'react';
import { SiteData, PortfolioProject, PortfolioSection } from './types';
import { initialSiteData } from './data/initialData';
import { apiService } from './services/api';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { PortfolioSectionView } from './views/PortfolioSectionView';
import { AboutView } from './views/AboutView';
import { AdminView } from './views/AdminView';
import { ProjectDetailModal } from './components/ProjectDetailModal';

export default function App() {
  const [data, setData] = useState<SiteData>(initialSiteData);
  const [activeRoute, setActiveRoute] = useState<string>('home');
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync with backend API
  const refreshContent = async () => {
    try {
      const serverData = await apiService.getPublicContent();
      if (serverData && serverData.settings) {
        setData(serverData);
      }
    } catch (err) {
      console.warn('Using local fallback data while server connects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshContent();
  }, []);

  // Hash-based routing for direct link navigation (e.g. #about, #studio-admin, #photography)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if (!hash) {
        setActiveRoute('home');
        setSelectedProject(null);
        return;
      }

      if (hash === 'studio-admin' || hash === 'admin') {
        setActiveRoute('admin');
        setSelectedProject(null);
        return;
      }

      if (hash === 'about') {
        setActiveRoute('about');
        setSelectedProject(null);
        return;
      }

      if (hash.startsWith('project-')) {
        const projectId = hash.replace('project-', '');
        const found = data.projects.find(p => p.id === projectId);
        if (found) {
          setSelectedProject(found);
          return;
        }
      }

      // Check section slug
      const foundSection = data.sections.find(s => s.slug === hash);
      if (foundSection) {
        setActiveRoute(foundSection.slug);
        setSelectedProject(null);
        return;
      }

      setActiveRoute('home');
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [data.sections, data.projects]);

  // Navigate handler
  const handleNavigate = (route: string) => {
    setActiveRoute(route);
    setSelectedProject(null);
    if (route === 'home') {
      window.location.hash = '';
    } else if (route === 'admin') {
      window.location.hash = 'studio-admin';
    } else {
      window.location.hash = route;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProject = (project: PortfolioProject) => {
    setSelectedProject(project);
    window.location.hash = `project-${project.id}`;
  };

  const handleCloseProject = () => {
    setSelectedProject(null);
    if (activeRoute && activeRoute !== 'home') {
      window.location.hash = activeRoute;
    } else {
      window.location.hash = '';
    }
  };

  // Check if current route matches a section
  const currentSection = data.sections.find(s => s.slug === activeRoute);

  // If in admin mode, display full Admin CMS View
  if (activeRoute === 'admin') {
    return (
      <AdminView
        data={data}
        onDataUpdated={newData => {
          setData(newData);
        }}
        onExitAdmin={() => handleNavigate('home')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between selection:bg-black selection:text-white">
      {/* Editorial Minimalist Header */}
      <Header
        settings={data.settings}
        sections={data.sections}
        activeRoute={activeRoute}
        onNavigate={handleNavigate}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full">
        {activeRoute === 'home' && (
          <HomeView
            data={data}
            onNavigate={handleNavigate}
            onSelectProject={handleSelectProject}
          />
        )}

        {activeRoute === 'about' && (
          <AboutView
            settings={data.settings}
            onNavigateHome={() => handleNavigate('home')}
          />
        )}

        {currentSection && (
          <PortfolioSectionView
            section={currentSection}
            projects={data.projects}
            onSelectProject={handleSelectProject}
            onNavigateHome={() => handleNavigate('home')}
          />
        )}
      </main>

      {/* Full-screen / Modal Project Detail View */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          section={data.sections.find(s => s.id === selectedProject.sectionId)}
          onClose={handleCloseProject}
          onNavigateSection={slug => handleNavigate(slug)}
        />
      )}

      {/* Minimal Understated Footer */}
      <Footer
        settings={data.settings}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
