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
- For a subject similar to an existing sprite (another fish, another ore), pass the
  approved sprite in `reference_images` with a usage note for pose, orientation and scale.
- Ask for the size explicitly when a subject is long ("about 28 pixels long so it fits
  the canvas"). Without it, long subjects come back drawn across two candidates.
- Review candidates with `art/tools/contact-sheet.ps1`, which downloads them into the
  ignored `art/candidates/` folder and builds a numbered sheet. Candidates sometimes come
  back rolled horizontally (the subject wraps around the left and right edges);
  `art/tools/unwrap.ps1` cuts at the widest empty column run and recentres them. Discard
  any candidate that still looks cut after that.
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

## Village scene

The village is the game's hub, seen in first person from the camp, looking out to the horizon
(`web/src/features/village/`). It uses bigger pixels than the item sprites: the scene is 320x180 art
pixels, scaled to the width of the middle column; the space below it holds information blocks.
Three layers, placed in art pixels:

- **Sky** (`village/sky.png`, 384x64): drifts left one art pixel per step in a seamless loop. Generated
  with `create_image_pro`, locked to the six colours of the scene's own sky, then made seamless by
  rolling it half its width and inpainting the join.
- **Scene** (`village/scene.png`, 320x180): the approved sketch ("sketch A": `create_image_pro` with the
  project owner's reference for composition, then `edit_image` for crisper, more detailed props), with
  every sky pixel cut out so the drifting sky shows behind the trees and hills.
- **Campfire**: two pieces that brighten together on hover.
  - `village/campfire.png` (41x32): the stone ring and flames cut out of the scene pixel for pixel, so
    it sits over the painted fire unchanged until the pointer is on it. Cut with a mask: the span between
    the ring's dark outline on each row, plus the flame-coloured pixels above it.
  - `village/fire.png` (8 frames of 64x96): `animate_image` on a crop of the fire and its smoke; each
    frame keeps only the pixels that change.

Motion stops for players who ask for reduced motion. Each piece that reacts to the pointer is cut out
the same way (an exact copy of its pixels, so no repainting), with a hit shape that follows its outline;
it becomes a button once clicking it does something, and changes art as it is rebuilt.

## Asset log

| File | Prompt (short) | Notes |
| --- | --- | --- |
| `actions/pine-tree.png` | a whole pine tree, tall evergreen conifer, short brown trunk | Style base |
| `actions/birch-tree.png` | a whole birch tree, slender white trunk with black markings, rounded light green crown | Style base |
| `items/pine-log.png` | a single short pine log lying on its side, cut end with rings facing the viewer | Style base |
| `items/birch-log.png` | a single short birch log lying on its side, cut end with pale rings facing the viewer | Style base |
| `emblems/woodcutting.png` | a medieval iron hatchet leaning diagonally against a short chopped log | Woodcutting emblem |
| `frames/wood.png` | simple square wooden frame, plain planks, nails at the corners, not too detailed | First frame tier; stretched pixel-exact from 37x38 to 46x48 |
| `emblems/fishing.png` | a medieval wooden fishing rod with a line, leaning diagonally against a small woven wicker fish basket | Candidate 42; Woodcutting emblem as composition reference |
| `emblems/mining.png` | a medieval iron pickaxe with a wooden handle, leaning diagonally against a small grey rock | Candidate 63; Woodcutting emblem as composition reference |
| `actions/perch.png` | a small perch fish leaping out of a little patch of dark blue water with ripples | Candidate 33 |
| `actions/pike.png` | a long slender pike leaping in a gentle arc out of a small patch of dark blue water, whole subject inside the canvas | Candidate 47; `actions/perch.png` as composition reference |
| `actions/stone.png` | a grey stone boulder outcrop with cracks and a little moss at the base | Candidate 31 |
| `actions/copper.png` | a dark grey rock outcrop with chunks of orange-brown copper ore showing through | Candidate 7 |
| `items/perch.png` | a single raw perch lying on its side, head facing left, dark vertical stripes, orange fin | Candidate 4 |
| `items/pike.png` | a small raw pike lying straight and horizontal, head facing left, about 28 px long to fit the canvas | Candidate 8 |
| `items/stone.png` | a single rough-cut grey stone block, chiselled building stone | Candidate 17 |
| `items/copper-ore.png` | a single lump of raw copper ore, dark grey rock with orange-brown and green-tinted chunks | Candidate 8 |


## Open points

- The sprites are not palette-locked yet (the base uses about 160 colours). A fixed
  palette derived from the UI tokens can be passed to `create_image_pro` (`palette`) once
  the set grows.
