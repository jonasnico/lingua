import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createDayUrl,
  dailySchedule,
  getAdjacentPublishedDay,
  getDailySnippet,
  publishedDays,
  resolveDailySelection,
} from '../src/data/dailySelection.ts';
import { getOsloDateKey, isDateKey } from '../src/data/languages.ts';
import { spanishSnippets } from '../src/data/snippets/spanish.ts';

test('the expanded collection has complete, unique content for every scheduled day', () => {
  const ids = spanishSnippets.map((snippet) => snippet.id);
  assert.ok(ids.length >= 28);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(publishedDays.length, ids.length);
  assert.equal(new Set(Object.values(dailySchedule)).size, ids.length);
  for (const day of publishedDays) {
    assert.ok(isDateKey(day));
    const snippet = getDailySnippet(day);
    for (const value of [
      snippet.id, snippet.phrase, snippet.pronunciation, snippet.translation,
      snippet.culturalNote, snippet.example.original, snippet.example.translation, snippet.mood,
    ]) assert.ok(value.trim());
  }
});

test('published date assignments are explicit and independent of collection order', () => {
  assert.equal(getDailySnippet('2026-10-17').id, 'aqui-estamos');
  assert.equal(getDailySnippet('2026-10-18').id, 'mucho-gusto');
  assert.equal(getDailySnippet('2026-10-31').id, 'paso-a-paso');
  assert.throws(() => getDailySnippet('2026-11-01'), /No Spanish phrase scheduled/);
  assert.throws(() => getDailySnippet('2026-02-30'), /Invalid calendar date/);
});

test('navigation stops at the collection edges', () => {
  assert.equal(getAdjacentPublishedDay(publishedDays[0], -1), null);
  assert.equal(getAdjacentPublishedDay(publishedDays[publishedDays.length - 1], 1), null);
  assert.equal(getAdjacentPublishedDay('2026-10-17', 1), '2026-10-18');
  assert.equal(getAdjacentPublishedDay('2026-10-17', -1), '2026-10-16');
  assert.equal(getAdjacentPublishedDay('2026-11-01', -1), null);
});

test('valid links and today select their assigned phrase', () => {
  const today = resolveDailySelection(new URLSearchParams(), '2026-10-17');
  assert.equal(today.dateKey, '2026-10-17');
  assert.equal(today.snippet.id, 'aqui-estamos');
  assert.equal(today.message, '');
  const linked = resolveDailySelection(new URLSearchParams('day=2026-10-19'), '2026-10-17');
  assert.equal(linked.snippet.id, 'con-permiso');
});

test('invalid and unscheduled dates show an explicit recovery message', () => {
  const invalid = resolveDailySelection(new URLSearchParams('day=2026-02-30'), '2026-10-17');
  assert.equal(invalid.dateKey, '2026-10-17');
  assert.match(invalid.message, /not a valid calendar date/);
  const future = resolveDailySelection(new URLSearchParams(), '2026-11-02');
  assert.equal(future.dateKey, '2026-10-31');
  assert.match(future.message, /No new phrase is scheduled for today/);
  const early = resolveDailySelection(new URLSearchParams('day=0000-01-01'), '2026-10-17');
  assert.equal(early.dateKey, '2026-10-04');
  assert.match(early.message, /No phrase is scheduled for that day/);
});

test('phrase links pin content, while day navigation removes the pin', () => {
  const url = createDayUrl('https://example.com/lingua/?source=friend#note', '2026-10-18', 'vale');
  assert.equal(url.pathname, '/lingua/');
  assert.equal(url.searchParams.get('source'), 'friend');
  assert.equal(url.hash, '#note');
  const pinned = resolveDailySelection(url.searchParams, '2026-10-17');
  assert.equal(pinned.dateKey, '2026-10-18');
  assert.equal(pinned.snippet.id, 'vale');
  assert.equal(pinned.pinned, true);
  const next = createDayUrl(url.toString(), '2026-10-19');
  assert.equal(next.searchParams.has('phrase'), false);
  assert.equal(resolveDailySelection(next.searchParams).snippet.id, 'con-permiso');
  assert.throws(() => createDayUrl(url.toString(), 'bad'), /Invalid calendar date/);
  assert.throws(() => createDayUrl(url.toString(), '2026-10-18', 'missing'), /Missing Spanish phrase/);
});

test('unknown phrase IDs recover visibly without ignoring a valid date', () => {
  const result = resolveDailySelection(new URLSearchParams('day=2026-10-18&phrase=missing'));
  assert.equal(result.snippet.id, 'mucho-gusto');
  assert.equal(result.pinned, false);
  assert.match(result.message, /phrase link was not found/);
});

test('calendar validation and Oslo midnight account for leap days and daylight saving', () => {
  assert.equal(isDateKey('2028-02-29'), true);
  assert.equal(isDateKey('2026-02-29'), false);
  assert.equal(isDateKey(null), false);
  assert.equal(isDateKey('2026-1-01'), false);
  assert.equal(getOsloDateKey(new Date('2026-07-01T22:30:00Z')), '2026-07-02');
  assert.equal(getOsloDateKey(new Date('2026-12-01T22:30:00Z')), '2026-12-01');
});
