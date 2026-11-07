# IdleHold game design

A living document of ideas. Nothing here is committed until it is moved to "Decided". Each idea carries a status:

- **Decided**: agreed and ready to build.
- **Next**: likely the next thing to design in detail.
- **Later**: wanted, with dependencies that come first.
- **Someday**: worth keeping, far away.
- **Open**: needs a discussion before anything else.

## Vision

You manage a small village. Your old home was attacked and lost, and you start over somewhere new with almost nothing. At first you do everything yourself. Over time you rebuild, unlock villagers who take on work, and the village grows into a hold.

The game is idle: the village keeps working while you are away. Being present still has to matter, through decisions and moments that reward attention, not only through faster numbers (see the design pillar in `CLAUDE.md`).

## Core loop

```
gather raw resources  →  process them into goods  →  build and upgrade the village
        ↑                                                         │
        └──────────── villagers unlock and take on work ←─────────┘
```

1. **Gather**: chop wood, mine, fish.
2. **Process**: cook, smelt and smith, work leather.
3. **Build**: spend goods on buildings that unlock skills, villagers and bonuses.
4. **Delegate**: villagers work skills in parallel, so the village does more than one thing at once.
5. **Expand**: new areas, harder content, eventually combat and other players.

The village is the differentiator. Skills feed the village; the village gives skills a purpose.

## Systems

### Gathering skills: Decided

Three gathering skills exist, each with a quick starter action and a slower one that pays more XP per second:

| Skill | Actions | Item |
|---|---|---|
| Woodcutting | Pine (3 s, 10 XP), Birch (5 s, 18 XP) | Pine log, Birch log |
| Fishing | Perch (4 s, 12 XP), Pike (7 s, 28 XP) | Perch, Pike |
| Mining | Stone (3 s, 9 XP), Copper (6 s, 22 XP) | Stone, Copper ore |

Wood and stone are the village's building materials; fish feeds Cooking; copper feeds Smithing. A content test keeps the rule that a slower action never pays less XP per second. Level gates on the slower actions are not in yet.

Note on originality: Melvor Idle already has a village skill (Township). Here the village is not one skill among many; the skills exist to serve the village.

### Bare hands and tools: Decided

The player starts with nothing, not even an axe. Some trades have something you can gather by hand; the rest stay closed until the player owns the right tool.

| Skill | By hand | Item | Needs a tool for the rest |
|---|---|---|---|
| Woodcutting | Gather twigs | Twig | Axe for trees |
| Mining | Pick up pebbles | Pebble | Pickaxe for the quarry and ore |
| Foraging (new) | Pick wild berries | Wild berry (the first food) | Later content: mushrooms, herbs, seeds |
| Fishing | Nothing | | Closed until the player has a fishing rod |

- **Foraging** is a skill of its own, not a tutorial step: its finds feed Cooking later, and planting may grow out of it (possibly as a separate Farming skill).
- **Crafting** is a skill that turns materials into things, starting with the first tools. It is how the player gets from bare hands to the axe, the pickaxe and the rod.
- A pebble is not the quarry's stone: pebbles are picked up by hand, stone is mined with a pickaxe.

Open: the exact recipes (does the crude axe need a binding, and where does it come from?), how tools act (gate only, or gate plus speed), and the numbers (see Progression and balancing).

### Processing skills: Next

Cooking, Smithing (smelting ore into bars, bars into tools), Leatherworking. These need two engine features that do not exist yet:

- **An item catalog**: real items with names and categories instead of string ids.
- **Recipes that consume inputs**: an action that takes items from the stores and stops cleanly when inputs run out, including while the player is away.

### The village: Later (core)

Buildings cost goods and give something back: unlock a skill, unlock a villager, raise storage, add a passive bonus. This is the main long-term sink for resources and the visual centre of the game.

Decided: the village is a scene you look at and the home screen (the hub), seen in first person from the camp looking out to the horizon. It starts as a campfire among the ruins of the old village, with the forest behind. The village has a name ("Idle Road" for now; the player will choose it later); how it is shown is not decided. Its pieces will be animated over time.

Open: how buildings appear in the scene, and whether it is also a list of buildings.

### Villagers: Later (core)

Villagers are unlocked through the village and story. Each one can be assigned to a skill and works it alongside the player.

This is the strongest candidate for the "reward active play" pillar, because assignment is a real decision: who works where, what to stockpile, what to build next. It also changes the engine: today the player has a single active action; villagers mean several activities ticking at once.

Open: do villagers have traits, needs (food from Cooking) or morale? Each adds depth and also complexity.

### Onboarding and story: Later

A short story opening: a character welcomes you to the new place, explains what happened to your village, and walks you through the first actions. After that, the tutorial is contextual hints tied to real progress ("You have enough logs to build a shed").

Best written once two or three skills and the first building exist, so it teaches the real game rather than a placeholder.

### Progression and balancing: Next

- Level curve per skill (exists: levels 1–99, growing XP per level).
- Unlocks gated by level (better trees, ores, recipes).
- Pacing targets: how long the first level-up, the first building and the first villager should take.

Engineering note: the engine is pure, so a small simulation tool can answer "how long does level 30 take with this content?" before anyone plays. Balance should be data in content files, tuned without code changes.

### Achievements: Later

A table of goals across skills, the village and story. Cheap to build once there is enough content to point at, and a good place to reward exploration rather than grinding.

### Combat and dungeons: Someday

Gather gear and food, form a party (likely villagers), run a dungeon to fight creatures for items. Raids on larger villages later. This is a whole second game; it should wait until the village and skills are fun on their own.

Open: is combat idle (simulated runs) or actively played?

### Market between players: Someday

A shared market for trading goods. Requires accounts, persistent saves, an economy that resists inflation and duplication, and moderation. The server-authoritative engine already makes cheating harder, which is what a player economy needs.

## Proposed order

1. **Content as data**: item and skill catalogs in content files, validated on load.
2. ~~**Mining and Fishing**~~: done (see Gathering skills).
3. **Recipes**: the first processing skill (Cooking or Smithing), with input consumption in the engine.
4. **Persistent saves**: Postgres behind `IPlayerStore`, so progress survives server restarts.
5. **Accounts**: sign up and log in; `/players/{id}` becomes `/me`.
6. **Village v1**: a few buildings and the first villager, with parallel activities in the engine.
7. **Story opening and contextual tutorial.**
8. **Achievements.**
9. **Combat and dungeons.**
10. **Market and raids.**

Persistence (4–5) moves earlier the moment anyone other than the developer plays, because losing progress costs trust.

## Open questions

- The setting's tone: grounded medieval, light fantasy, or something of its own?
- Who attacked the old village, and does that thread drive the story?
- What exactly does active play reward? Candidates: decisions (assignments, builds), events that need an answer within a window, villager needs, bonuses for tending.
- Should villagers work at full rate while the player is offline?
- How punishing should failure be (in dungeons, or when inputs run out)?
