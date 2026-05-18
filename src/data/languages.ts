export type LanguageCode = 'es';

export type Language = {
  code: LanguageCode;
  name: string;
  endonym: string;
  note: string;
};

export type Snippet = {
  id: string;
  phrase: string;
  pronunciation: string;
  translation: string;
  culturalNote: string;
  example: {
    original: string;
    translation: string;
  };
  region?: string;
  mood: string;
};

export const languages: Language[] = [
  {
    code: 'es',
    name: 'Spanish',
    endonym: 'Español',
    note: 'More languages soon',
  },
];

const DAY_IN_MS = 86_400_000;

export function getOsloDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Oslo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function isDateKey(value: string | null): value is string {
  if (value === null || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T12:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getSnippetIndex(dateKey: string, count: number): number {
  const timestamp = Date.parse(`${dateKey}T00:00:00.000Z`);
  const daysSinceEpoch = Math.floor(timestamp / DAY_IN_MS);
  return ((daysSinceEpoch % count) + count) % count;
}

export function formatDisplayDate(dateKey: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${dateKey}T12:00:00.000Z`));
}
