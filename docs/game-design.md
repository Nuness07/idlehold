# IdleHold game design

What the game is and what has been decided. Ideas are discussed before they land here; only agreed systems are written down.

## Vision

You manage a small village. Your old home was attacked and lost, and you start over somewhere new with almost nothing. At first you do everything yourself; over time the village grows into a hold.

The game is idle: the village keeps working while you are away. Being present still has to matter, through decisions and moments that reward attention, not only through faster numbers (see the design pillars in `AGENTS.md`).

## Decided

### Gathering skills

Three gathering skills exist, each with a quick starter action and a slower one that pays more XP per second:

| Skill | Actions | Item |
|---|---|---|
| Woodcutting | Pine (3 s, 10 XP), Birch (5 s, 18 XP) | Pine log, Birch log |
| Fishing | Perch (4 s, 12 XP), Pike (7 s, 28 XP) | Perch, Pike |
| Mining | Stone (3 s, 9 XP), Copper (6 s, 22 XP) | Stone, Copper ore |

A content test keeps the rule that a slower action never pays less XP per second.

### Levels

Each skill levels from 1 to 99 on a growing XP curve. The server computes levels; responses carry the bounds of the current level so the client can show progress.

### Offline progress

Actions keep running while the player is away. Progress is computed on the server from the time that passed, the moment the player comes back.

### Accounts

Players start as guests. Once a trade passes level 1 the game suggests creating an account, and the guest's hold moves to it with everything in it.
