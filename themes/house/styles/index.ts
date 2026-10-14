// Slidev loads this file on every slide of a deck that uses `theme: house`.
// Every palette's rule is loaded, so that any slide can show any palette
// with `class: palette-<name>`. The talk's own palette is the one whose
// addon it loads: that addon puts its class on <html>
// (stem/docs/theme.md, "Palettes").
import "@slidev/client/styles/layouts-base.css";
import "./fonts.css";
import "./house.css";

import.meta.glob("../../palettes/*/palette.css", { eager: true });
