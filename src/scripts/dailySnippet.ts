import {
  addDays,
  formatDisplayDate,
  getOsloDateKey,
  getSnippetIndex,
  isDateKey,
  type Snippet,
} from '../data/languages';
import { spanishSnippets } from '../data/snippets/spanish';

const snippetsByLanguage = {
  es: spanishSnippets,
} satisfies Record<string, Snippet[]>;

const params = new URLSearchParams(window.location.search);
const initialDate = isDateKey(params.get('day')) ? params.get('day') : getOsloDateKey();

const state = {
  language: 'es' as const,
  dateKey: initialDate ?? getOsloDateKey(),
};

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing daily snippet element: ${selector}`);
  }

  return element;
}

const elements = {
  card: requireElement<HTMLElement>('[data-snippet-card]'),
  date: requireElement<HTMLElement>('[data-snippet-date]'),
  phrase: requireElement<HTMLElement>('[data-snippet-phrase]'),
  pronunciation: requireElement<HTMLElement>('[data-snippet-pronunciation]'),
  translation: requireElement<HTMLElement>('[data-snippet-translation]'),
  culturalNote: requireElement<HTMLElement>('[data-snippet-cultural-note]'),
  exampleOriginal: requireElement<HTMLElement>('[data-snippet-example-original]'),
  exampleTranslation: requireElement<HTMLElement>('[data-snippet-example-translation]'),
  today: requireElement<HTMLButtonElement>('[data-snippet-today]'),
  previous: requireElement<HTMLAnchorElement>('[data-snippet-previous]'),
  next: requireElement<HTMLAnchorElement>('[data-snippet-next]'),
  permalink: requireElement<HTMLAnchorElement>('[data-snippet-permalink]'),
  status: requireElement<HTMLElement>('[data-snippet-status]'),
};

let statusResetId: number | undefined;

function getSnippet(dateKey: string): Snippet | undefined {
  const snippets = snippetsByLanguage[state.language];

  if (snippets.length === 0) {
    return undefined;
  }

  return snippets[getSnippetIndex(dateKey, snippets.length)];
}

function setStatus(message: string): void {
  if (statusResetId !== undefined) {
    window.clearTimeout(statusResetId);
    statusResetId = undefined;
  }

  elements.status.textContent = message;
  elements.status.classList.toggle('is-visible', message.length > 0);
}

function scheduleStatusReset(): void {
  statusResetId = window.setTimeout(() => {
    elements.status.textContent = '';
    elements.status.classList.remove('is-visible');
    statusResetId = undefined;
  }, 2200);
}

function getPermalinkUrl(dateKey: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set('day', dateKey);
  return url.toString();
}

function copyWithTextarea(value: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.inset = '0 auto auto 0';
  textarea.style.opacity = '0';

  document.body.append(textarea);
  textarea.select();
  const didCopy = document.execCommand('copy');
  textarea.remove();

  return didCopy;
}

async function copyPermalink(): Promise<void> {
  const url = getPermalinkUrl(state.dateKey);

  if (navigator.clipboard) {
    await navigator.clipboard.writeText(url);
    setStatus('Copied day link.');
    scheduleStatusReset();
    return;
  }

  if (copyWithTextarea(url)) {
    setStatus('Copied day link.');
    scheduleStatusReset();
    return;
  }

  setStatus('Could not copy automatically. Open the day link and copy it from the address bar.');
}

function syncUrl(dateKey: string): void {
  const today = getOsloDateKey();
  const url = new URL(window.location.href);

  if (dateKey === today) {
    url.searchParams.delete('day');
  } else {
    url.searchParams.set('day', dateKey);
  }

  window.history.replaceState({}, '', url);
}

function render(dateKey: string): void {
  if (!isDateKey(dateKey)) {
    setStatus('That day link is not a valid calendar date. Today’s field note is showing instead.');
    render(getOsloDateKey());
    return;
  }

  const snippet = getSnippet(dateKey);
  const previousDay = addDays(dateKey, -1);
  const nextDay = addDays(dateKey, 1);

  if (!snippet) {
    setStatus('No Spanish field notes are available yet. Add snippets to the typed content file.');
    return;
  }

  state.dateKey = dateKey;

  elements.card.classList.add('is-refreshing');
  elements.card.dataset.mood = snippet.mood;
  elements.date.textContent = formatDisplayDate(dateKey);
  elements.phrase.textContent = snippet.phrase;
  elements.pronunciation.textContent = snippet.pronunciation;
  elements.translation.textContent = snippet.translation;
  elements.culturalNote.textContent = snippet.culturalNote;
  elements.exampleOriginal.textContent = snippet.example.original;
  elements.exampleTranslation.textContent = snippet.example.translation;
  elements.previous.href = `?day=${previousDay}`;
  elements.next.href = `?day=${nextDay}`;
  elements.permalink.href = `?day=${dateKey}`;

  window.setTimeout(() => elements.card.classList.remove('is-refreshing'), 220);
  setStatus('');
  syncUrl(dateKey);
}

elements.previous.addEventListener('click', (event) => {
  event.preventDefault();
  render(addDays(state.dateKey, -1));
});

elements.next.addEventListener('click', (event) => {
  event.preventDefault();
  render(addDays(state.dateKey, 1));
});

elements.today.addEventListener('click', () => render(getOsloDateKey()));

elements.permalink.addEventListener('click', (event) => {
  event.preventDefault();
  void copyPermalink().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown clipboard error';
    setStatus(`Could not copy automatically. ${message}`);
  });
});

render(state.dateKey);
