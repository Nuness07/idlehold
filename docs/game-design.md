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

Four gathering skills exist. Foraging is worked by hand; each tree, fishing spot and rock pays more XP per second the slower it is:

| Skill | Actions | Item |
|---|---|---|
| Foraging | Twigs (2 s, 5 XP), Pebbles (2 s, 5 XP), Wild berries (2 s, 5 XP), Reeds (3 s, 8 XP) | Twig, Pebble, Wild berry, Reed |
| Woodcutting | Pine (3 s, 10 XP), Birch (5 s, 18 XP) | Pine log, Birch log |
| Fishing | Perch (4 s, 12 XP), Pike (7 s, 28 XP) | Perch, Pike |
| Mining | Stone (3 s, 9 XP), Copper (6 s, 22 XP) | Stone, Copper ore |

Wood and stone are the village's building materials; fish feeds Cooking; copper feeds Smithing. A content test keeps the rule that a slower action never pays less XP per second. Trades are locked until their tool exists (see "Bare hands and tools"); level gates are not in yet, so every action of an open trade starts at level 1.

Note on originality: Melvor Idle already has a village skill (Township). Here the village is not one skill among many; the skills exist to serve the village.

### Bare hands and tools: Decided

The player starts with nothing, not even an axe. **Foraging is the one gathering trade worked by hand** (twigs, pebbles, wild berries, reeds), and **every trade a tool serves is locked until the player owns that tool**: Woodcutting needs the axe, Fishing the rod, and Mining will need the pickaxe once it exists (until then Mining stays open). Production trades with no tool (Crafting) are open from the start.

- **Locked means locked, not refused.** The trade still shows in the side panel, with a padlock, so the player sees what comes next. Opening it shows its sign and actions dimmed and out of reach, with two chains crossing the whole middle column corner to corner and a padlock where they cross, with a plaque that names the tool ("Locked until you have: chipped stone axe") and a button to the trade that makes it. Hiding locked trades was considered; showing them gives the player a goal and teaches the chain without tutorial text.
- **Each step uses what the step before made.** The planned early chain: Foraging gathers twigs and pebbles, Crafting makes the stone axe, the axe opens Woodcutting on a young tree, Carpentry turns its log into sticks, and the sticks go into the pickaxe that opens Mining. The young tree, Carpentry and the pickaxe are the next content step; the reed fishing rod stays.
- **Foraging** is a skill of its own, not a tutorial step: its finds feed Cooking later, and planting may grow out of it (possibly as a separate Farming skill).
- **Crafting** is a skill that turns materials into things, starting with the first tools. It is how the player gets from bare hands to the axe, the pickaxe and the rod.
- A pebble is not the quarry's stone: pebbles are picked up by hand, stone is mined with a pickaxe.

Tools only gate for now; "gate plus speed" waits until a family has a second tier. Old saves keep the Woodcutting and Mining XP earned from twigs and pebbles before they moved to Foraging. Open: the numbers (see Progression and balancing).

### Crafting and tools: Decided

Crafting is a skill with XP and levels. A recipe is an action with inputs: it takes time like any other action, and each completion takes its inputs from the stores. When the stores cannot pay for the next completion, the action stops, including while the player is away.

**Tools are unique and upgraded, never collected.** The player owns one tool per family (axe, fishing rod) and makes it better by tier. Each tier keeps the same slot and icon on screen and costs more to make. A tool recipe makes exactly one tool and is refused once the player owns that tier or a better one; an upgrade recipe takes the previous tier as an input. Tools do not break: durability would punish the absent player.

The first recipes:

| Recipe | Inputs | Time, XP | Tool |
|---|---|---|---|
| Chipped stone axe | 3 twigs, 2 pebbles | 30 s, 40 XP | Axe, tier 1 |
| Reed fishing rod | 2 pine logs, 4 reeds (the line) | 40 s, 55 XP | Fishing rod, tier 1 |

Tool recipes take a while and pay well because each is made once. Reasons to keep crafting come later: repeatable goods for the village (cord, baskets, handles, building parts), and villagers who each need their own tool.

On screen, each tool family is one card in its trade, always showing the next tier: the tool in an iron frame, its name, a slot per material with what the player has and what it takes, and a wooden Build button below. Building starts the recipe like any action (it takes its time and occupies the worker). Once the family is at its best tool, the card shows it with nothing to build. A recipe with more than six materials shows five and a "+N" slot that expands the card. The server says which tier comes next. Each tool serves one trade (the axe Woodcutting, the rod Fishing), and that trade shows the tool in use, or is locked until it exists.

Not in yet: the next tiers (stone axe, then copper), recipe categories (by material and by use: tool, weapon), a "make N" queue, an inventory of owned tools, and the crafting table screen (the inputs filling the recipe, then the tool appearing).

### Trade groups: Decided

Trades are split in two groups: **Gathering** (Foraging, Woodcutting, Fishing, Mining), which takes from the world, and **Production** (Crafting, and later Leatherworking, Smithing, Cooking), which turns what was gathered into goods. The side panel lists the Village first, then each group under its heading. In Brazilian Portuguese the groups are "Ofício" and "Produção".

### Processing skills: Next

Cooking, Smithing (smelting ore into bars, bars into tools), Leatherworking. Recipes that consume inputs exist (see Crafting and tools); what is still missing:

- **An item catalog**: real items with names and categories instead of string ids.

### The village: Later (core)

Buildings cost goods and give something back: unlock a skill, unlock a villager, raise storage, add a passive bonus. This is the main long-term sink for resources and the visual centre of the game.

Decided: the village is a scene you look at and the home screen (the hub), seen in first person from the camp looking out to the horizon. It starts as a campfire among the ruins of the old village, with the forest behind. The village has a name ("Idle Road" for now; the player will choose it later); how it is shown is not decided. Its pieces will be animated over time.

Open: how buildings appear in the scene, and whether it is also a list of buildings.

Idea: the Village's emblem (the stone tower on its entry) grows as the village is rebuilt, a new drawing per stage. The game's logo keeps the first tower.

### Hold menu: Decided

The right side panel is the hold menu: Storehouse, Achievements, History and Statistics, then a profile card at its foot (the player's name, or "Guest", with a gear for Settings: language and account). Each entry opens its screen in the middle, the way the left rail opens the village and the trades. On phones and tablets the menu is a bar along the bottom.

- Storehouse: the full inventory, as a grid of slots (see Storehouse slots and capacity). Idea: a quick inventory that opens right in the side panel, later.
- Achievements: a screen that says it is coming (see Achievements below).
- History: a screen that says it is coming. A real log of actions, XP and level-ups needs the server to record events (a table, and how much history to keep); that is its own piece of work.
- Statistics: totals from the player's state (total level and XP, stored items, trades started).

Later entries, such as a Market or Leaderboards, are added when multiplayer exists, not shown disabled before.

### Storehouse slots and capacity: Decided

The storehouse is a grid of slots, like a bag in an RPG. Each slot holds a stack of one item, up to **10,000** of it (about a day of chopping pine fills one). The storehouse has a limited number of slots, raised by **bags** the player crafts, several kinds of them. The numbers are a first try, to be tuned once the limit can be played.

- A hold starts with **48 slots**.
- When what an action makes no longer fits (its last stack is full and no slot is free), the action stops, like when its inputs run out, and starting it is refused ("the storehouse is full"). Time away after that yields nothing, which is what makes bags worth having. A recipe can use the slot its inputs free.
- Built: the stack size and the slot limit as engine rules, the server splitting the stores into slots, and the grid with free slots and pages of 24.
- To build: the bags (items that add slots, crafted, several kinds), and a way to make room (selling or dropping items).
- Open: how many slots each bag adds; bags as something to sell, once monetisation is discussed.
- Idea: the tooltip grows into a full item card (what it is for, how long it takes to gather, the XP it gives, its market price), with tooltips inside tooltips.

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
3. ~~**Recipes**~~: done with Crafting (see Crafting and tools); Cooking and Smithing reuse it.
4. **Persistent saves**: Postgres behind `IPlayerStore`, so progress survives server restarts.
5. ~~**Accounts**~~: done; guests are anonymous accounts and every player plays through `/me/player`.
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
