export interface PortfolioSection {
  id: string;
  slug: string;
  name: string;
  description: string;
  order: number;
  isPublished: boolean;
  isCustom?: boolean;
}

export interface ProjectImage {
  id: string;
  url: string;
  caption?: string;
  order: number;
  aspectRatio?: 'portrait' | 'landscape' | 'square' | 'full';
}

export interface PortfolioProject {
  id: string;
  sectionId: string;
  title: string;
  client?: string;
  year?: string;
  category?: string;
  description?: string;
  mainImage: string; // URL or empty/black placeholder
  images: ProjectImage[];
  order: number;
  isPublished: boolean;
  featured?: boolean;
  layoutStyle?: 'editorial-split' | 'full-gallery' | 'magazine-archive' | 'identity-focus' | 'experimental';
}

export interface SiteSettings {
  logoUrl: string;
  heroImageUrl: string;
  heroSlogan: string;
  heroSubhead: string;
  editorialIntro: string;
  aboutTitle: string;
  aboutRole: string;
  aboutBio: string;
  aboutPhilosophy: string;
  aboutDisciplines: string[];
  contactEmail: string;
  contactLocation: string;
  copyrightText: string;
}

export interface SiteData {
  settings: SiteSettings;
  sections: PortfolioSection[];
  projects: PortfolioProject[];
}
