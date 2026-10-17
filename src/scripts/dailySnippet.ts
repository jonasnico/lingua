import { formatDisplayDate, getOsloDateKey } from '../data/languages';
import {
  createDayUrl,
  getAdjacentPublishedDay,
  resolveDailySelection,
  type DailySelection,
} from '../data/dailySelection';
import { getRecordingUrl, recordings } from '../data/recordings';

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing daily snippet element: ${selector}`);
  return element;
}

const elements = {
  date: requireElement<HTMLTimeElement>('[data-snippet-date]'),
  phrase: requireElement<HTMLElement>('[data-snippet-phrase]'),
  pronunciation: requireElement<HTMLElement>('[data-snippet-pronunciation]'),
  region: requireElement<HTMLElement>('[data-snippet-region]'),
  translation: requireElement<HTMLElement>('[data-snippet-translation]'),
  context: requireElement<HTMLElement>('[data-snippet-context]'),
  culturalNote: requireElement<HTMLElement>('[data-snippet-cultural-note]'),
  exampleOriginal: requireElement<HTMLElement>('[data-snippet-example-original]'),
  exampleTranslation: requireElement<HTMLElement>('[data-snippet-example-translation]'),
  audioControl: requireElement<HTMLElement>('[data-audio-control]'),
  listen: requireElement<HTMLButtonElement>('[data-snippet-listen]'),
  listenLabel: requireElement<HTMLElement>('[data-listen-label]'),
  audioHelp: requireElement<HTMLElement>('[data-audio-help]'),
  options: requireElement<HTMLDetailsElement>('[data-options]'),
  optionsToggle: requireElement<HTMLElement>('[data-options] > summary'),
  explore: requireElement<HTMLDetailsElement>('[data-explore]'),
  recall: requireElement<HTMLInputElement>('[data-snippet-recall]'),
  reveal: requireElement<HTMLButtonElement>('[data-snippet-reveal]'),
  revealLabel: requireElement<HTMLElement>('[data-reveal-label]'),
  today: requireElement<HTMLButtonElement>('[data-snippet-today]'),
  previous: requireElement<HTMLAnchorElement>('[data-snippet-previous]'),
  next: requireElement<HTMLAnchorElement>('[data-snippet-next]'),
  permalink: requireElement<HTMLAnchorElement>('[data-snippet-permalink]'),
  status: requireElement<HTMLElement>('[data-snippet-status]'),
  announcement: requireElement<HTMLElement>('[data-snippet-announcement]'),
};

const RECALL_KEY = 'lingua:recall';
let selection = resolveDailySelection(new URLSearchParams(window.location.search));
let practiceMode = true;
let meaningVisible = false;
let copyResetId: number | undefined;
let currentAudio: HTMLAudioElement | null = null;

function setStatus(message: string): void {
  elements.status.textContent = message;
}

function syncMeaning(): void {
  elements.recall.checked = practiceMode;
  elements.revealLabel.hidden = meaningVisible;
  elements.translation.hidden = !meaningVisible;
  elements.exampleTranslation.hidden = !meaningVisible;
  elements.context.hidden = !meaningVisible;
  elements.reveal.setAttribute('aria-expanded', String(meaningVisible));
  elements.reveal.setAttribute('aria-label', meaningVisible
    ? `${selection.snippet.translation}. Hide meaning`
    : 'Show meaning');
}

function syncRecording(): void {
  const recording = recordings[selection.snippet.id];
  elements.audioControl.hidden = !recording;
  if (!recording) {
    elements.audioHelp.textContent = 'A human recording isn’t available for this phrase yet.';
    return;
  }
  const source = document.createElement('a');
  source.href = recording.sourceUrl;
  source.textContent = recording.credit;
  const license = document.createElement('a');
  license.href = recording.licenseUrl;
  license.textContent = recording.license;
  for (const link of [source, license]) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  elements.audioHelp.replaceChildren('Human recording: ', source, ' (', license, ').');
}

function setAudioState(state: 'idle' | 'loading' | 'playing'): void {
  elements.listenLabel.textContent = state === 'idle' ? 'Listen' : state === 'loading' ? 'Loading…' : 'Stop';
  elements.listen.setAttribute('aria-pressed', String(state !== 'idle'));
  elements.listen.setAttribute('aria-busy', String(state === 'loading'));
}

function stopAudio(): void {
  const audio = currentAudio;
  currentAudio = null;
  if (audio) {
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }
  setAudioState('idle');
}

async function playAudio(): Promise<void> {
  if (currentAudio) {
    stopAudio();
    return;
  }
  const recording = recordings[selection.snippet.id];
  if (!recording) {
    setStatus('A human recording isn’t available for this phrase yet.');
    return;
  }
  const audio = new Audio(getRecordingUrl(recording, import.meta.env.BASE_URL));
  currentAudio = audio;
  setAudioState('loading');
  audio.onended = () => {
    if (currentAudio === audio) stopAudio();
  };
  audio.onerror = () => {
    if (currentAudio !== audio) return;
    stopAudio();
    setStatus('The recording couldn’t play. Try Listen again or check the pronunciation in Explore.');
  };
  try {
    await audio.play();
    if (currentAudio === audio) setAudioState('playing');
  } catch (error) {
    if (currentAudio !== audio) return;
    stopAudio();
    const message = error instanceof Error ? error.message : 'Audio playback failed';
    setStatus(`The recording couldn’t play. ${message}`);
  }
}

function syncDayLink(element: HTMLAnchorElement, dateKey: string | null): void {
  if (dateKey) {
    element.href = createDayUrl(window.location.href, dateKey).toString();
    element.removeAttribute('aria-disabled');
    element.removeAttribute('tabindex');
  } else {
    element.removeAttribute('href');
    element.setAttribute('aria-disabled', 'true');
    element.tabIndex = -1;
  }
}

function render(nextSelection: DailySelection, announce = false): void {
  stopAudio();
  window.clearTimeout(copyResetId);
  selection = nextSelection;
  const { snippet, dateKey } = selection;
  meaningVisible = !practiceMode;
  elements.options.open = false;
  elements.explore.open = false;
  elements.date.textContent = formatDisplayDate(dateKey);
  elements.date.dateTime = dateKey;
  elements.phrase.textContent = snippet.phrase;
  elements.pronunciation.textContent = snippet.pronunciation;
  elements.region.textContent = snippet.region ?? '';
  elements.region.hidden = !snippet.region;
  elements.translation.textContent = snippet.translation;
  elements.culturalNote.textContent = snippet.culturalNote;
  elements.exampleOriginal.textContent = snippet.example.original;
  elements.exampleTranslation.textContent = snippet.example.translation;
  syncDayLink(elements.previous, getAdjacentPublishedDay(dateKey, -1));
  syncDayLink(elements.next, getAdjacentPublishedDay(dateKey, 1));
  elements.permalink.href = createDayUrl(window.location.href, dateKey, snippet.id).toString();
  elements.permalink.textContent = 'Copy phrase link';
  if (dateKey === getOsloDateKey()) elements.today.setAttribute('aria-current', 'date');
  else elements.today.removeAttribute('aria-current');
  syncMeaning();
  syncRecording();
  setStatus(selection.message);
  document.title = `${snippet.phrase} — Lingua`;

  if (announce) {
    const spokenPhrase = document.createElement('span');
    spokenPhrase.lang = 'es';
    spokenPhrase.textContent = snippet.phrase;
    elements.announcement.replaceChildren(
      `Showing the Spanish phrase for ${formatDisplayDate(dateKey)}. `,
      spokenPhrase,
      meaningVisible ? '' : ' Meaning hidden.',
    );
  }
}

function renderLocation(announce = false): void {
  render(resolveDailySelection(new URLSearchParams(window.location.search)), announce);
}

function navigate(dateKey: string): void {
  const url = createDayUrl(window.location.href, dateKey);
  if (dateKey === selection.dateKey && !selection.pinned && !selection.message) return;
  if (url.toString() !== window.location.href) window.history.pushState({}, '', url);
  render(resolveDailySelection(url.searchParams), true);
}

function isPlainClick(event: MouseEvent): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

function copyWithTextarea(value: string): boolean {
  const focused = document.activeElement;
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  try {
    textarea.select();
    return document.execCommand('copy');
  } finally {
    textarea.remove();
    if (focused instanceof HTMLElement) focused.focus({ preventScroll: true });
  }
}

async function copyPermalink(): Promise<void> {
  const url = elements.permalink.href;
  let copied = false;
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      copied = true;
    }
  } catch {
    // Clipboard permission can be denied even when the API exists.
  }
  try {
    if (!copied) copied = copyWithTextarea(url);
  } catch {
    copied = false;
  }
  if (!copied) {
    setStatus('Couldn’t copy the link. Use your browser’s “Copy link address” action instead.');
    return;
  }
  elements.permalink.textContent = 'Copied';
  elements.announcement.textContent = 'Phrase link copied.';
  window.clearTimeout(copyResetId);
  copyResetId = window.setTimeout(() => {
    elements.permalink.textContent = 'Copy phrase link';
  }, 2200);
}

for (const [element, direction] of [[elements.previous, -1], [elements.next, 1]] as const) {
  element.addEventListener('click', (event) => {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    const day = getAdjacentPublishedDay(selection.dateKey, direction);
    if (day) navigate(day);
  });
}
elements.today.addEventListener('click', () => navigate(getOsloDateKey()));
elements.listen.addEventListener('click', () => void playAudio());
elements.reveal.addEventListener('click', () => {
  meaningVisible = !meaningVisible;
  syncMeaning();
});
elements.recall.addEventListener('change', () => {
  practiceMode = elements.recall.checked;
  meaningVisible = !practiceMode;
  syncMeaning();
  try {
    window.localStorage.setItem(RECALL_KEY, String(practiceMode));
  } catch {
    setStatus('This browser couldn’t save your practice preference. It will apply only to this visit.');
  }
});
elements.permalink.addEventListener('click', (event) => {
  if (!isPlainClick(event)) return;
  event.preventDefault();
  void copyPermalink();
});
document.addEventListener('click', (event) => {
  if (event.target instanceof Node && !elements.options.contains(event.target)) {
    elements.options.open = false;
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && elements.options.open) {
    elements.options.open = false;
    elements.optionsToggle.focus();
  }
});
window.addEventListener('popstate', () => renderLocation(true));
window.addEventListener('pagehide', stopAudio);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopAudio();
});

let preferenceWarning = '';
try {
  practiceMode = window.localStorage.getItem(RECALL_KEY) !== 'false';
} catch {
  preferenceWarning = 'This browser couldn’t read saved preferences. Practice mode is on for this visit.';
}
render(selection);
elements.reveal.hidden = false;
if (preferenceWarning) setStatus([selection.message, preferenceWarning].filter(Boolean).join(' '));
