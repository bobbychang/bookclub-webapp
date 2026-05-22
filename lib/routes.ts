export const APP_BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');

export function appPath(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (normalizedPath === '/') return APP_BASE_PATH || '/';
  return `${APP_BASE_PATH}${normalizedPath}`;
}

export function apiPath(path: string) {
  return appPath(path);
}
