import { SiteData, SiteSettings, PortfolioSection, PortfolioProject } from '../types';
import { initialSiteData } from '../data/initialData';
import {
  getDb,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  Unsubscribe
} from '../lib/firebase';
import { optimizeImageFile } from '../utils/imageCompressor';

const API_BASE = '/api';

// Safe helper to read json or text without throwing unexpected end of JSON errors
async function parseResponseSafely<T = any>(res: Response): Promise<{ ok: boolean; status: number; data: T | null; text: string }> {
  const text = await res.text();
  let data: T | null = null;
  if (text && text.trim()) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  return {
    ok: res.ok,
    status: res.status,
    data,
    text
  };
}

export const apiService = {
  // Real-time synchronization across all devices and browsers
  subscribePublicContent(callback: (data: SiteData) => void): Unsubscribe | (() => void) {
    const db = getDb();
    if (!db) {
      return () => {};
    }

    try {
      let currentSettings = initialSiteData.settings;
      let currentSections = initialSiteData.sections;
      let currentProjects = initialSiteData.projects;

      const notify = () => {
        const merged: SiteData = {
          settings: currentSettings,
          sections: currentSections,
          projects: [...currentProjects].sort((a, b) => (a.order || 0) - (b.order || 0)),
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('kg_site_content', JSON.stringify(merged));
        callback(merged);
      };

      // 1. Listen to site settings & sections
      const unsubSettings = onSnapshot(
        doc(db, 'site_content', 'settings'),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as any;
            if (data.settings) currentSettings = data.settings;
            if (data.sections) currentSections = data.sections;
            notify();
          }
        },
        (err) => console.warn('Firestore settings subscription note:', err)
      );

      // 2. Listen to projects collection (individual project documents)
      const unsubProjects = onSnapshot(
        collection(db, 'projects'),
        (snapshot) => {
          if (!snapshot.empty) {
            const loaded = snapshot.docs.map(d => d.data() as PortfolioProject);
            currentProjects = loaded;
            notify();
          }
        },
        (err) => console.warn('Firestore projects subscription note:', err)
      );

      // 3. Fallback listener for legacy single-document 'main'
      const unsubMain = onSnapshot(
        doc(db, 'site_content', 'main'),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as any;
            if (data.settings && !currentSettings) currentSettings = data.settings;
            if (data.sections && !currentSections) currentSections = data.sections;
            if (data.projects && (!currentProjects || currentProjects.length === 0)) {
              currentProjects = data.projects;
            }
            notify();
          }
        },
        () => {}
      );

      return () => {
        unsubSettings();
        unsubProjects();
        unsubMain();
      };
    } catch (err) {
      console.warn('Could not initialize real-time Firestore listeners:', err);
      return () => {};
    }
  },

  // Public data fetcher
  async getPublicContent(): Promise<SiteData> {
    // 1. Try Firebase Firestore Cloud Database first
    try {
      const db = getDb();
      if (db) {
        let settings = initialSiteData.settings;
        let sections = initialSiteData.sections;
        let projects: PortfolioProject[] = [];

        // Check settings doc
        const settingsSnap = await getDoc(doc(db, 'site_content', 'settings'));
        if (settingsSnap.exists()) {
          const sData = settingsSnap.data() as any;
          if (sData.settings) settings = sData.settings;
          if (sData.sections) sections = sData.sections;
        } else {
          // Check legacy main doc
          const mainSnap = await getDoc(doc(db, 'site_content', 'main'));
          if (mainSnap.exists()) {
            const mData = mainSnap.data() as any;
            if (mData.settings) settings = mData.settings;
            if (mData.sections) sections = mData.sections;
            if (mData.projects) projects = mData.projects;
          }
        }

        // Check projects collection
        const projSnap = await getDocs(collection(db, 'projects'));
        if (!projSnap.empty) {
          projects = projSnap.docs.map(d => d.data() as PortfolioProject);
        }

        // If projects were found in cloud, assemble and return
        if (projects.length > 0) {
          projects.sort((a, b) => (a.order || 0) - (b.order || 0));
          const result: SiteData = {
            settings,
            sections,
            projects,
            updatedAt: new Date().toISOString()
          };
          localStorage.setItem('kg_site_content', JSON.stringify(result));
          return result;
        }

        // If Firestore is completely fresh, seed initial content
        if (projSnap.empty && !settingsSnap.exists()) {
          await this.saveAdminContent(initialSiteData);
          return initialSiteData;
        }
      }
    } catch (firebaseErr) {
      console.warn('Firestore initial fetch note (checking fallback cache):', firebaseErr);
    }

    // 2. Try Express server endpoint
    try {
      const res = await fetch(`${API_BASE}/content`);
      const parsed = await parseResponseSafely<SiteData>(res);
      if (parsed.ok && parsed.data && parsed.data.settings) {
        localStorage.setItem('kg_site_content', JSON.stringify(parsed.data));
        return parsed.data;
      }
    } catch (serverErr) {
      // Static / offline mode
    }

    // 3. Fallback to localStorage or bundled initialData
    const localSaved = localStorage.getItem('kg_site_content');
    if (localSaved) {
      try {
        const parsed = JSON.parse(localSaved);
        if (parsed && parsed.settings && parsed.projects) return parsed;
      } catch {}
    }

    return initialSiteData;
  },

  // Admin Login
  async adminLogin(password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    const cleanPassword = (password || '').trim();
    if (!cleanPassword) {
      return { success: false, error: 'Please enter a password' };
    }

    const customPw = localStorage.getItem('kg_admin_password');
    const isMasterPassword =
      cleanPassword === 'Hgert1903@!' ||
      cleanPassword.toLowerCase() === 'hgert1903@!';
    const isCustomPassword = customPw ? cleanPassword === customPw.trim() : false;
    const isClientValid = isMasterPassword || isCustomPassword;

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: cleanPassword })
      });
      const parsed = await parseResponseSafely<{ success?: boolean; token?: string; error?: string }>(res);

      if (parsed.ok && parsed.data?.token) {
        localStorage.setItem('kg_admin_token', parsed.data.token);
        return { success: true, token: parsed.data.token };
      }

      if (parsed.data?.error && parsed.status === 401 && !isClientValid) {
        return { success: false, error: parsed.data.error };
      }
    } catch (e: any) {
      console.warn('Backend login network error (running in static/preview mode):', e);
    }

    // Static hosting / Netlify / Offline fallback
    if (isClientValid) {
      const localToken = 'local-admin-token-' + Date.now();
      localStorage.setItem('kg_admin_token', localToken);
      return { success: true, token: localToken };
    }

    return { success: false, error: 'Invalid administrator password.' };
  },

  // Verify Admin Token
  async verifyAdminToken(): Promise<boolean> {
    const token = localStorage.getItem('kg_admin_token');
    if (!token) return false;
    if (token.startsWith('local-admin-token-') || token.startsWith('fallback-')) return true;

    try {
      const res = await fetch(`${API_BASE}/admin/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const parsed = await parseResponseSafely<{ valid?: boolean }>(res);
      if (parsed.ok && parsed.data?.valid === true) {
        return true;
      }
      if (parsed.status === 404) {
        return true;
      }
      return false;
    } catch {
      return true;
    }
  },

  getAdminToken(): string | null {
    return localStorage.getItem('kg_admin_token');
  },

  adminLogout(): void {
    localStorage.removeItem('kg_admin_token');
  },

  // Fetch full dataset for admin
  async getAdminContent(): Promise<SiteData> {
    return this.getPublicContent();
  },

  // Save entire dataset to Cloud Database and local caches
  async saveAdminContent(data: SiteData): Promise<void> {
    const token = this.getAdminToken();
    const cleanProjects = (data.projects || []).map((p, idx) => ({
      ...p,
      order: typeof p.order === 'number' ? p.order : idx + 1,
      isPublished: p.isPublished !== false
    }));

    const cleanData: SiteData = {
      ...data,
      projects: cleanProjects,
      updatedAt: new Date().toISOString()
    };

    // 1. Mirror immediately to localStorage for zero-latency local availability
    localStorage.setItem('kg_site_content', JSON.stringify(cleanData));

    // 2. Persist to Firestore Cloud Database
    const db = getDb();
    if (db) {
      try {
        // Save settings and sections document
        await setDoc(doc(db, 'site_content', 'settings'), {
          settings: cleanData.settings,
          sections: cleanData.sections,
          updatedAt: cleanData.updatedAt
        });

        // Also update main doc with lightweight overview
        await setDoc(doc(db, 'site_content', 'main'), {
          settings: cleanData.settings,
          sections: cleanData.sections,
          updatedAt: cleanData.updatedAt
        });

        // Fetch existing projects in Firestore to identify deleted ones
        const existingDocs = await getDocs(collection(db, 'projects'));
        const currentIds = new Set(cleanProjects.map(p => p.id));

        // Delete removed projects
        const deletePromises = existingDocs.docs
          .filter(d => !currentIds.has(d.id))
          .map(d => deleteDoc(doc(db, 'projects', d.id)));
        await Promise.all(deletePromises);

        // Save each project individually so no single document exceeds 1MB
        const savePromises = cleanProjects.map(proj =>
          setDoc(doc(db, 'projects', proj.id), proj)
        );
        await Promise.all(savePromises);
      } catch (cloudErr) {
        console.error('Firestore cloud save error:', cloudErr);
        throw new Error('Cloud database synchronization note: ' + (cloudErr instanceof Error ? cloudErr.message : String(cloudErr)));
      }
    }

    // 3. Persist to Express backend if online
    try {
      await fetch(`${API_BASE}/admin/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(cleanData)
      });
    } catch (serverErr) {
      // Backend is optional in static hosting
    }
  },

  // Upload files: optimize imagery client-side & upload to server/cloud
  async uploadFiles(files: File[]): Promise<string[]> {
    const token = this.getAdminToken();

    // 1. Compress & optimize images client-side for rapid cross-device transfer
    const optimizedDataUrls = await Promise.all(
      files.map(file => optimizeImageFile(file, 1440, 0.80))
    );

    // 2. Try saving to backend file storage if Express is active
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));

      const res = await fetch(`${API_BASE}/admin/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const parsed = await parseResponseSafely<{ files?: Array<{ url: string }>; error?: string }>(res);

      if (parsed.ok && parsed.data?.files && parsed.data.files.length > 0) {
        return parsed.data.files.map((f: any) => f.url);
      }
    } catch (err: any) {
      console.warn('Backend file upload note (using optimized cloud imagery):', err);
    }

    // Return the high-res optimized data URLs which sync across devices via Firestore
    return optimizedDataUrls;
  },

  // Upload single file helper
  async uploadSingleFile(file: File): Promise<string> {
    const urls = await this.uploadFiles([file]);
    if (!urls.length) throw new Error('No URL returned from upload');
    return urls[0];
  },

  // Change Admin Password
  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    const token = this.getAdminToken();
    localStorage.setItem('kg_admin_password', newPassword);

    try {
      const res = await fetch(`${API_BASE}/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const parsed = await parseResponseSafely<{ token?: string; error?: string }>(res);

      if (parsed.data?.token) {
        localStorage.setItem('kg_admin_token', parsed.data.token);
      }
    } catch {
      // Backend not running in static deployment; localStorage update is sufficient
    }

    return true;
  },

  // Reset default content
  async resetDefaults(): Promise<SiteData> {
    const token = this.getAdminToken();
    localStorage.removeItem('kg_site_content');

    const db = getDb();
    if (db) {
      try {
        await setDoc(doc(db, 'site_content', 'settings'), {
          settings: initialSiteData.settings,
          sections: initialSiteData.sections,
          updatedAt: new Date().toISOString()
        });
        await setDoc(doc(db, 'site_content', 'main'), {
          settings: initialSiteData.settings,
          sections: initialSiteData.sections,
          updatedAt: new Date().toISOString()
        });

        // Clear projects collection and re-seed
        const existingDocs = await getDocs(collection(db, 'projects'));
        await Promise.all(existingDocs.docs.map(d => deleteDoc(doc(db, 'projects', d.id))));
        await Promise.all(
          initialSiteData.projects.map(p => setDoc(doc(db, 'projects', p.id), p))
        );
      } catch (cloudErr) {
        console.warn('Could not reset Firestore:', cloudErr);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/admin/reset-defaults`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const parsed = await parseResponseSafely<{ data: SiteData; error?: string }>(res);
      if (parsed.ok && parsed.data?.data) {
        return parsed.data.data;
      }
    } catch {}

    return initialSiteData;
  }
};


