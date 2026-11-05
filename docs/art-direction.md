# Art direction

IdleHold uses a hybrid style: **pixel art for world objects** (trade emblems, frames,
action sprites, items) inside a clean "Guild Signboards" UI (see `DESIGN.md`). Text,
buttons, bars and layout are never pixel art.

## The style base

The base of the art is the current set of tree and log sprites. Every new sprite must
look like it belongs next to them.

![Style reference](../art/style-reference.png)

`art/style-reference.png` (128x32) holds, left to right: pine tree, birch tree, pine log,
birch log. It is the style image passed to every generation.

What defines the style:

- **32x32 grid** for every sprite. Frames are the only exception: they wrap a 32x32 opening.
- **Dark single-colour outline**, about one pixel, around the whole silhouette.
- **Soft, painterly shading** with a few tones per material; light from the top left.
- **Muted, earthy colours**: dark greens, warm browns, off-white birch bark. No neon or
  saturated primaries.
- **"A little detailed, not very detailed"**: readable at 1x, with texture (bark, rings,
  needles) but no noise.
- **Transparent background**, the subject centred and filling most of the canvas.
- Objects sit at a slight three-quarter angle; logs lie on their side with the cut end
  facing the viewer.

## How to generate

Tool: PixelLab, `create_image_pro` (one call returns 64 candidates at 32x32 for
10 generations).

- `style_image`: `art/style-reference.png` (upload it with `get_upload_url`).
- `width` / `height`: 32 (frames: 48, then cropped to fit a 32x32 opening).
- `no_background`: true.
- Prompt: name the single subject and its materials, then the role, e.g.
  `a single short oak log lying on its side, ... medieval game inventory item icon`.
  Ask for "not too detailed" when the subject is a low tier.
- Pick the candidate that matches the base best, keep its orientation consistent with
  siblings (for example, every log's cut end on the same side), and record the prompt and
  candidate index in the table below.

## Using sprites in the client

- Files live in `web/src/assets/<kind>/`: `emblems/`, `frames/`, `actions/`, `items/`.
- Render them with `PixelSprite` (`web/src/components/PixelSprite.tsx`): whole-number
  scale only (1x, 2x, 3x) and `image-rendering: pixelated`, so pixels never smear.
- Sprites are decorative (`alt=""`); the name next to them carries the meaning.
- Trade emblems sit in a frame (`TradeEmblem`) over the dark `frame-well` backing. Wood is
  the first frame tier; later tiers (stone, gold, ...) reuse the same 46x48 shape with a
  32x32 opening at (7, 8), so they swap in without layout changes.

## Asset log

| File | Prompt (short) | Notes |
| --- | --- | --- |
| `actions/pine-tree.png` | a whole pine tree, tall evergreen conifer, short brown trunk | Style base |
| `actions/birch-tree.png` | a whole birch tree, slender white trunk with black markings, rounded light green crown | Style base |
| `items/pine-log.png` | a single short pine log lying on its side, cut end with rings facing the viewer | Style base |
| `items/birch-log.png` | a single short birch log lying on its side, cut end with pale rings facing the viewer | Style base |
| `emblems/woodcutting.png` | a medieval iron hatchet leaning diagonally against a short chopped log | Woodcutting emblem |
| `frames/wood.png` | simple square wooden frame, plain planks, nails at the corners, not too detailed | First frame tier; stretched pixel-exact from 37x38 to 46x48 |

## Open points

- Fishing and Mining have no sprites yet: their emblems, actions (perch, pike, stone, copper) and items (perch, pike, stone, copper ore) fall back to Lucide line icons until they are generated against the style base.

- The sprites are not palette-locked yet (the base uses about 160 colours). A fixed
  palette derived from the UI tokens can be passed to `create_image_pro` (`palette`) once
  the set grows.
