# John Harrison's pictures

Each picture keeps its own licence (`README.md` at the repo root, "License"). Each is
scaled down, and its metadata is removed. The Same Time, Every Tick slide shows each of the four
clocks whole, and then crops it square in CSS. The Questions slide in `slides.md` credits them.

- `portrait.jpg`: [John Harrison](<https://commons.wikimedia.org/wiki/File:John_Harrison_(Gem%C3%A4lde)_01.jpg>), by Thomas King, c. 1767. Public domain. Its dark tones are lifted: in CIELAB, a gamma of 1.8 on the lightness, then CLAHE (tiles 12% of the image, 128 bins, clip limit 1.5); the colour channels do not change. Then it is scaled to 1080 px tall (JPEG quality 85). Not an oversight: the painting is low-key, not faded, so the Waltham photo's contrast stretch does nothing, and histogram equalization or a stronger gamma bleaches the face. Commons' other scan, `John Harrison (Gemälde).jpg`, is faded and red. The commands and the other variants are in `tasks/2026-11-12-harrison-portrait/`.
- `h1.jpg`: [H1](<https://commons.wikimedia.org/wiki/File:Clock_at_Royal_Observatory_Greenwich_(32416544837).jpg>), by Mike Prince, 2017. [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).
- `h2.jpg`: [H2](<https://commons.wikimedia.org/wiki/File:Clock_at_Royal_Observatory_Greenwich_(46635402754).jpg>), by Mike Prince. [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).
- `h3.jpg`: [H3](<https://commons.wikimedia.org/wiki/File:Harrison_H3_Clock_(35491292866).jpg>), by Tony Hisgett, 2017. [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).
- `h4.jpg`: [H4's movement](<https://commons.wikimedia.org/wiki/File:Clock_at_Royal_Observatory_Greenwich_(32416554787).jpg>), by Mike Prince. [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).
