# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + TypeScript + Vite, styled with Tailwind CSS, in `web/`. The backend is an ASP.NET Core API (`src/IdleHold.Api`) that owns all game rules.

## Users

Both newcomers to idle games and genre veterans (players of Melvor Idle and similar). Newcomers need the game to be immediately clear; veterans want depth without a dated, number-heavy interface.

Players mainly use desktop, often with the game open in a tab next to other work and checked periodically. They also open it on a phone for quick check-ins.

## Product Purpose

IdleHold is a browser idle game: the player picks a skill and an action, and progress accumulates over time, including while they are away. Success is a player who comes back because checking in feels rewarding and the interface is pleasant to look at, not a chore of reading numbers.

## Positioning

Idle, but not passive: time spent actively playing should matter through decisions and moments that reward being present, not only through faster progress. The interface is a deliberate departure from the genre's dated, spreadsheet-like presentation.

## Operating Context

- Long-running sessions in a background tab, with short glances to see what changed.
- Quick mobile check-ins: what happened while I was away, then pick the next action.
- Offline progress is computed by the server when the player returns.

## Capabilities and Constraints

- **Server-authoritative.** The client never decides outcomes. It renders state from the API and animates progress locally between requests.
- Current API: `GET /content` (available actions), `POST /players`, `GET /players/{id}`, `POST /players/{id}/action`, `DELETE /players/{id}/action`.
- One action at a time. Each action belongs to a skill, takes a fixed duration, and grants XP and an item.
- Current content: one skill (Woodcutting) with two actions (pine, birch). Skills have levels 1–99.
- No accounts yet: the player id is stored in the browser.
- Undecided: the world's setting and theme, the active-play mechanic, item and skill catalogs beyond the current content.

## Brand Commitments

- Name: **IdleHold**. A logo is planned but does not exist yet.
- Original game: genre mechanics are fine; names, art or content from existing games are not.

## Evidence on Hand

No art, logo, screenshots, testimonials or player data exist yet. Do not fabricate them.

## Product Principles

1. **Glanceable first.** Someone returning after hours should understand what happened and what is running in a few seconds.
2. **Fewer numbers, more meaning.** Show the numbers that drive a decision; everything else is secondary.
3. **The server is the truth.** The UI never shows a reward the server has not confirmed.
4. **Welcoming, with depth underneath.** Clear for newcomers on day one, without capping what veterans can dig into.
