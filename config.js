export const API_BASE_URL = 'http://192.168.10.105:3000'
export const AVATAR_PLACEHOLDER = require('./assets/avatar-placeholder.png');
export function toImageUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  if (pathOrUrl.startsWith('/')) return `${API_BASE_URL}${pathOrUrl}`;
  return `${API_BASE_URL}/${pathOrUrl}`;
}