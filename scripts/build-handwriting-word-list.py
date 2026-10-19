"""Build the offline word vocabulary from the pinned SCOWL 2020.12.07 archive.

Usage: python scripts/build-handwriting-word-list.py /path/scowl-2020.12.07.tar.gz
The archive is build input only; the browser uses the generated JavaScript.
"""
import hashlib
import json
import pathlib
import re
import sys
import tarfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
archive = pathlib.Path(sys.argv[1])
groups = {str(level): set() for level in (10, 20, 35)}
with tarfile.open(archive) as source:
    for member in source.getmembers():
        match = re.search(r"/final/(english|british|american)-words\.(10|20|35)$", member.name)
        if not match:
            continue
        for word in source.extractfile(member).read().decode("latin1").splitlines():
            if re.fullmatch(r"[a-z]{2,20}", word):
                groups[match[2]].add(word)
    readme = next(m for m in source.getmembers() if m.name.count("/") == 1 and m.name.endswith("/README"))
    license_text = source.extractfile(readme).read().decode("utf8")
seen = set()
for words in groups.values():
    words.difference_update(seen)
    seen.update(words)
data = {
    "version": "scowl-2020.12.07-small",
    "source": "https://wordlist.aspell.net/",
    "archiveSha256": hashlib.sha256(archive.read_bytes()).hexdigest(),
    "count": len(seen),
    "levels": {level: " ".join(sorted(words)) for level, words in groups.items()},
}
(ROOT / "whiteboard-handwriting-word-list-beta.js").write_text(
    "/* Generated offline English vocabulary. Attribution: vendor/handwriting/words/SCOWL-README.txt */\n"
    + "window.WhiteboardHandwritingWordList=" + json.dumps(data, separators=(",", ":")) + ";\n"
)
target = ROOT / "vendor/handwriting/words"
target.mkdir(parents=True, exist_ok=True)
(target / "SCOWL-README.txt").write_text(license_text)
print(json.dumps({"count": len(seen), "levels": {k: len(v) for k, v in groups.items()}, "archiveSha256": data["archiveSha256"]}))
