/* Flipnote Subtitle (.fsrt) — https://reximemo.net */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FlipnoteSubtitle = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX_FILE_BYTES = 1024 * 1024;
  const MAX_PAGE = Number.MAX_SAFE_INTEGER;
  class FsrtError extends Error {
    constructor(message) { super(message); this.name = 'FsrtError'; }
  }
  function limits(options = {}) {
    const {maxPage = MAX_PAGE, maxCues = 10000} = options;
    if (!Number.isSafeInteger(maxPage) || maxPage < 1 || !Number.isSafeInteger(maxCues) || maxCues < 1)
      throw new FsrtError('Page and subtitle limits must be positive integers.');
    return {maxPage, maxCues};
  }
  function normalise(cues, options) {
    const {maxPage, maxCues} = limits(options);
    if (!Array.isArray(cues) || !cues.length) throw new FsrtError('The file has no subtitles.');
    if (cues.length > maxCues) throw new FsrtError(`Use no more than ${maxCues} subtitles.`);
    const result = cues.map((cue, index) => {
      const {start, end, text} = cue || {};
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end < start || end > maxPage)
        throw new FsrtError(`Subtitle ${index + 1}: choose pages between 1 and ${maxPage}, with the end on or after the start.`);
      if (typeof text !== 'string') throw new FsrtError(`Subtitle ${index + 1}: enter some text.`);
      const value = text.replace(/\r\n?/g, '\n');
      if (!value.trim() || /[\u0000-\u0008\u000b-\u001f\u007f]/u.test(value) || value.split('\n').some(line => !line.trim()))
        throw new FsrtError(`Subtitle ${index + 1}: text must not contain blank lines or control characters.`);
      return {start, end, text: value};
    }).sort((a, b) => a.start - b.start || a.end - b.end);
    for (let i = 1; i < result.length; i++)
      if (result[i].start <= result[i - 1].end) throw new FsrtError('Two subtitles overlap. End one before the next starts.');
    return result;
  }
  function sizeCheck(text) {
    for (const character of text) {
      const codePoint = character.codePointAt(0);
      if (codePoint >= 0xd800 && codePoint <= 0xdfff)
        throw new FsrtError('Subtitle text must be valid UTF-8.');
    }
    if (new TextEncoder().encode(text).length > MAX_FILE_BYTES) throw new FsrtError('The subtitle file must be 1 MiB or smaller.');
  }
  function parse(text, options) {
    if (typeof text !== 'string') throw new FsrtError('Read the file as UTF-8 text.');
    sizeCheck(text);
    const value = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').replace(/^(?:[ \t]*\n)+|(?:\n[ \t]*)+$/g, '');
    if (!value.trim()) throw new FsrtError('The file has no subtitles.');
    const cues = value.split(/\n(?:[ \t]*\n)+/).map((block, index) => {
      const lines = block.split('\n');
      if (!/^[ \t]*\d{1,16}[ \t]*$/.test(lines[0]) || !Number.isSafeInteger(Number(lines[0])) || Number(lines[0]) < 1)
        throw new FsrtError(`Subtitle ${index + 1}: put a positive sequence number on the first line.`);
      const range = /^[ \t]*(\d{1,16})[ \t]*-->[ \t]*(\d{1,16})[ \t]*$/.exec(lines[1] || '');
      if (!range) throw new FsrtError(`Subtitle ${index + 1}: use page numbers such as 1 --> 12, instead of timestamps.`);
      return {start: Number(range[1]), end: Number(range[2]), text: lines.slice(2).join('\n')};
    });
    return normalise(cues, options);
  }
  function stringify(cues, options) {
    const text = normalise(cues, options).map((cue, i) => `${i + 1}\n${cue.start} --> ${cue.end}\n${cue.text}`).join('\n\n') + '\n';
    sizeCheck(text);
    return text;
  }
  return {parse, stringify, FsrtError, MAX_FILE_BYTES};
});
