// The only place that knows which templates this build can render.
// `load` pulls in template-only CSS and fonts; `shell` and `dashboard` pick shared layout components.
export const DEFAULT_TEMPLATE = 'classic';
export const registry = Object.freeze({
  classic: { code: 'classic', name: 'Classic', major: 1, shell: 'sidebar', dashboard: 'classic', themeColor: '#151719', load: null },
  luxury: { code: 'luxury', name: 'Luxury', major: 1, shell: 'masthead', dashboard: 'editorial', themeColor: '#2A2723', load: () => import('./luxury.css') },
  modern: { code: 'modern', name: 'Modern', major: 1, shell: 'floating', dashboard: 'bento', themeColor: '#FFFFFF', load: () => import('./modern.css') },
  minimal: { code: 'minimal', name: 'Minimal', major: 1, shell: 'text', dashboard: 'ledger', themeColor: '#FFFFFF', load: () => import('./minimal.css') },
  royal: { code: 'royal', name: 'Royal', major: 1, shell: 'rail', dashboard: 'court', themeColor: '#0E1B3D', load: () => import('./royal.css') },
  'midnight-dark': { code: 'midnight-dark', name: 'Midnight Dark', major: 1, shell: 'sidebar', dashboard: 'editorial', scheme: 'dark', themeColor: '#0E0F11', load: () => import('./midnight-dark.css') },
  'ocean-dark': { code: 'ocean-dark', name: 'Ocean Dark', major: 1, shell: 'rail', dashboard: 'bento', scheme: 'dark', themeColor: '#061423', load: () => import('./ocean-dark.css') },
  'emerald': { code: 'emerald', name: 'Emerald', major: 1, shell: 'masthead', dashboard: 'classic', themeColor: '#0F3B2E', load: () => import('./emerald.css') },
  'amoled': { code: 'amoled', name: 'AMOLED', major: 1, shell: 'text', dashboard: 'focus', scheme: 'dark', themeColor: '#000000', load: () => import('./amoled.css') },
  'modern-light': { code: 'modern-light', name: 'Modern Light', major: 1, shell: 'split', dashboard: 'split', themeColor: '#FFFFFF', load: () => import('./modern-light.css') },
  'glass-light': { code: 'glass-light', name: 'Glass Light', major: 1, shell: 'floating', dashboard: 'bento', glass: true, themeColor: '#FFFFFF', load: () => import('./glass-light.css') },
  'glass-dark': { code: 'glass-dark', name: 'Glass Dark', major: 1, shell: 'floating', dashboard: 'focus', scheme: 'dark', glass: true, themeColor: '#171B22', load: () => import('./glass-dark.css') },
  'midnight-glass': { code: 'midnight-glass', name: 'Midnight Glass', major: 1, shell: 'rail', dashboard: 'editorial', scheme: 'dark', glass: true, themeColor: '#11152E', load: () => import('./midnight-glass.css') },
  'royal-gold-glass': { code: 'royal-gold-glass', name: 'Royal Gold Glass', major: 1, shell: 'masthead', dashboard: 'court', scheme: 'dark', glass: true, themeColor: '#20152A', load: () => import('./royal-gold-glass.css') },
  'aurora-glass': { code: 'aurora-glass', name: 'Aurora Glass', major: 1, shell: 'floating', dashboard: 'split', scheme: 'dark', glass: true, themeColor: '#0C1D26', load: () => import('./aurora-glass.css') },
});

/** Server configuration -> renderable template. Unknown codes and unsupported major versions become Classic. */
export function resolveTemplate(config) {
  const code = String(config?.code || ''), entry = Object.hasOwn(registry, code) ? registry[code] : null;
  const major = Number.parseInt(config?.version, 10);
  return entry && (!Number.isFinite(major) || major === entry.major) ? entry : registry[DEFAULT_TEMPLATE];
}
