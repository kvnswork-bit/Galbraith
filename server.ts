import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { initialSiteData } from './src/data/initialData';
import { SiteData } from './src/types';

const app = express();
const PORT = 3000;

// Directories
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'content.json');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const ASSETS_DIR = path.join(process.cwd(), 'public', 'assets');

// Ensure directories exist
[DATA_DIR, UPLOADS_DIR, ASSETS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Admin Password Secret
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Hgert1903@!';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

// Load or initialize Auth
function getAdminPasswordHash(): string {
  if (fs.existsSync(AUTH_FILE)) {
    try {
      const auth = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
      if (auth.passwordHash) return auth.passwordHash;
    } catch (e) {
      console.error('Error reading auth file', e);
    }
  }
  const hash = crypto.createHash('sha256').update(DEFAULT_ADMIN_PASSWORD).digest('hex');
  fs.writeFileSync(AUTH_FILE, JSON.stringify({ passwordHash: hash }, null, 2));
  return hash;
}

// Load or initialize Site Data
function loadSiteData(): SiteData {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('Error parsing content.json, reverting to initial data', err);
    }
  }
  saveSiteData(initialSiteData);
  return initialSiteData;
}

function saveSiteData(data: SiteData): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving site data', err);
  }
}

// Token helper
function createToken(): string {
  const payload = { role: 'admin', exp: Date.now() + 1000 * 60 * 60 * 24 * 7 }; // 7 days
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [data, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
    if (sig !== expectedSig) return false;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    if (payload.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

// Auth Middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized. Administrator access required.' });
  }
  next();
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `${cleanName}-${uniqueSuffix}${ext || '.jpg'}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|svg\+xml|svg|gif|avif/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (allowedTypes.test(ext) || allowedTypes.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WEBP, SVG, GIF) are allowed.'));
    }
  }
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads & assets route
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/assets', express.static(ASSETS_DIR));
app.use('/public', express.static(path.join(process.cwd(), 'public')));

// -------------------------------------------------------------
// PUBLIC API ROUTES
// -------------------------------------------------------------

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public Site Content (Filters out unpublished items)
app.get('/api/content', (_req, res) => {
  const data = loadSiteData();
  
  // Filter only published sections and projects for public visitors
  const publishedSections = (data.sections || [])
    .filter(s => s.isPublished !== false)
    .sort((a, b) => a.order - b.order);
  
  const publishedSectionIds = new Set(publishedSections.map(s => s.id));
  
  const publishedProjects = (data.projects || [])
    .filter(p => p.isPublished !== false && publishedSectionIds.has(p.sectionId))
    .sort((a, b) => a.order - b.order);

  res.json({
    settings: data.settings,
    sections: publishedSections,
    projects: publishedProjects
  });
});

// -------------------------------------------------------------
// ADMIN AUTH ROUTES
// -------------------------------------------------------------

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password required' });
  }

  const currentHash = getAdminPasswordHash();
  const inputHash = crypto.createHash('sha256').update(password).digest('hex');

  if (inputHash === currentHash) {
    const token = createToken();
    return res.json({ success: true, token });
  }

  // Artificial delay to prevent brute-force
  setTimeout(() => {
    return res.status(401).json({ error: 'Invalid administrator password' });
  }, 400);
});

app.get('/api/admin/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  if (verifyToken(token)) {
    return res.json({ valid: true });
  }
  return res.status(401).json({ valid: false });
});

app.post('/api/admin/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Invalid password provided (minimum 6 characters)' });
  }

  const currentHash = getAdminPasswordHash();
  const inputHash = crypto.createHash('sha256').update(currentPassword).digest('hex');

  if (inputHash !== currentHash) {
    return res.status(401).json({ error: 'Current password incorrect' });
  }

  const newHash = crypto.createHash('sha256').update(newPassword).digest('hex');
  fs.writeFileSync(AUTH_FILE, JSON.stringify({ passwordHash: newHash }, null, 2));

  const newToken = createToken();
  res.json({ success: true, message: 'Password updated successfully', token: newToken });
});

// -------------------------------------------------------------
// ADMIN CMS CRUD ROUTES (PROTECTED)
// -------------------------------------------------------------

// Get complete dataset including unpublished sections and projects
app.get('/api/admin/content', requireAuth, (_req, res) => {
  const data = loadSiteData();
  res.json(data);
});

// Save complete or updated dataset
app.put('/api/admin/content', requireAuth, (req, res) => {
  const incomingData: SiteData = req.body;
  if (!incomingData || !incomingData.settings || !Array.isArray(incomingData.sections) || !Array.isArray(incomingData.projects)) {
    return res.status(400).json({ error: 'Invalid site data structure' });
  }

  saveSiteData(incomingData);
  res.json({ success: true, message: 'Changes saved successfully', data: incomingData });
});

// Single & Multiple Image Uploads
app.post('/api/admin/upload', requireAuth, upload.array('images', 20), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    const uploadedUrls = files.map(file => ({
      url: `/uploads/${file.filename}`,
      name: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.json({
      success: true,
      files: uploadedUrls,
      primaryUrl: uploadedUrls[0].url
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'File upload failed' });
  }
});

// Base64 direct upload helper (e.g. from canvas or paste)
app.post('/api/admin/upload-base64', requireAuth, (req, res) => {
  try {
    const { dataUrl, filename } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ error: 'dataUrl required' });
    }

    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 string' });
    }

    const ext = matches[1].includes('png') ? '.png' : matches[1].includes('svg') ? '.svg' : '.jpg';
    const buffer = Buffer.from(matches[2], 'base64');
    const safeName = (filename || 'upload').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const finalFilename = `${safeName}-${Date.now()}${ext}`;
    const filePath = path.join(UPLOADS_DIR, finalFilename);

    fs.writeFileSync(filePath, buffer);

    res.json({
      success: true,
      url: `/uploads/${finalFilename}`
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Base64 upload failed' });
  }
});

// Reset site to default factory data
app.post('/api/admin/reset-defaults', requireAuth, (_req, res) => {
  saveSiteData(initialSiteData);
  res.json({ success: true, message: 'Reset to initial gallery configuration', data: initialSiteData });
});

// -------------------------------------------------------------
// VITE / STATIC PRODUCTION HANDLER
// -------------------------------------------------------------

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kevin Galbraith Studio server running on http://0.0.0.0:${PORT}`);
  });
}

start();
