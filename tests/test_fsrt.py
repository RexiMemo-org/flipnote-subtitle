import json
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fsrt import FsrtError, MAX_FILE_BYTES, parse, stringify

ROOT = Path(__file__).resolve().parents[1]
CASES = json.loads((ROOT / 'tests/cases.json').read_text(encoding='utf-8'))


class FsrtTests(unittest.TestCase):
    def test_valid_cases_round_trip(self):
        for item in CASES['valid']:
            with self.subTest(item['name']):
                cues = parse(item['input'])
                self.assertEqual(cues, item['cues'])
                self.assertEqual(parse(stringify(cues)), cues)

    def test_invalid_cases(self):
        for item in CASES['invalid']:
            with self.subTest(item['name']):
                options = {key: item[source] for source, key in [('maxPage', 'max_page'), ('maxCues', 'max_cues')] if source in item}
                with self.assertRaises(FsrtError):
                    parse(item['input'], **options)

    def test_examples(self):
        for file in (ROOT / 'examples').glob('*.fsrt'):
            cues = parse(file.read_text(encoding='utf-8'))
            self.assertEqual(parse(stringify(cues)), cues)

    def test_invalid_export_and_oversized_files(self):
        with self.assertRaises(FsrtError):
            parse('a' * (MAX_FILE_BYTES + 1))
        for cues in [[], [{'start': 0, 'end': 1, 'text': 'Hi'}], [{'start': 1, 'end': 2, 'text': 'Hi\n\nBye'}]]:
            with self.assertRaises(FsrtError):
                stringify(cues)

    def test_utf8_byte_limits_and_malformed_unicode_apply_to_exports(self):
        with self.assertRaises(FsrtError):
            parse('1\n1 --> 1\n' + 'あ' * (MAX_FILE_BYTES // 3 + 1))
        for text in ('\ud800', '\udfff'):
            with self.subTest(text=repr(text)), self.assertRaises(FsrtError):
                stringify([{'start': 1, 'end': 1, 'text': text}])
        with self.assertRaises(FsrtError):
            parse('1\n1 --> 1\nHello', max_page=2**53)


if __name__ == '__main__':
    unittest.main()
