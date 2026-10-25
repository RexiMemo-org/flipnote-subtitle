"""Read and write frame-timed Flipnote Subtitle files. No dependencies."""
import re

MAX_FILE_BYTES = 1024 * 1024
MAX_PAGE = 2**53 - 1


class FsrtError(ValueError):
    pass


def _normalise(cues, max_page, max_cues):
    if type(max_page) is not int or not 1 <= max_page <= MAX_PAGE or type(max_cues) is not int or max_cues < 1:
        raise FsrtError('Page and subtitle limits must be positive integers.')
    if not isinstance(cues, list) or not cues:
        raise FsrtError('The file has no subtitles.')
    if len(cues) > max_cues:
        raise FsrtError(f'Use no more than {max_cues} subtitles.')
    result = []
    for index, cue in enumerate(cues, 1):
        cue = cue if isinstance(cue, dict) else {}
        start, end, text = cue.get('start'), cue.get('end'), cue.get('text')
        if type(start) is not int or type(end) is not int or not 1 <= start <= end <= min(max_page, MAX_PAGE):
            raise FsrtError(f'Subtitle {index}: choose pages between 1 and {max_page}, with the end on or after the start.')
        if not isinstance(text, str):
            raise FsrtError(f'Subtitle {index}: enter some text.')
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        if not text.strip() or re.search(r'[\x00-\x08\x0b-\x1f\x7f]', text) or any(not line.strip() for line in text.split('\n')):
            raise FsrtError(f'Subtitle {index}: text must not contain blank lines or control characters.')
        result.append({'start': start, 'end': end, 'text': text})
    result.sort(key=lambda cue: (cue['start'], cue['end']))
    if any(b['start'] <= a['end'] for a, b in zip(result, result[1:])):
        raise FsrtError('Two subtitles overlap. End one before the next starts.')
    return result


def _size_check(text):
    try:
        size = len(text.encode('utf-8'))
    except UnicodeEncodeError:
        raise FsrtError('Subtitle text must be valid UTF-8.') from None
    if size > MAX_FILE_BYTES:
        raise FsrtError('The subtitle file must be 1 MiB or smaller.')


def parse(text, *, max_page=MAX_PAGE, max_cues=10000):
    if not isinstance(text, str):
        raise FsrtError('Read the file as UTF-8 text.')
    _size_check(text)
    value = text.removeprefix('\ufeff').replace('\r\n', '\n').replace('\r', '\n')
    value = re.sub(r'^(?:[ \t]*\n)+|(?:\n[ \t]*)+$', '', value)
    if not value.strip():
        raise FsrtError('The file has no subtitles.')
    cues = []
    for index, block in enumerate(re.split(r'\n(?:[ \t]*\n)+', value), 1):
        lines = block.split('\n')
        if not re.fullmatch(r'[ \t]*[0-9]{1,16}[ \t]*', lines[0]) or not 1 <= int(lines[0]) <= MAX_PAGE:
            raise FsrtError(f'Subtitle {index}: put a positive sequence number on the first line.')
        match = re.fullmatch(r'[ \t]*([0-9]{1,16})[ \t]*-->[ \t]*([0-9]{1,16})[ \t]*', lines[1] if len(lines) > 1 else '')
        if not match:
            raise FsrtError(f'Subtitle {index}: use page numbers such as 1 --> 12, instead of timestamps.')
        cues.append({'start': int(match[1]), 'end': int(match[2]), 'text': '\n'.join(lines[2:])})
    return _normalise(cues, max_page, max_cues)


def stringify(cues, *, max_page=MAX_PAGE, max_cues=10000):
    values = _normalise(cues, max_page, max_cues)
    text = '\n\n'.join(f"{index}\n{cue['start']} --> {cue['end']}\n{cue['text']}" for index, cue in enumerate(values, 1)) + '\n'
    _size_check(text)
    return text
