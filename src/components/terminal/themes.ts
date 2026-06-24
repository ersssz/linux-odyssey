export interface Theme {
  name: string;
  bg: string;
  text: string;
  green: string;
  red: string;
  yellow: string;
  dim: string;
  surface: string;
  surfaceLight: string;
}

export const themes: Record<string, Theme> = {
  classic: {
    name: 'Classic',
    bg: '#0d1117',
    text: '#c9d1d9',
    green: '#3fb950',
    red: '#f85149',
    yellow: '#d29922',
    dim: '#8b949e',
    surface: '#161b22',
    surfaceLight: '#21262d',
  },
  crt: {
    name: 'CRT',
    bg: '#050505',
    text: '#33ff00',
    green: '#33ff00',
    red: '#ff3333',
    yellow: '#ffff33',
    dim: '#1a5c1a',
    surface: '#0a0a0a',
    surfaceLight: '#1a1a1a',
  },
  cyberpunk: {
    name: 'Cyberpunk',
    bg: '#000000',
    text: '#fcee0a',
    green: '#00ff00',
    red: '#ff003c',
    yellow: '#fcee0a',
    dim: '#00f0ff',
    surface: '#1a1a1a',
    surfaceLight: '#2a2a2a',
  },
  barbie: {
    name: 'Barbie',
    bg: '#ffe6f2',
    text: '#d6006e',
    green: '#ff1493',
    red: '#ff0055',
    yellow: '#ff66a3',
    dim: '#ff80bf',
    surface: '#ffcce6',
    surfaceLight: '#ffb3d9',
  },
  gigachad: {
    name: 'Gigachad',
    bg: '#050505',
    text: '#f5f5f5',
    green: '#d4af37', // Gold
    red: '#b30000', // Blood Red
    yellow: '#ff4500', // Fire Orange
    dim: '#666666', // Steel
    surface: '#111111',
    surfaceLight: '#222222',
  },
};
