# Flipnote Subtitle (.fsrt)

Subtitles timed to Flipnote pages, rather than seconds.

```text
1
1 --> 12
Hello!

2
18 --> 30
Thanks for watching.
See you next time!
```

FSRT uses the same numbered blocks as a basic SRT file, with page ranges in
place of timestamps. Pages start at 1, and both ends are included:
`12 --> 12` displays a subtitle for one page. A gap between ranges has no text.
Changing playback speed doesn't change which drawings have subtitles.

Save files as UTF-8 with the `.fsrt` extension. Each file is one language track.
Names such as `my-flipnote.en.fsrt` and `my-flipnote.ar.fsrt` help people tell
tracks apart, but language codes are not part of the file format.

An FSRT contains text and page ranges. It contains no animation, audio,
account details or author signature, and it doesn't change the original
Flipnote. It can be used with PPM or KWZ animations.

## JavaScript

No dependencies are needed. Use Node.js 18 or later:

```js
const fs = require('node:fs');
const {parse, stringify} = require('./fsrt.js');

const cues = parse(fs.readFileSync('examples/english.fsrt', 'utf8'));
fs.writeFileSync('copy.fsrt', stringify(cues));
```

For browser use, load `fsrt.js` with a script tag:

```html
<script src="fsrt.js"></script>
<script>
  const cues = FlipnoteSubtitle.parse('1\n1 --> 12\nHello!\n');
  console.log(cues[0]); // {start: 1, end: 12, text: 'Hello!'}
</script>
```

Both functions accept optional `{maxPage: 999, maxCues: 200}` limits. Catch
`FsrtError` to show a readable message for an invalid file or range.

## Python

Use Python 3.9 or later. Copy `fsrt.py` into your project:

```python
from pathlib import Path
from fsrt import parse, stringify

cues = parse(Path('examples/english.fsrt').read_text(encoding='utf-8-sig'))
Path('copy.fsrt').write_text(stringify(cues), encoding='utf-8')
```

The optional keyword arguments are `max_page` and `max_cues`. Parser and
validation errors raise `FsrtError`, a subclass of `ValueError`.

## Playing a track

Each parser returns objects or dictionaries with `start`, `end` and `text`
fields, sorted by starting page. If your player reports zero-based frame
indices, add 1 before comparing them with a cue's inclusive range:

```js
const page = player.currentFrame + 1;
const cue = cues.find(cue => cue.start <= page && page <= cue.end);
caption.textContent = cue ? cue.text : '';
```

Render the text literally, including line breaks. Do not put it into
`innerHTML`: `<b>` and similar strings are subtitle text, not formatting.
Fonts, placement and language selection are the player's responsibility.

Readers reject overlapping cues, reversed or out-of-range pages, blank text
and invalid control characters. The reference code accepts UTF-8 BOMs and
common line endings, and limits files to 1 MiB and 10,000 cues by default.
The [specification](SPEC.md) defines the format; individual applications may
apply stricter limits.

## Using it on RexiMemo

See [the RexiMemo instructions](docs/reximemo.md) for importing and exporting
tracks through Manage Flipnote. Those application limits do not restrict the
FSRT format itself.

## Tests

```sh
node --test tests/fsrt.test.js
python -m unittest discover -s tests
```

The two implementations use the same [conformance cases](tests/cases.json).
The [examples](examples/) include English, Japanese and Arabic tracks.

## Licence

[MIT](LICENSE). The format and reference code are maintained by RexiMemo.
