import { Term } from '../types';
import { nanoid } from './utils';

export interface ParsedTerm {
  term: string;
  definition: string;
}

export interface ParseResult {
  terms: Term[];
  error?: string;
  warnings?: string[];
}

function createTerm(term: string, definition: string): Term {
  return {
    id: nanoid(),
    term: term.trim(),
    definition: definition.trim(),
    masteryScore: 0,
    lastSeen: null,
    timesCorrect: 0,
    timesWrong: 0,
  };
}

function detectDelimiter(content: string): string {
  const lines = content.split('\n').slice(0, 5);
  const counts: Record<string, number> = { '\t': 0, ',': 0, ';': 0, '|': 0 };
  for (const line of lines) {
    for (const delim of Object.keys(counts)) {
      if (line.includes(delim)) counts[delim]++;
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

export function parseTabSeparated(content: string, termDelim = '\t', rowDelim = '\n'): ParseResult {
  const lines = content.split(rowDelim).filter(l => l.trim());
  const terms: Term[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(termDelim);
    if (parts.length < 2) {
      warnings.push(`Line ${i + 1}: couldn't parse — skipped`);
      continue;
    }
    terms.push(createTerm(parts[0], parts.slice(1).join(termDelim)));
  }

  if (!terms.length) {
    return { terms: [], error: "couldn't parse anything. check the format, gang." };
  }
  return { terms, warnings };
}

export function parseCSV(content: string): ParseResult {
  const lines = content.split('\n').filter(l => l.trim());
  const terms: Term[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted CSV
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current);

    if (parts.length < 2) {
      warnings.push(`Line ${i + 1}: skipped`);
      continue;
    }
    terms.push(createTerm(parts[0], parts[1]));
  }

  if (!terms.length) {
    return { terms: [], error: "couldn't parse that CSV, gang." };
  }
  return { terms, warnings };
}

export function parseJSON(content: string): ParseResult {
  try {
    const data = JSON.parse(content);

    // Native Lock It In format
    if (data.set?.terms) {
      return { terms: data.set.terms };
    }
    if (data.sets) {
      const terms: Term[] = [];
      for (const set of data.sets) {
        if (set.terms) terms.push(...set.terms);
      }
      return { terms };
    }

    // Array of {term, definition}
    if (Array.isArray(data)) {
      const terms = data
        .filter(item => item.term && item.definition)
        .map(item => createTerm(item.term, item.definition));
      return { terms };
    }

    return { terms: [], error: "couldn't read that JSON format." };
  } catch {
    return { terms: [], error: "invalid JSON, gang." };
  }
}

export function parseAutoDetect(content: string): ParseResult {
  // Try JSON first
  if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
    return parseJSON(content);
  }

  // Detect delimiter
  const delim = detectDelimiter(content);
  if (delim === ',') return parseCSV(content);
  return parseTabSeparated(content, delim);
}
