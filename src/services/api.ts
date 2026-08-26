import { SiteData, SiteSettings, PortfolioSection, PortfolioProject } from '../types';

const API_BASE = '/api';

export const apiService = {
  // Public data fetcher
  async getPublicContent(): Promise<SiteData> {
    const res = await fetch(`${API_BASE}/content`);
    if (!res.ok) {
      throw new Error(`Failed to load content: ${res.statusText}`);
    }
    return res.json();
  },

  // Admin Login
  async adminLogin(password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Authentication failed' };
      }
      if (data.token) {
        localStorage.setItem('kg_admin_token', data.token);
      }
      return { success: true, token: data.token };
    } catch (e: any) {
      return { success: false, error: e.message || 'Connection error' };
    }
  },

  // Verify Admin Token
  async verifyAdminToken(): Promise<boolean> {
    const token = localStorage.getItem('kg_admin_token');
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/admin/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.ok;
    } catch {
      return false;
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
    const token = this.getAdminToken();
    const res = await fetch(`${API_BASE}/admin/content`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      if (res.status === 401) {
        this.adminLogout();
      }
      throw new Error('Unauthorized or failed to fetch admin data');
    }
    return res.json();
  },

  // Save entire dataset
  async saveAdminContent(data: SiteData): Promise<void> {
    const token = this.getAdminToken();
    const res = await fetch(`${API_BASE}/admin/content`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save changes');
    }
  },

  // Upload files via multipart form
  async uploadFiles(files: File[]): Promise<string[]> {
    const token = this.getAdminToken();
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    const res = await fetch(`${API_BASE}/admin/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Upload failed');
    }

    const data = await res.json();
    return (data.files || []).map((f: any) => f.url);
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
    const res = await fetch(`${API_BASE}/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update password');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('kg_admin_token', data.token);
    }
    return true;
  },

  // Reset default content
  async resetDefaults(): Promise<SiteData> {
    const token = this.getAdminToken();
    const res = await fetch(`${API_BASE}/admin/reset-defaults`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      throw new Error('Failed to reset data');
    }
    const data = await res.json();
    return data.data;
  }
};
