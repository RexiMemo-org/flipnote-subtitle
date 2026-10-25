const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {parse, stringify, FsrtError, MAX_FILE_BYTES} = require('../fsrt.js');
const cases = require('./cases.json');

for (const item of cases.valid) test(item.name, () => {
  const cues = parse(item.input);
  assert.deepEqual(cues, item.cues);
  assert.deepEqual(parse(stringify(cues)), cues);
});
for (const item of cases.invalid) test(`reject ${item.name}`, () => {
  const options = {};
  if (item.maxPage) options.maxPage = item.maxPage;
  if (item.maxCues) options.maxCues = item.maxCues;
  assert.throws(() => parse(item.input, options), FsrtError);
});
test('all examples round-trip without changing their text', () => {
  for (const file of fs.readdirSync(path.join(__dirname, '../examples'))) {
    const text = fs.readFileSync(path.join(__dirname, '../examples', file), 'utf8');
    assert.deepEqual(parse(stringify(parse(text))), parse(text));
  }
});
test('reject oversized files and invalid exported ranges or blank lines', () => {
  assert.throws(() => parse('a'.repeat(MAX_FILE_BYTES + 1)), FsrtError);
  for (const cues of [[], [{start: 0, end: 1, text: 'Hi'}], [{start: 1, end: 2, text: 'Hi\n\nBye'}]])
    assert.throws(() => stringify(cues), FsrtError);
});

test('UTF-8 byte limits and malformed Unicode apply to exports too', () => {
  assert.throws(() => parse('1\n1 --> 1\n' + 'あ'.repeat(Math.ceil(MAX_FILE_BYTES / 3))), FsrtError);
  assert.throws(() => stringify([{start: 1, end: 1, text: '\ud800'}]), FsrtError);
  assert.throws(() => stringify([{start: 1, end: 1, text: '\udfff'}]), FsrtError);
  assert.throws(() => parse('1\n1 --> 1\nHello', {maxPage: Number.MAX_SAFE_INTEGER + 1}), FsrtError);
});

test('the same file exposes its API directly in a browser', () => {
  const browser = {TextEncoder};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../fsrt.js'), 'utf8'), browser);
  const input = '1\n1 --> 3\nこんにちは！ مرحبا 😀\n';
  const cues = browser.FlipnoteSubtitle.parse(input);
  assert.equal(cues[0].start, 1);
  assert.equal(cues[0].text, 'こんにちは！ مرحبا 😀');
  assert.equal(browser.FlipnoteSubtitle.stringify(cues), input);
});
