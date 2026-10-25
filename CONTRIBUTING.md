# Contributing

Run both implementations before sending a change:

```sh
node --test tests/fsrt.test.js
python -m unittest discover -s tests
```

`tests/cases.json` is shared by JavaScript and Python. Add accepted and rejected
examples there when changing how files are read. Keep the two implementations
in agreement, including their page limits and Unicode handling.

Changes to the format belong in `SPEC.md`. Please discuss incompatible changes
before implementing them. Font choices, positioning and application upload
limits belong to the player or editor using FSRT.

Bug reports are most useful with a small `.fsrt` file, the expected page range
and the parser error or displayed result. Avoid including private animations
or account details.
