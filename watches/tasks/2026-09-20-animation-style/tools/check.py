#!/usr/bin/env python3
"""Structural checks across every drawing set. Stdlib only.

    .venv/bin/python3 tasks/2026-09-20-animation-style/tools/check.py

These are the failures that actually happened during the work, in the order they
bit us. All are invisible in a thumbnail and obvious in a diff, which is why they
are asserted rather than eyeballed:

  * malformed colour tokens  -- a corrupted stop-color rendered as black, silently
  * duplicate ids            -- second definition wins, animation targets the wrong node
  * dangling url(#...) refs  -- clip silently does nothing, so the clip has no effect
  * not well-formed XML      -- a duplicated attribute made one file non-parsing
  * draw order               -- the hourglass stream must be painted BEFORE the pile,
                                or the falling sand floats over the heap it lands in
  * burn sync                -- the candle's clip travel must equal the group's
                                translate, or the shaft pokes out above the melt
"""
import re, pathlib, xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[3]
# The art these tools read. Until 2026-09-21 this was the project root's
# public/timekeepers/, which held all sixteen sets because the live deck showed all
# sixteen. The live deck now ships one set, so the sets live in this archive's own
# deck/ and the tools read them from there -- which is also what makes the archive
# runnable after the live deck has moved on. See README S14.
ART = pathlib.Path(__file__).resolve().parents[1] / "deck/public/timekeepers"

SETS = ART
HEX = re.compile(r"^#[0-9A-Fa-f]{6}$")
SUBJECTS = ["sundial", "water-clock", "candle", "hourglass"]


def check_set(d: pathlib.Path):
    problems = []
    for name in SUBJECTS:
        f = d / f"{name}.svg"
        if not f.exists():
            problems.append(f"{d.name}/{name}.svg missing")
            continue
        raw = f.read_text()
        try:
            root = ET.fromstring(raw)
        except ET.ParseError as e:
            problems.append(f"{d.name}/{name}.svg not well-formed: {e}")
            continue
        ids = [e.attrib["id"] for e in root.iter() if "id" in e.attrib]
        for i in {i for i in ids if ids.count(i) > 1}:
            problems.append(f"{d.name}/{name}.svg duplicate id {i!r}")
        for i in set(re.findall(r"url\(#([^)]+)\)", raw)) - set(ids):
            problems.append(f"{d.name}/{name}.svg dangling ref url(#{i})")
        for el in root.iter():
            for attr in ("fill", "stroke", "stop-color"):
                v = el.attrib.get(attr)
                if v and v != "none" and not v.startswith("url(") and not HEX.match(v):
                    problems.append(f"{d.name}/{name}.svg bad {attr}={v!r}")
    # --- the falling sand must never appear ON TOP of the heap it lands in.
    # Two legitimate mechanisms, and the check accepts either:
    #   (a) paint the stream BEFORE the pile, so the pile occludes it  (10 sets)
    #   (b) paint it after but clip it to above the pile top           (engraved, patent)
    # (b) exists because those two draw sand as a stipple under a paper-coloured
    # knockout mask; painting the stream first would bury it under that mask.
    skipped = []
    hg = d / "hourglass.svg"
    if hg.exists():
        raw = hg.read_text()
        body = raw.find("</defs>") + 1
        stream = min((i for i in (raw.find('y1="96"', body), raw.find('y="96"', body)) if i > 0), default=-1)
        pile = min((i for i in (raw.find("172 L150 172", body),
                                raw.find("172 L152 172", body)) if i > 0), default=-1)
        clipped_above = bool(re.search(r'clipPath id="[^"]*above', raw))
        if clipped_above:
            pass                                   # mechanism (b)
        elif stream < 0 or pile < 0:
            skipped.append(f"{d.name}/hourglass.svg draw order (no resolvable stream/pile markers)")
        elif stream > pile:
            problems.append(f"{d.name}/hourglass.svg stream painted over the pile")

    # --- burn sync: the clip's travel must equal the group's translate, or the
    # candle shaft pokes out above the melting top. Values differ per set, so
    # compare the distances rather than hard-coding either.
    cd = d / "candle.svg"
    if cd.exists():
        raw = cd.read_text()
        clip = re.search(r'values="(\d+);(\d+)"\s+dur="12s"', raw)
        grp = re.search(r'values="0 0;0 (\d+)"', raw)
        if not (clip and grp):
            skipped.append(f"{d.name}/candle.svg burn sync (no 12s clip + translate pair)")
        else:
            travel = int(clip.group(2)) - int(clip.group(1))
            if travel != int(grp.group(1)):
                problems.append(f"{d.name}/candle.svg burn clip travels {travel}, group translates {grp.group(1)}")
    return problems, skipped


def main():
    dirs = sorted(p for p in SETS.iterdir() if p.is_dir())
    bad = 0
    skips = []
    for d in dirs:
        problems, skipped = check_set(d)
        skips.extend(skipped)
        total = sum((d / f"{n}.svg").stat().st_size for n in SUBJECTS if (d / f"{n}.svg").exists())
        status = "ok" if not problems else f"{len(problems)} PROBLEM(S)"
        print(f"{d.name:15} {total/1024:6.1f} KB  {status}")
        for p in problems:
            print(f"    {p}")
        bad += len(problems)
    print("\nAll sets clean." if not bad else f"\n{bad} problem(s).")
    if skips:
        print(f"{len(skips)} check(s) SKIPPED -- not verified, not passed:")
        for s_ in skips:
            print(f"    {s_}")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
