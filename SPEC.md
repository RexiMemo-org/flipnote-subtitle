# Flipnote Subtitle format, version 1

- File extension: `.fsrt`
- Encoding: UTF-8, with an optional UTF-8 byte order mark at the start
- Line endings: LF or CRLF (readers may also accept CR)

## Cue blocks

A file contains one or more cue blocks, separated by an empty line. A line
containing only spaces or tabs also counts as a separator.

Each block consists of:

1. A positive decimal sequence number.
2. A page range written as `start --> end`.
3. One or more non-empty lines of subtitle text.

Sequence numbers identify blocks for people editing the file. They do not
determine timing. Writers number blocks consecutively from 1; readers may
accept non-consecutive numbers and out-of-order blocks.
Sequence numbers may not exceed 9,007,199,254,740,991.

## Page ranges

Pages are animation frames, numbered from 1. Both ends of a range are included.
`3 --> 3` is valid and appears on page 3 only. Gaps between cues have no subtitle.

`start` and `end` must be positive decimal integers, with `end >= start`.
For compatibility with JavaScript readers, neither may exceed 9,007,199,254,740,991.
Readers must reject overlapping ranges. Adjacent ranges such as `1 --> 4` and
`5 --> 8` do not overlap.

Spaces and tabs around the page numbers and arrow are allowed. There are no
timestamps, frame-rate declarations or cue settings on this line. A reader
must not silently interpret an ordinary SRT timestamp as a page number.

Applications should check that all ranges fit their target Flipnote. Timing
depends on pages, so it follows the Flipnote when its playback speed changes.

## Text

Text is Unicode and is displayed literally. Tags such as `<b>` have no special
meaning. There is no escaping syntax, markup, positioning, font selection or
colour information. Blank lines delimit cues and cannot occur within text.
Leading and trailing spaces on non-empty text lines are preserved.
Text must be valid UTF-8; unpaired UTF-16 surrogates are not valid text.

Tabs are allowed. Other C0 control characters, except line endings, and DEL
are invalid. Applications may restrict characters or line lengths to fit their
fonts and display. They should report unsupported text rather than silently
discard it.

## Languages and media

One file is one language track. Language is not stored inside the file. A
filename can include a language code, for example `animation.ar.fsrt`, but
the importing application must let the user choose the language.
It may present the available files as separately selectable tracks rather
than assigning language codes to them.

An FSRT contains neither the animation nor its audio. It doesn't carry an
author identity, signature, account token or link to a particular PPM. The
user chooses the Flipnote it belongs to.

## Writer output

The reference writers sort cues by starting page, use consecutive sequence
numbers, put one space on each side of `-->`, and emit LF line endings with
one empty line between cues and one final newline. These choices keep diffs
readable; other accepted spacing and line endings remain valid.

## Reference parser limits

The JavaScript and Python implementations limit input and output to 1 MiB
(1,048,576 UTF-8 bytes), with a default maximum of 10,000 cues. These are
resource limits of the reference code, not additional fields in the format.
Applications can set lower page and cue limits. Invalid data must be reported
as an error rather than silently clipped, truncated or interpreted as HTML.
