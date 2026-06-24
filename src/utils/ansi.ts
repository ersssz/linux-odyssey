export interface AnsiSegment {
  text: string;
  color?: string;
  backgroundColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

const ansiColorMap: Record<string, string> = {
  '30': '#24292f',
  '31': '#f85149',
  '32': '#3fb950',
  '33': '#d29922',
  '34': '#58a6ff',
  '35': '#a371f7',
  '36': '#56d4dd',
  '37': '#c9d1d9',
  '90': '#8b949e',
  '91': '#ff7b72',
  '92': '#7ee787',
  '93': '#ffa657',
  '94': '#79c0ff',
  '95': '#d2a8ff',
  '96': '#a5f3fc',
  '97': '#ffffff',
};

export function parseAnsi(input: string): AnsiSegment[] {
  const segments: AnsiSegment[] = [];
  const ESC = String.fromCharCode(27);
  const regex = new RegExp(`${ESC}\\[([0-9;]*)m`, 'g');
  let match: RegExpExecArray | null;
  let lastIndex = 0;
  let current: AnsiSegment = { text: '' };

  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ ...current, text: input.slice(lastIndex, match.index) });
    }

    const codes = match[1].split(';').filter(Boolean);
    for (const code of codes) {
      if (code === '0') {
        current = { text: '' };
      } else if (code === '1') {
        current.bold = true;
      } else if (code === '3') {
        current.italic = true;
      } else if (code === '4') {
        current.underline = true;
      } else if (ansiColorMap[code]) {
        current.color = ansiColorMap[code];
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < input.length) {
    segments.push({ ...current, text: input.slice(lastIndex) });
  }

  return segments;
}

export function ansi(text: string, codes: string): string {
  return `\x1b[${codes}m${text}\x1b[0m`;
}

export const ansiColors = {
  red: '31',
  green: '32',
  yellow: '33',
  blue: '34',
  magenta: '35',
  cyan: '36',
  white: '37',
  brightRed: '91',
  brightGreen: '92',
  brightYellow: '93',
  brightBlue: '94',
  brightMagenta: '95',
  brightCyan: '96',
  brightWhite: '97',
  gray: '90',
};

export function color(text: string, colorName: keyof typeof ansiColors): string {
  return ansi(text, ansiColors[colorName]);
}
