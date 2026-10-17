import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { getRecordingUrl, recordings } from '../src/data/recordings.ts';
import { spanishSnippets } from '../src/data/snippets/spanish.ts';

test('human recordings have a known phrase, actual Ogg audio, and attribution', () => {
  const ids = new Set(spanishSnippets.map((snippet) => snippet.id));
  assert.equal(Object.keys(recordings).length, 3);
  const attribution = readFileSync(new URL('../public/audio/ATTRIBUTION.txt', import.meta.url), 'utf8');
  for (const [id, recording] of Object.entries(recordings)) {
    assert.ok(ids.has(id));
    assert.match(recording.file, /^[a-z-]+\.ogg$/);
    const audio = readFileSync(new URL(`../public/audio/${recording.file}`, import.meta.url));
    assert.equal(audio.subarray(0, 4).toString(), 'OggS');
    assert.ok(audio.length > 1000);
    assert.ok(recording.credit.trim());
    assert.ok(attribution.includes(recording.file));
    assert.ok(attribution.includes(recording.credit));
    assert.ok(attribution.includes(recording.sourceUrl));
    assert.ok(attribution.includes(recording.licenseUrl));
    assert.equal(new URL(recording.sourceUrl).hostname, 'commons.wikimedia.org');
    assert.match(recording.license, /^CC BY-SA /);
    assert.equal(new URL(recording.licenseUrl).hostname, 'creativecommons.org');
  }
});

test('recording paths work at the root and under the GitHub Pages base', () => {
  const recording = recordings['mucho-gusto'];
  assert.equal(getRecordingUrl(recording, '/lingua'), '/lingua/audio/mucho-gusto.ogg');
  assert.equal(getRecordingUrl(recording, '/lingua/'), '/lingua/audio/mucho-gusto.ogg');
  assert.equal(getRecordingUrl(recording, '/'), '/audio/mucho-gusto.ogg');
});

test('phrases without a recording do not claim to have human audio', () => {
  assert.equal(recordings['aqui-estamos'], undefined);
});
