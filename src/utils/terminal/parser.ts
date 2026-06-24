export interface ParsedCommand {
  args: string[];
  redirectOut: string | null;
  redirectOutAppend: string | null;
  redirectIn: string | null;
  hasPipe: boolean;
  pipeTarget: string | null;
}

export function parseShell(input: string): ParsedCommand {
  const tokens: string[] = [];
  let current = '';
  let inQuotes: false | '"' | "'" = false;
  let escape = false;

  for (const char of input) {
    if (escape) {
      current += char;
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (inQuotes) {
      if (char === inQuotes) {
        inQuotes = false;
      } else {
        current += char;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      inQuotes = char;
      continue;
    }
    if (char === ' ' || char === '\t') {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
      continue;
    }
    current += char;
  }
  if (current.length > 0) tokens.push(current);

  const args: string[] = [];
  let redirectOut: string | null = null;
  let redirectOutAppend: string | null = null;
  let redirectIn: string | null = null;
  let hasPipe = false;
  let pipeTarget: string | null = null;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === '>' && i + 1 < tokens.length) {
      redirectOut = tokens[i + 1];
      i++;
    } else if (token === '>>' && i + 1 < tokens.length) {
      redirectOutAppend = tokens[i + 1];
      i++;
    } else if (token === '<' && i + 1 < tokens.length) {
      redirectIn = tokens[i + 1];
      i++;
    } else if (token === '|') {
      hasPipe = true;
      pipeTarget = tokens.slice(i + 1).join(' ');
      break;
    } else {
      args.push(token);
    }
  }

  return { args, redirectOut, redirectOutAppend, redirectIn, hasPipe, pipeTarget };
}

export function tokenizeCommandString(input: string): string[] {
  const parsed = parseShell(input);
  return parsed.args;
}
