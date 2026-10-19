"""Recover all labelled UJI V1 characters for reproducible word simulations.

These fixtures are evaluation input, never handwriting training data.
Usage: python scripts/prepare-handwriting-word-fixtures.py /path/uji-v1.zip
"""
import gzip
import hashlib
import json
import pathlib
import re
import sys
import zipfile

archive = pathlib.Path(sys.argv[1])
samples = {}
with zipfile.ZipFile(archive) as source:
    for name in sorted(source.namelist()):
        match = re.fullmatch(r"UJIpenchars-w(\d+)", name)
        if not match:
            continue
        writer = str(int(match[1]))
        samples[writer] = {}
        current = None
        part = None
        for line in source.read(name).decode("latin1").splitlines():
            label = re.match(r'\.SEGMENT CHARACTER \d+(?:-\d+)? \? "(.)"', line)
            if label:
                current = []
                samples[writer].setdefault(label[1], []).append(current)
            elif line == ".PEN_DOWN":
                part = []
                current.append(part)
            elif line == ".PEN_UP":
                part = None
            elif part is not None and re.fullmatch(r"\s*-?\d+\s+-?\d+\s*", line):
                point = list(map(int, line.split()))
                if not part or point != part[-1]:
                    part.append(point)
        assert len(samples[writer]) == 62
        assert all(len(reps) == 2 for reps in samples[writer].values())
result = {"source": "UJI Pen Characters V1, https://doi.org/10.24432/C5731G",
          "license": "CC BY 4.0; D. Llorens, F. Prat, A. Marzal and J. M. Vilar",
          "archiveSha256": hashlib.sha256(archive.read_bytes()).hexdigest(),
          "processing": "Removed consecutive duplicate points; otherwise original isolated glyphs. Not naturally written words.",
          "samples": samples}
path = pathlib.Path(__file__).resolve().parent / "handwriting-uji-word-fixtures.json.gz"
path.write_bytes(gzip.compress((json.dumps(result, separators=(",", ":")) + "\n").encode(), mtime=0))
print(json.dumps({"writers": len(samples), "characters": 1364, "bytes": path.stat().st_size}))
