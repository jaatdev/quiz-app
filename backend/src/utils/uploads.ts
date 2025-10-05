import fs from 'fs';
import path from 'path';

const unique = <T,>(items: T[]): T[] => {
  const seen = new Set<T>();
  const result: T[] = [];
  for (const item of items) {
    if (!item) continue;
    if (seen.has(item)) continue;
    seen.add(item);
    result.push(item);
  }
  return result;
};

const resolveEnvPath = (): string | null => {
  const fromEnv = process.env.UPLOADS_DIR?.trim();
  if (!fromEnv) {
    return null;
  }
  const resolved = path.isAbsolute(fromEnv) ? fromEnv : path.resolve(process.cwd(), fromEnv);
  return resolved;
};

const candidateRoots = unique([
  resolveEnvPath(),
  path.resolve(process.cwd(), 'uploads'),
  path.resolve(process.cwd(), 'backend', 'uploads'),
  path.resolve(__dirname, '..', 'uploads'),
  path.resolve(__dirname, '..', '..', 'uploads'),
]);

let cachedUploadsDir: string | null = null;

const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const pickUploadsRoot = (): string => {
  if (cachedUploadsDir) {
    return cachedUploadsDir;
  }

  for (const candidate of candidateRoots) {
    if (!candidate) continue;
    const notesCandidate = path.join(candidate, 'notes');
    if (fs.existsSync(notesCandidate)) {
      ensureDir(notesCandidate);
      cachedUploadsDir = candidate;
      return candidate;
    }
  }

  for (const candidate of candidateRoots) {
    if (!candidate) continue;
    try {
      ensureDir(path.join(candidate, 'notes'));
      cachedUploadsDir = candidate;
      return candidate;
    } catch (error) {
      // try next candidate
      continue;
    }
  }

  const fallback = path.resolve(process.cwd(), 'uploads');
  ensureDir(path.join(fallback, 'notes'));
  cachedUploadsDir = fallback;
  return fallback;
};

export const getUploadsDir = (): string => pickUploadsRoot();

export const getNotesDir = (): string => {
  const base = pickUploadsRoot();
  const notesPath = path.join(base, 'notes');
  ensureDir(notesPath);
  return notesPath;
};

export const toUploadsRelativePath = (absolutePath: string): string => {
  const base = pickUploadsRoot();
  const normalized = path.normalize(absolutePath);
  const relative = path.relative(base, normalized).replace(/\\/g, '/');

  if (!relative || relative.startsWith('..')) {
    throw new Error(`Path ${absolutePath} is outside of uploads root ${base}`);
  }

  return relative;
};

export const buildNotesUrl = (absolutePath: string): string => {
  const relative = toUploadsRelativePath(absolutePath);
  const cleaned = relative.startsWith('/') ? relative : `/${relative}`;
  return `/uploads${cleaned}`;
};

export const resolveAbsoluteFromUrl = (notesUrl: string): string => {
  const sanitized = notesUrl.replace(/^\/?uploads\/?/, '');
  return path.join(pickUploadsRoot(), sanitized);
};
