#!/bin/sh
# Which edits change a talk's built deck? Run in a talk's directory with a
# clean tree: builds a reference deck, then makes each edit, builds again,
# compares, and restores the tree with `git checkout`.  Usage:
#   sh build_trials.sh <scratch directory>
set -eu
scratch=$1
rm -rf "$scratch/reference" "$scratch/again"
pnpm build --out "$scratch/reference" >/dev/null 2>&1
pnpm build --out "$scratch/again" >/dev/null 2>&1
if diff -rq "$scratch/reference" "$scratch/again" >/dev/null; then
  echo "two builds of the same source: same"
else
  echo "two builds of the same source: DIFFERENT"
fi
trial() {
  name=$1
  shift
  "$@"
  rm -rf "$scratch/trial"
  pnpm build --out "$scratch/trial" >/dev/null 2>&1
  if diff -rq "$scratch/reference" "$scratch/trial" >/dev/null; then
    echo "$name: same"
  else
    echo "$name: DIFFERENT ($(diff -rq "$scratch/reference" "$scratch/trial" | wc -l | tr -d ' ') files)"
  fi
  git checkout -q -- .
}
trial "doc (docs/watch.md)" sh -c 'echo "extra line" >> docs/watch.md'
trial "README" sh -c 'echo "extra" >> README.md'
trial "TS line comment (watch/callouts.ts)" sh -c 'sed -i "1i // trial comment" watch/callouts.ts'
trial "TS doc comment change" sh -c 'sed -i "s/where the slide.s view shows them/where the view shows them/" watch/callouts.ts'
trial "Vue script comment (WatchCallout.vue)" sh -c 'sed -i "s|^// A callout over the watch|// A trial callout over the watch|" components/WatchCallout.vue'
trial "slides.md YAML comment" sh -c 'sed -i "s|^# click 6 is a trial|# click six is a trial|" slides.md'
trial "slides.md HTML comment (not a note)" sh -c 'sed -i "s|^compare with click 5.s plain words.|compare with the plain words of click 5.|" slides.md'
trial "slides.md CSS comment" sh -c 'sed -i "s|less than the \"Before|fewer than the \"Before|" slides.md'
trial "speaker note" sh -c 'sed -i "s|(Trial: the same words as 1960s Batman|(Trial: the same words as 1966 Batman|" slides.md'
