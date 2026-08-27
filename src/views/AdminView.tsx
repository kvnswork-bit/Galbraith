import React, { useState, useEffect } from 'react';
import {
  Lock,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Check,
  Save,
  RotateCcw,
  ArrowLeft,
  Image as ImageIcon,
  Images,
  Layers,
  FileText,
  Shield,
  Upload,
  AlertCircle
} from 'lucide-react';
import { SiteData, PortfolioSection, PortfolioProject, ProjectImage, SiteSettings } from '../types';
import { apiService } from '../services/api';
import { ImageUploader } from '../components/ImageUploader';

interface AdminViewProps {
  data: SiteData;
  onDataUpdated: (newData: SiteData) => void;
  onExitAdmin: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  data,
  onDataUpdated,
  onExitAdmin
}) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Admin tabs: 'projects' | 'sections' | 'hero-branding' | 'editorial' | 'security'
  const [activeTab, setActiveTab] = useState<'projects' | 'sections' | 'hero-branding' | 'editorial' | 'security'>('projects');

  // Working data state
  const [adminData, setAdminData] = useState<SiteData>(data);
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Editing Project Modal State
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [isNewProject, setIsNewProject] = useState(false);

  // Password change state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMessage, setPwMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Check existing token on mount
  useEffect(() => {
    const checkToken = async () => {
      const valid = await apiService.verifyAdminToken();
      if (valid) {
        try {
          const freshData = await apiService.getAdminContent();
          setAdminData(freshData);
          onDataUpdated(freshData);
          setIsAuthenticated(true);
        } catch (e) {
          setIsAuthenticated(false);
        }
      }
    };
    checkToken();
  }, []);

  // Update working state when parent prop changes
  useEffect(() => {
    setAdminData(data);
  }, [data]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) return;
    setAuthError(null);
    setIsAuthenticating(true);

    const res = await apiService.adminLogin(passwordInput);
    setIsAuthenticating(false);

    if (res.success) {
      try {
        const freshData = await apiService.getAdminContent();
        setAdminData(freshData);
        onDataUpdated(freshData);
        setIsAuthenticated(true);
        setPasswordInput('');
      } catch (err: any) {
        setAuthError('Authentication succeeded, but failed to load admin data.');
      }
    } else {
      setAuthError(res.error || 'Invalid administrator password.');
    }
  };

  const handleLogout = () => {
    apiService.adminLogout();
    setIsAuthenticated(false);
  };

  // Helper to persist changes
  const persistChanges = async (newData: SiteData, message = 'Changes saved successfully') => {
    setAdminData(newData);
    setSaveStatus('saving');
    try {
      await apiService.saveAdminContent(newData);
      onDataUpdated(newData);
      setSaveStatus('saved');
      setStatusMessage(message);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveStatus('error');
      setStatusMessage(err.message || 'Failed to save changes');
    }
  };

  // -------------------------------------------------------------
  // SECTIONS MANAGEMENT
  // -------------------------------------------------------------
  const handleAddSection = () => {
    const name = prompt('Enter new portfolio section name (e.g. SCULPTURE, ARCHITECTURE):');
    if (!name || !name.trim()) return;

    const trimmed = name.trim().toUpperCase();
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const existing = adminData.sections.find(s => s.slug === slug);
    if (existing) {
      alert('A section with this identifier already exists.');
      return;
    }

    const newSection: PortfolioSection = {
      id: `sec-${Date.now()}`,
      slug,
      name: trimmed,
      description: `Studio archive and portfolio for ${trimmed}.`,
      order: adminData.sections.length + 1,
      isPublished: true,
      isCustom: true
    };

    const updatedSections = [...adminData.sections, newSection];
    persistChanges({ ...adminData, sections: updatedSections }, `Created section "${trimmed}"`);
  };

  const handleRenameSection = (sec: PortfolioSection) => {
    const newName = prompt('Enter new name for section:', sec.name);
    if (!newName || !newName.trim() || newName.trim() === sec.name) return;

    const desc = prompt('Enter brief description for this section:', sec.description || '');

    const updatedSections = adminData.sections.map(s =>
      s.id === sec.id
        ? { ...s, name: newName.trim().toUpperCase(), description: desc || s.description }
        : s
    );
    persistChanges({ ...adminData, sections: updatedSections }, `Renamed section to "${newName.trim()}"`);
  };

  const handleDeleteSection = (sec: PortfolioSection) => {
    if (!confirm(`Are you sure you want to delete the section "${sec.name}" and all its projects?`)) return;

    const updatedSections = adminData.sections
      .filter(s => s.id !== sec.id)
      .map((s, i) => ({ ...s, order: i + 1 }));

    const updatedProjects = adminData.projects.filter(p => p.sectionId !== sec.id);

    persistChanges({
      ...adminData,
      sections: updatedSections,
      projects: updatedProjects
    }, `Deleted section "${sec.name}"`);
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= adminData.sections.length) return;

    const reordered = [...adminData.sections];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;
    reordered.forEach((s, i) => { s.order = i + 1; });

    persistChanges({ ...adminData, sections: reordered }, 'Reordered sections');
  };

  const handleToggleSectionPublish = (sec: PortfolioSection) => {
    const updatedSections = adminData.sections.map(s =>
      s.id === sec.id ? { ...s, isPublished: !s.isPublished } : s
    );
    persistChanges({ ...adminData, sections: updatedSections }, `${sec.name} publication toggled`);
  };

  // -------------------------------------------------------------
  // PROJECTS MANAGEMENT
  // -------------------------------------------------------------
  const handleOpenCreateProject = () => {
    const defaultSection = selectedSectionFilter !== 'all'
      ? selectedSectionFilter
      : adminData.sections[0]?.id || '';

    setEditingProject({
      id: `proj-${Date.now()}`,
      sectionId: defaultSection,
      title: '',
      client: '',
      year: new Date().getFullYear().toString(),
      category: '',
      description: '',
      mainImage: '',
      images: [],
      order: adminData.projects.length + 1,
      isPublished: true,
      displayMode: 'gallery',
      layoutStyle: 'editorial-split'
    });
    setIsNewProject(true);
  };

  const handleSaveProject = () => {
    if (!editingProject) return;
    if (!editingProject.title.trim()) {
      alert('Please enter a project title');
      return;
    }

    // Ensure mainImage is set to the first image if mainImage is empty
    const finalProj: PortfolioProject = {
      ...editingProject,
      mainImage: editingProject.mainImage || (editingProject.images?.[0]?.url || '')
    };

    let updatedProjects: PortfolioProject[];
    if (isNewProject) {
      updatedProjects = [...adminData.projects, finalProj];
    } else {
      updatedProjects = adminData.projects.map(p => p.id === finalProj.id ? finalProj : p);
    }

    persistChanges({ ...adminData, projects: updatedProjects }, `Saved project "${finalProj.title}"`);
    setEditingProject(null);
  };

  const handleDeleteProject = (proj: PortfolioProject) => {
    if (!confirm(`Are you sure you want to delete project "${proj.title}"?`)) return;
    const updated = adminData.projects.filter(p => p.id !== proj.id);
    persistChanges({ ...adminData, projects: updated }, `Deleted project "${proj.title}"`);
  };

  const handleToggleProjectPublish = (proj: PortfolioProject) => {
    const updated = adminData.projects.map(p =>
      p.id === proj.id ? { ...p, isPublished: !p.isPublished } : p
    );
    persistChanges({ ...adminData, projects: updated }, `Toggled publication for "${proj.title}"`);
  };

  const handleMoveProject = (index: number, direction: 'up' | 'down') => {
    const filtered = filteredProjects;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= filtered.length) return;

    const projA = filtered[index];
    const projB = filtered[targetIdx];

    // Swap orders
    const updated = adminData.projects.map(p => {
      if (p.id === projA.id) return { ...p, order: projB.order };
      if (p.id === projB.id) return { ...p, order: projA.order };
      return p;
    });

    persistChanges({ ...adminData, projects: updated }, 'Reordered projects');
  };

  // -------------------------------------------------------------
  // BRANDING & HERO MANAGEMENT
  // -------------------------------------------------------------
  const handleUpdateSettings = (partial: Partial<SiteSettings>) => {
    const newSettings = { ...adminData.settings, ...partial };
    persistChanges({ ...adminData, settings: newSettings }, 'Branding and settings updated');
  };

  // -------------------------------------------------------------
  // PASSWORD CHANGE
  // -------------------------------------------------------------
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage(null);
    if (!currentPw || !newPw) {
      setPwMessage({ text: 'All fields are required', type: 'error' });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMessage({ text: 'New passwords do not match', type: 'error' });
      return;
    }
    if (newPw.length < 6) {
      setPwMessage({ text: 'New password must be at least 6 characters', type: 'error' });
      return;
    }

    try {
      await apiService.changePassword(currentPw, newPw);
      setPwMessage({ text: 'Password successfully changed and updated!', type: 'success' });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err: any) {
      setPwMessage({ text: err.message || 'Failed to update password', type: 'error' });
    }
  };

  // -------------------------------------------------------------
  // RESET FACTORY DEFAULTS
  // -------------------------------------------------------------
  const handleResetDefaults = async () => {
    if (!confirm('Warning: This will restore the initial gallery state, sections, and supplied image placeholders. Proceed?')) return;
    try {
      const resetData = await apiService.resetDefaults();
      setAdminData(resetData);
      onDataUpdated(resetData);
      alert('Site data reset to initial configuration.');
    } catch (err: any) {
      alert('Reset failed: ' + err.message);
    }
  };

  // Filtered projects list
  const filteredProjects = (adminData.projects || [])
    .filter(p => selectedSectionFilter === 'all' || p.sectionId === selectedSectionFilter)
    .sort((a, b) => a.order - b.order);

  // -------------------------------------------------------------
  // AUTHENTICATION LOGIN SCREEN
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between py-12 px-6">
        <div className="max-w-md mx-auto w-full pt-16 md:pt-24 space-y-8">
          <div className="space-y-3 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-neutral-100 rounded-none mb-2">
              <Lock size={20} className="text-black" />
            </div>
            <h1 className="text-3xl font-serif tracking-tight text-black">
              Studio Administration
            </h1>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400">
              KEVIN GALBRAITH ARCHIVE CMS
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 bg-neutral-50 p-8 border border-neutral-200">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500">
                  Administrator Keycode / Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 hover:text-black flex items-center space-x-1"
                >
                  {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                  <span>{showPassword ? 'HIDE' : 'SHOW'}</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="Hgert1903@!"
                  className="w-full px-4 py-3 bg-white border border-neutral-300 text-sm font-mono text-black focus:outline-none focus:border-black pr-10"
                  autoFocus
                />
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-neutral-500">
                <span>Default: <code className="text-black bg-neutral-200 px-1 py-0.5 font-bold select-all">Hgert1903@!</code></span>
                <button
                  type="button"
                  onClick={() => setPasswordInput('Hgert1903@!')}
                  className="text-black underline uppercase text-[10px] tracking-wider hover:text-neutral-600 font-medium"
                >
                  Fill Default
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-neutral-900 text-white text-xs font-mono flex items-center space-x-2">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3.5 bg-black text-white text-xs font-mono uppercase tracking-[0.25em] hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {isAuthenticating ? 'AUTHENTICATING...' : 'ENTER STUDIO CMS'}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={onExitAdmin}
              className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400 hover:text-black transition-colors"
            >
              ← RETURN TO PUBLIC GALLERY
            </button>
          </div>
        </div>

        <div className="text-center text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
          Kevin Galbraith Secure Access Environment
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // AUTHENTICATED ADMIN DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-neutral-50 text-black">
      {/* Top Admin Sticky Navigation Bar */}
      <header className="sticky top-0 z-40 bg-black text-white px-6 md:px-12 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="font-serif text-lg tracking-wider">
            KEVIN GALBRAITH <span className="font-mono text-[10px] text-neutral-400 tracking-widest ml-2">CMS</span>
          </div>

          <span className="hidden md:inline-flex items-center space-x-1.5 px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>CLOUD SYNC ACTIVE</span>
          </span>

          {saveStatus === 'saved' && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-950 text-emerald-300 text-[10px] font-mono tracking-widest uppercase">
              <Check size={11} />
              <span>SAVED TO CLOUD</span>
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="text-[10px] font-mono text-amber-300 tracking-widest uppercase animate-pulse">
              SYNCING TO CLOUD...
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <button
            onClick={onExitAdmin}
            className="px-3 py-1.5 border border-neutral-700 hover:border-white text-neutral-300 hover:text-white transition-colors uppercase tracking-wider flex items-center space-x-1.5"
          >
            <ArrowLeft size={12} />
            <span>VIEW PUBLIC SITE</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 transition-colors uppercase tracking-wider flex items-center space-x-1.5"
          >
            <LogOut size={12} />
            <span>LOGOUT</span>
          </button>
        </div>
      </header>

      {/* Admin Subheader / Tabs */}
      <div className="bg-white border-b border-neutral-200 px-6 md:px-12 py-3 flex items-center space-x-2 md:space-x-8 overflow-x-auto text-xs font-mono uppercase tracking-[0.2em]">
        <button
          onClick={() => setActiveTab('projects')}
          className={`py-2 px-1 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'projects' ? 'border-black text-black font-bold' : 'border-transparent text-neutral-400 hover:text-black'
          }`}
        >
          PROJECTS ({adminData.projects.length})
        </button>

        <button
          onClick={() => setActiveTab('sections')}
          className={`py-2 px-1 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'sections' ? 'border-black text-black font-bold' : 'border-transparent text-neutral-400 hover:text-black'
          }`}
        >
          SECTIONS ({adminData.sections.length})
        </button>

        <button
          onClick={() => setActiveTab('hero-branding')}
          className={`py-2 px-1 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'hero-branding' ? 'border-black text-black font-bold' : 'border-transparent text-neutral-400 hover:text-black'
          }`}
        >
          HERO & LOGO
        </button>

        <button
          onClick={() => setActiveTab('editorial')}
          className={`py-2 px-1 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'editorial' ? 'border-black text-black font-bold' : 'border-transparent text-neutral-400 hover:text-black'
          }`}
        >
          EDITORIAL & TEXT
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`py-2 px-1 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'security' ? 'border-black text-black font-bold' : 'border-transparent text-neutral-400 hover:text-black'
          }`}
        >
          SECURITY
        </button>
      </div>

      {/* Status banner */}
      {statusMessage && saveStatus === 'saved' && (
        <div className="bg-neutral-900 text-white text-xs font-mono px-6 md:px-12 py-2 flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage('')} className="text-neutral-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Admin Content Container */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-10">
        {/* =========================================================
            TAB 1: PROJECTS MANAGEMENT
            ========================================================= */}
        {activeTab === 'projects' && (
          <div className="space-y-8">
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
              <div>
                <h2 className="text-2xl font-serif text-black">Artwork & Project Archive</h2>
                <p className="text-xs font-mono text-neutral-500 mt-1">
                  Manage individual portfolio entries, upload high-res imagery, edit metadata and reorder.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Section filter */}
                <select
                  value={selectedSectionFilter}
                  onChange={e => setSelectedSectionFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-neutral-300 text-xs font-mono text-black focus:outline-none focus:border-black"
                >
                  <option value="all">ALL SECTIONS ({adminData.projects.length})</option>
                  {adminData.sections.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({adminData.projects.filter(p => p.sectionId === s.id).length})
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleOpenCreateProject}
                  className="px-4 py-2 bg-black text-white text-xs font-mono uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors flex items-center space-x-1.5"
                >
                  <Plus size={14} />
                  <span>ADD PROJECT</span>
                </button>
              </div>
            </div>

            {/* Projects Table / Cards */}
            {filteredProjects.length === 0 ? (
              <div className="py-20 text-center bg-white border border-neutral-200 p-8 space-y-4">
                <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                  No projects found in this section
                </p>
                <button
                  onClick={handleOpenCreateProject}
                  className="px-6 py-2.5 bg-black text-white text-xs font-mono uppercase tracking-widest"
                >
                  Create First Project
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProjects.map((proj, idx) => {
                  const sec = adminData.sections.find(s => s.id === proj.sectionId);
                  return (
                    <div
                      key={proj.id}
                      className={`p-4 bg-white border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        proj.isPublished !== false ? 'border-neutral-200' : 'border-neutral-300 bg-neutral-50/70 opacity-75'
                      }`}
                    >
                      {/* Left: Thumbnail & Info */}
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-12 bg-black flex-shrink-0 flex items-center justify-center overflow-hidden border border-neutral-200">
                          {proj.mainImage ? (
                            <img
                              src={proj.mainImage}
                              alt={proj.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-[8px] font-mono text-neutral-500 uppercase">Placeholder</span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-black">
                              {proj.title || 'Untitled Project'}
                            </h3>
                            {proj.isPublished === false && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-neutral-200 text-neutral-600 uppercase">
                                Unpublished
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-neutral-500 font-mono flex items-center space-x-2 pt-0.5">
                            <span>{sec?.name || 'Unassigned'}</span>
                            {proj.client && <span>· {proj.client}</span>}
                            {proj.year && <span>· {proj.year}</span>}
                            <span className="px-1.5 py-0.2 text-[10px] bg-neutral-100 border border-neutral-200 text-black uppercase">
                              {proj.displayMode === 'individual' ? 'Artwork' : `Gallery (${proj.images?.length || (proj.mainImage ? 1 : 0)})`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center space-x-2 self-end md:self-auto">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveProject(idx, 'up')}
                          className="p-2 border border-neutral-200 text-neutral-600 hover:text-black disabled:opacity-20"
                          title="Move project up"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === filteredProjects.length - 1}
                          onClick={() => handleMoveProject(idx, 'down')}
                          className="p-2 border border-neutral-200 text-neutral-600 hover:text-black disabled:opacity-20"
                          title="Move project down"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleProjectPublish(proj)}
                          className={`p-2 border transition-colors ${
                            proj.isPublished !== false
                              ? 'border-neutral-200 text-neutral-600 hover:text-black'
                              : 'border-amber-400 bg-amber-50 text-amber-700'
                          }`}
                          title={proj.isPublished !== false ? 'Unpublish' : 'Publish'}
                        >
                          {proj.isPublished !== false ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProject({ ...proj });
                            setIsNewProject(false);
                          }}
                          className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-mono uppercase tracking-wider flex items-center space-x-1"
                        >
                          <Edit2 size={12} />
                          <span>EDIT</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(proj)}
                          className="p-2 text-neutral-400 hover:text-red-600 transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 2: SECTIONS MANAGEMENT
            ========================================================= */}
        {activeTab === 'sections' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
              <div>
                <h2 className="text-2xl font-serif text-black">Portfolio Disciplines & Sections</h2>
                <p className="text-xs font-mono text-neutral-500 mt-1">
                  Create, rename, reorder, or toggle sections. All published sections appear automatically in main navigation.
                </p>
              </div>

              <button
                onClick={handleAddSection}
                className="px-4 py-2 bg-black text-white text-xs font-mono uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors flex items-center space-x-1.5"
              >
                <Plus size={14} />
                <span>CREATE SECTION</span>
              </button>
            </div>

            <div className="space-y-3">
              {adminData.sections.map((sec, idx) => {
                const count = adminData.projects.filter(p => p.sectionId === sec.id).length;
                return (
                  <div
                    key={sec.id}
                    className="p-5 bg-white border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-mono text-neutral-400">0{idx + 1}</span>
                        <h3 className="text-lg font-serif text-black tracking-wide">
                          {sec.name}
                        </h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-neutral-100 text-neutral-600 uppercase">
                          slug: /{sec.slug}
                        </span>
                        {sec.isPublished === false && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 bg-neutral-200 text-neutral-600 uppercase">
                            Hidden from Nav
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 font-light max-w-xl pl-6">
                        {sec.description || 'No description provided'}
                      </p>
                      <div className="text-[11px] font-mono text-neutral-400 pl-6 pt-1">
                        Contains {count} {count === 1 ? 'project' : 'projects'}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end md:self-auto">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveSection(idx, 'up')}
                        className="p-2 border border-neutral-200 text-neutral-600 hover:text-black disabled:opacity-20"
                        title="Move up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === adminData.sections.length - 1}
                        onClick={() => handleMoveSection(idx, 'down')}
                        className="p-2 border border-neutral-200 text-neutral-600 hover:text-black disabled:opacity-20"
                        title="Move down"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleSectionPublish(sec)}
                        className={`p-2 border ${sec.isPublished !== false ? 'border-neutral-200 text-neutral-600' : 'border-amber-400 bg-amber-50 text-amber-700'}`}
                        title={sec.isPublished !== false ? 'Hide from navigation' : 'Show in navigation'}
                      >
                        {sec.isPublished !== false ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRenameSection(sec)}
                        className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-mono uppercase tracking-wider"
                      >
                        RENAME / EDIT
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(sec)}
                        className="p-2 text-neutral-400 hover:text-red-600 transition-colors"
                        title="Delete Section"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: HERO & LOGO BRANDING MANAGEMENT
            ========================================================= */}
        {activeTab === 'hero-branding' && (
          <div className="space-y-12">
            <div className="pb-6 border-b border-neutral-200">
              <h2 className="text-2xl font-serif text-black">Hero Asset & Logo Management</h2>
              <p className="text-xs font-mono text-neutral-500 mt-1">
                The uploaded official logo and homepage hero are active by default. You can preview, upload replacements, or reset them here.
              </p>
            </div>

            {/* 1. HOMEPAGE HERO SECTION */}
            <div className="bg-white p-8 border border-neutral-200 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-serif text-black">Homepage Hero Artwork</h3>
                  <p className="text-xs font-mono text-neutral-500">
                    Primary visual element displayed across the top of the homepage.
                  </p>
                </div>
                {adminData.settings.heroImageUrl && (
                  <button
                    onClick={() => handleUpdateSettings({ heroImageUrl: '' })}
                    className="text-xs font-mono uppercase tracking-wider text-red-600 hover:underline"
                  >
                    Clear / Set Placeholder
                  </button>
                )}
              </div>

              {/* Current Hero Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-6 bg-black p-2 border border-neutral-200">
                  {adminData.settings.heroImageUrl ? (
                    <img
                      src={adminData.settings.heroImageUrl}
                      alt="Hero Preview"
                      className="w-full max-h-96 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-64 bg-black flex items-center justify-center text-xs font-mono text-neutral-500 uppercase tracking-widest">
                      Solid Black Placeholder Active
                    </div>
                  )}
                  <div className="text-[10px] font-mono text-neutral-400 tracking-wider p-2 uppercase flex justify-between">
                    <span>ACTIVE HERO IMAGE</span>
                    <span>{adminData.settings.heroImageUrl || 'None'}</span>
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-4">
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600">
                    Upload Replacement Hero Image (JPG/PNG/WEBP)
                  </label>
                  <ImageUploader
                    images={[]}
                    onChange={() => {}}
                    singleMode={true}
                    onSingleUpload={url => handleUpdateSettings({ heroImageUrl: url })}
                  />

                  <div className="pt-4 border-t border-neutral-100 flex items-center space-x-3">
                    <button
                      onClick={() => handleUpdateSettings({ heroImageUrl: '/assets/hero.jpg' })}
                      className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-xs font-mono uppercase tracking-wider"
                    >
                      Reset to Supplied Hero Hall
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. LOGO MANAGEMENT */}
            <div className="bg-white p-8 border border-neutral-200 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-serif text-black">Website Header Logo</h3>
                  <p className="text-xs font-mono text-neutral-500">
                    Official Kevin Galbraith script signature displayed in the top-left header.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-6 bg-white p-6 border border-neutral-200 flex flex-col items-center justify-center space-y-3">
                  {adminData.settings.logoUrl ? (
                    <img
                      src={adminData.settings.logoUrl}
                      alt="Logo Preview"
                      className="max-h-28 sm:max-h-32 w-auto object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="font-serif text-3xl sm:text-4xl">Kevin Galbraith</span>
                  )}
                  <span className="text-[10px] font-mono text-neutral-400 tracking-widest uppercase">
                    ACTIVE HEADER LOGO
                  </span>
                </div>

                <div className="lg:col-span-6 space-y-4">
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600">
                    Upload Replacement Logo (PNG/SVG/JPG)
                  </label>
                  <ImageUploader
                    images={[]}
                    onChange={() => {}}
                    singleMode={true}
                    onSingleUpload={url => handleUpdateSettings({ logoUrl: url })}
                  />

                  <div className="pt-4 border-t border-neutral-100">
                    <button
                      onClick={() => handleUpdateSettings({ logoUrl: '/assets/logo.jpg' })}
                      className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-xs font-mono uppercase tracking-wider"
                    >
                      Reset to Supplied Kevin Galbraith Signature
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 4: EDITORIAL & TEXT MANAGEMENT
            ========================================================= */}
        {activeTab === 'editorial' && (
          <div className="bg-white p-8 border border-neutral-200 space-y-8">
            <div className="pb-6 border-b border-neutral-200 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-serif text-black">Editorial Copy & Texts</h2>
                <p className="text-xs font-mono text-neutral-500 mt-1">
                  Edit the artistic slogan, introductory manifesto, biographical profile, and contact details.
                </p>
              </div>

              <button
                onClick={() => persistChanges(adminData, 'Editorial text saved')}
                className="px-6 py-2.5 bg-black text-white text-xs font-mono uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors flex items-center space-x-2"
              >
                <Save size={14} />
                <span>SAVE ALL TEXT</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Homepage Slogan */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-black font-semibold">
                  Homepage Artistic Slogan (Display Typography)
                </label>
                <input
                  type="text"
                  value={adminData.settings.heroSlogan}
                  onChange={e => setAdminData({
                    ...adminData,
                    settings: { ...adminData.settings, heroSlogan: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 text-base font-serif text-black focus:outline-none focus:border-black"
                />
              </div>

              {/* Subheading */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-black font-semibold">
                  Hero Subhead / Role Tagline
                </label>
                <input
                  type="text"
                  value={adminData.settings.heroSubhead}
                  onChange={e => setAdminData({
                    ...adminData,
                    settings: { ...adminData.settings, heroSubhead: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 text-xs font-mono text-black focus:outline-none focus:border-black"
                />
              </div>

              {/* Philosophy Quote */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-black font-semibold">
                  Philosophy Statement
                </label>
                <input
                  type="text"
                  value={adminData.settings.aboutPhilosophy}
                  onChange={e => setAdminData({
                    ...adminData,
                    settings: { ...adminData.settings, aboutPhilosophy: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 text-xs font-mono text-black focus:outline-none focus:border-black"
                />
              </div>

              {/* Editorial Intro */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-black font-semibold">
                  Homepage Editorial Introduction
                </label>
                <textarea
                  rows={4}
                  value={adminData.settings.editorialIntro}
                  onChange={e => setAdminData({
                    ...adminData,
                    settings: { ...adminData.settings, editorialIntro: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 text-sm font-sans text-black focus:outline-none focus:border-black"
                />
              </div>

              {/* About Biography */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-black font-semibold">
                  In-Depth Biography Profile (About Page)
                </label>
                <textarea
                  rows={6}
                  value={adminData.settings.aboutBio}
                  onChange={e => setAdminData({
                    ...adminData,
                    settings: { ...adminData.settings, aboutBio: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 text-sm font-sans text-black focus:outline-none focus:border-black"
                />
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-black font-semibold">
                  Studio Email
                </label>
                <input
                  type="email"
                  value={adminData.settings.contactEmail}
                  onChange={e => setAdminData({
                    ...adminData,
                    settings: { ...adminData.settings, contactEmail: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 text-xs font-mono text-black focus:outline-none focus:border-black"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-black font-semibold">
                  Studio Locations
                </label>
                <input
                  type="text"
                  value={adminData.settings.contactLocation}
                  onChange={e => setAdminData({
                    ...adminData,
                    settings: { ...adminData.settings, contactLocation: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 text-xs font-mono text-black focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-100 flex justify-end">
              <button
                onClick={() => persistChanges(adminData, 'Editorial text saved')}
                className="px-8 py-3 bg-black text-white text-xs font-mono uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors"
              >
                SAVE EDITORIAL CHANGES
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 5: SECURITY & SYSTEM
            ========================================================= */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Change Password Form */}
            <div className="bg-white p-8 border border-neutral-200 space-y-6">
              <div>
                <h3 className="text-xl font-serif text-black">Administrator Keycode</h3>
                <p className="text-xs font-mono text-neutral-500 mt-1">
                  Change the password required to access this CMS dashboard.
                </p>
              </div>

              {pwMessage && (
                <div
                  className={`p-3 text-xs font-mono ${
                    pwMessage.type === 'success' ? 'bg-black text-emerald-400' : 'bg-black text-red-400'
                  }`}
                >
                  {pwMessage.text}
                </div>
              )}

              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 text-xs font-mono text-black focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    New Password (Min. 6 chars)
                  </label>
                  <input
                    type="password"
                    required
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 text-xs font-mono text-black focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 text-xs font-mono text-black focus:outline-none focus:border-black"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-black text-white text-xs font-mono uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors"
                >
                  UPDATE PASSWORD
                </button>
              </form>
            </div>

            {/* Factory Reset & JSON Backup */}
            <div className="bg-white p-8 border border-neutral-200 space-y-6">
              <div>
                <h3 className="text-xl font-serif text-black">Archive Backup & Factory Reset</h3>
                <p className="text-xs font-mono text-neutral-500 mt-1">
                  Export complete gallery data structure or reset to initial template defaults.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(adminData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `kevin-galbraith-archive-backup-${Date.now()}.json`;
                    a.click();
                  }}
                  className="w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-mono uppercase tracking-[0.2em] transition-colors"
                >
                  EXPORT JSON DATA ARCHIVE
                </button>

                <div className="p-4 bg-neutral-50 border border-neutral-200 space-y-3">
                  <div className="text-xs font-semibold text-black uppercase font-mono">
                    Restore Initial Default Configuration
                  </div>
                  <p className="text-xs text-neutral-600 font-light">
                    Resets all sections, initial projects, and restore default placeholder states.
                  </p>
                  <button
                    onClick={handleResetDefaults}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-mono uppercase tracking-wider transition-colors"
                  >
                    RESET TO FACTORY DEFAULTS
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================
          PROJECT EDIT / CREATE MODAL
          ========================================================= */}
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-neutral-300 shadow-2xl p-6 sm:p-10 space-y-8 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <h3 className="text-2xl font-serif text-black">
                {isNewProject ? 'Create Portfolio Project' : `Edit: ${editingProject.title || 'Untitled'}`}
              </h3>
              <button
                onClick={() => setEditingProject(null)}
                className="p-1 text-neutral-400 hover:text-black"
              >
                ✕
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MONOLITH NOIR"
                    value={editingProject.title}
                    onChange={e => setEditingProject({ ...editingProject, title: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 text-sm font-serif text-black focus:outline-none focus:border-black"
                  />
                </div>

                {/* Section */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                    Portfolio Section / Discipline *
                  </label>
                  <select
                    value={editingProject.sectionId}
                    onChange={e => setEditingProject({ ...editingProject, sectionId: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 text-xs font-mono text-black focus:outline-none focus:border-black"
                  >
                    {adminData.sections.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Client / Brand */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                    Client / Publication / Series
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aura Luxury Automotive"
                    value={editingProject.client || ''}
                    onChange={e => setEditingProject({ ...editingProject, client: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 text-xs font-mono text-black focus:outline-none focus:border-black"
                  />
                </div>

                {/* Year */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                    Year
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2025"
                    value={editingProject.year || ''}
                    onChange={e => setEditingProject({ ...editingProject, year: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 text-xs font-mono text-black focus:outline-none focus:border-black"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                    Category / Medium / Classification
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Global Campaign / Medium Format"
                    value={editingProject.category || ''}
                    onChange={e => setEditingProject({ ...editingProject, category: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 text-xs font-mono text-black focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                  Project Description, Dates & Editorial Information
                </label>
                <textarea
                  rows={4}
                  placeholder="Detailed description of the artistic concept, date notes, materiality, or campaign scope..."
                  value={editingProject.description || ''}
                  onChange={e => setEditingProject({ ...editingProject, description: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 text-xs font-sans text-black focus:outline-none focus:border-black"
                />
              </div>

              {/* Presentation Format Selector (Gallery vs. Individual Piece) */}
              <div className="pt-4 border-t border-neutral-200 space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-black font-semibold">
                  Project Display Mode & Setup *
                </label>
                <p className="text-[11px] text-neutral-500 font-mono">
                  Choose how visitors view this project when clicking on its cover image from the section list.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingProject({ ...editingProject, displayMode: 'gallery' })}
                    className={`p-4 border text-left flex items-start space-x-3 transition-all ${
                      editingProject.displayMode === 'gallery' || (!editingProject.displayMode && (editingProject.images?.length || 0) > 1)
                        ? 'border-black bg-neutral-100 ring-1 ring-black'
                        : 'border-neutral-200 bg-white hover:border-neutral-400'
                    }`}
                  >
                    <Images size={18} className="text-black flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-mono uppercase font-bold text-black flex items-center space-x-1.5">
                        <span>Multi-Image Gallery</span>
                        {(editingProject.displayMode === 'gallery' || (!editingProject.displayMode && (editingProject.images?.length || 0) > 1)) && (
                          <span className="text-[9px] bg-black text-white px-1.5 py-0.2">ACTIVE</span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-600 font-light mt-1 leading-relaxed">
                        Interactive full slideshow, thumbnail filmstrip, and grid mode. Ideal for photo shoots, multi-page campaigns, & series.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingProject({ ...editingProject, displayMode: 'individual' })}
                    className={`p-4 border text-left flex items-start space-x-3 transition-all ${
                      editingProject.displayMode === 'individual'
                        ? 'border-black bg-neutral-100 ring-1 ring-black'
                        : 'border-neutral-200 bg-white hover:border-neutral-400'
                    }`}
                  >
                    <FileText size={18} className="text-black flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-mono uppercase font-bold text-black flex items-center space-x-1.5">
                        <span>Individual Art Piece</span>
                        {editingProject.displayMode === 'individual' && (
                          <span className="text-[9px] bg-black text-white px-1.5 py-0.2">ACTIVE</span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-600 font-light mt-1 leading-relaxed">
                        Museum exhibition plaque emphasizing the single piece, prominent dates, medium/materials, client, & detailed description.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Multi-Image Uploader for Artwork Plates */}
              <div className="pt-4 border-t border-neutral-200 space-y-3">
                <label className="block text-xs font-mono uppercase tracking-wider text-black font-semibold">
                  Artwork Images & Spreads (Drag & Drop or Multi-Upload)
                </label>
                <p className="text-[11px] text-neutral-500 font-mono">
                  If no image is uploaded, a solid black rectangular placeholder will be shown on the public site.
                </p>

                <ImageUploader
                  images={editingProject.images || []}
                  onChange={newImages => {
                    setEditingProject({
                      ...editingProject,
                      images: newImages,
                      mainImage: newImages[0]?.url || editingProject.mainImage
                    });
                  }}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-6 border-t border-neutral-200 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="px-5 py-2.5 border border-neutral-300 text-xs font-mono uppercase tracking-wider hover:bg-neutral-100"
              >
                CANCEL
              </button>

              <button
                type="button"
                onClick={handleSaveProject}
                className="px-8 py-3 bg-black text-white text-xs font-mono uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors"
              >
                SAVE PROJECT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
