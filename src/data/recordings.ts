export type Recording = {
  file: string;
  credit: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
};

// Original human recordings, unchanged. Add new recordings with their reuse attribution.
export const recordings: Readonly<Record<string, Recording>> = {
  'que-tal': {
    file: 'que-tal.ogg',
    credit: 'Orgullomoore',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Es-qu%C3%A9_tal.oga',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
  },
  'hasta-luego': {
    file: 'hasta-luego.ogg',
    credit: 'Fibonacci',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Es-hasta_luego.oga',
    license: 'CC BY-SA 2.5',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.5/',
  },
  'mucho-gusto': {
    file: 'mucho-gusto.ogg',
    credit: 'Orgullomoore',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Es-mucho_gusto.oga',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
  },
};

export function getRecordingUrl(recording: Recording, baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, '')}/audio/${recording.file}`;
}
