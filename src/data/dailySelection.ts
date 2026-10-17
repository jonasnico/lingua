import { getOsloDateKey, isDateKey, type Snippet } from './languages.ts';
import { spanishSnippets } from './snippets/spanish.ts';

// Published assignments are append-only; new content must not reshuffle past days.
export const dailySchedule: Readonly<Record<string, string>> = {
  '2026-10-04': 'que-te-apetece',
  '2026-10-05': 'poco-a-poco',
  '2026-10-06': 'me-viene-bien',
  '2026-10-07': 'que-guay',
  '2026-10-08': 'nos-vemos',
  '2026-10-09': 'que-tal',
  '2026-10-10': 'hasta-luego',
  '2026-10-11': 'buen-provecho',
  '2026-10-12': 'no-pasa-nada',
  '2026-10-13': 'vale',
  '2026-10-14': 'con-mucho-gusto',
  '2026-10-15': 'que-rico',
  '2026-10-16': 'me-encanta',
  '2026-10-17': 'aqui-estamos',
  '2026-10-18': 'mucho-gusto',
  '2026-10-19': 'con-permiso',
  '2026-10-20': 'puedes-repetirlo',
  '2026-10-21': 'la-cuenta-por-favor',
  '2026-10-22': 'cuanto-cuesta',
  '2026-10-23': 'estoy-de-acuerdo',
  '2026-10-24': 'que-tengas-buen-dia',
  '2026-10-25': 'tengo-ganas',
  '2026-10-26': 'me-da-igual',
  '2026-10-27': 'por-si-acaso',
  '2026-10-28': 'que-te-parece',
  '2026-10-29': 'ya-vuelvo',
  '2026-10-30': 'te-echo-de-menos',
  '2026-10-31': 'paso-a-paso',
};

const snippetsById = new Map(spanishSnippets.map((snippet) => [snippet.id, snippet]));
export const publishedDays = Object.keys(dailySchedule).sort();

function requireSnippet(id: string): Snippet {
  const snippet = snippetsById.get(id);
  if (!snippet) throw new Error(`Missing Spanish phrase: ${id}`);
  return snippet;
}

export function getDailySnippet(dateKey: string): Snippet {
  if (!isDateKey(dateKey)) throw new Error(`Invalid calendar date: ${dateKey}`);
  const id = dailySchedule[dateKey];
  if (!id) throw new Error(`No Spanish phrase scheduled for ${dateKey}`);
  return requireSnippet(id);
}

export function getAdjacentPublishedDay(dateKey: string, direction: -1 | 1): string | null {
  const index = publishedDays.indexOf(dateKey);
  return index === -1 ? null : publishedDays[index + direction] ?? null;
}

export type DailySelection = {
  dateKey: string;
  snippet: Snippet;
  pinned: boolean;
  message: string;
};

export function resolveDailySelection(
  params: URLSearchParams,
  today = getOsloDateKey(),
): DailySelection {
  const requestedDay = params.get('day');
  const requestedPhrase = params.get('phrase');
  const targetDay = isDateKey(requestedDay) ? requestedDay : today;
  const dateKey = publishedDays.includes(targetDay)
    ? targetDay
    : publishedDays.findLast((day) => day <= targetDay) ?? publishedDays[0];
  if (!dateKey) throw new Error('No Spanish phrases have been scheduled.');
  const pinnedSnippet = requestedPhrase === null ? undefined : snippetsById.get(requestedPhrase);
  const messages: string[] = [];

  if (requestedDay !== null && !isDateKey(requestedDay)) {
    messages.push('That day link is not a valid calendar date. Showing today’s date instead.');
  }
  if (requestedPhrase !== null && !pinnedSnippet) {
    messages.push('That phrase link was not found. Showing the daily phrase instead.');
  }
  if (dateKey !== targetDay) {
    messages.push(requestedDay === null
      ? 'No new phrase is scheduled for today. Showing the closest published field note.'
      : 'No phrase is scheduled for that day. Showing the closest published field note.');
  }

  return {
    dateKey,
    snippet: pinnedSnippet ?? getDailySnippet(dateKey),
    pinned: pinnedSnippet !== undefined,
    message: messages.join(' '),
  };
}

export function createDayUrl(currentUrl: string, dateKey: string, phraseId?: string): URL {
  if (!isDateKey(dateKey)) throw new Error(`Invalid calendar date: ${dateKey}`);
  const url = new URL(currentUrl);
  url.searchParams.set('day', dateKey);
  if (phraseId) {
    requireSnippet(phraseId);
    url.searchParams.set('phrase', phraseId);
  } else {
    url.searchParams.delete('phrase');
  }
  return url;
}
