# Graffiti bullet marks

Spray-paint marks used as the large bullets in the Automating Unemployment
benefits curtain (section 02).

Save the four Freepik PNGs here with **exactly** these names:

| File | Mark |
|---|---|
| `chevrons.png` | double chevron — black + gold |
| `star.png` | gold star with black outline and paint run |
| `crown-soft.png` | rounded three-peak crown, outline only |
| `crown-spike.png` | spiked crown with looping baseline and drips |

`GraffitiMarks.astro` checks for each file at build time. When a file is
present it is used; when it is missing the component falls back to a
hand-traced vector version of the same mark, so the page never shows a
broken image. Adding or removing a file is the only step — no code change.

The current PNGs are **cut out with real alpha** (verified: transparent
corners, zero opaque-white pixels), so they composite normally over the
`#FFDA00` curtain and the gold keeps its source colour.

If you ever replace these with art on an opaque white ground, pass
`blend="multiply"` to the component — that drops the white out against the
yellow while keeping the black linework solid. Do **not** use multiply with
cut-out art: it multiplies the gold against the yellow and darkens it.

Source: Freepik (free licence — check whether attribution is required for
the way this site ships).
