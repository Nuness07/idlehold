/**
 * English copy. This file defines the shape every other language must match.
 * Plural keys follow i18next: `_one` / `_other`, chosen with the `count` option.
 */
export const en = {
  app: {
    loading: 'Opening the hold…',
    errorTitle: "The hold can't be reached",
    errorBody: 'The game server did not answer. Your progress is safe on the server; try again in a moment.',
    tryAgain: 'Try again',
    lostSave:
      'Your previous hold was lost when the server restarted, so a new one was started. Saves will be kept once accounts arrive.',
    actionFailed: 'The server did not accept that. Check your connection and try again.',
    totalLevel: 'Total level',
    pageTitle: '{{count}} {{item}} · {{verb}} · IdleHold',
  },
  language: {
    label: 'Language',
    en: 'English',
    'pt-BR': 'Português (Brasil)',
  },
  trades: {
    heading: 'Trades',
    working: 'working',
  },
  sign: {
    level: 'Level {{level}}',
    noXp: 'No experience yet. Start an action to begin.',
    mastered: 'Mastered',
    xpToLevel: '{{xp}} XP to level {{level}}',
    levelIn: 'Level {{level}} in about {{time}}',
  },
  away: {
    label: 'Since you left',
    sentence: 'While you were away for <strong>{{time}}</strong>, your hold gathered <gains></gains>.',
    item: '<strong>{{amount}}</strong> {{item}}',
    level: '{{trade}} rose to <strong>level {{level}}</strong>',
    dismiss: 'Dismiss summary',
  },
  working: {
    idleTitle: 'Nothing is being worked',
    idleBody: 'Pick an action below. It keeps going while you are away.',
    cycle: 'Cycle',
    every: 'Every {{time}}',
    yield: 'Yield',
    output: '+{{quantity}} {{item}}',
    experience: 'Experience',
    xp: '+{{xp}} XP',
    stop: 'Stop',
    stopping: 'Stopping…',
    progressLabel: '{{verb}}, current cycle',
  },
  actions: {
    heading: 'Actions',
    meta: '{{time}} · {{quantity}} {{item}} · {{xp}} XP',
    working: 'Working',
    start: 'Start',
    switch: 'Switch',
    starting: 'Starting…',
  },
  stores: {
    heading: 'Stores',
    empty: 'Nothing stored yet. Start an action and the stores fill up, even while you are away.',
  },
  content: {
    trades: {
      woodcutting: 'Woodcutting',
      fishing: 'Fishing',
      mining: 'Mining',
    },
    actions: {
      'cut-pine': { name: 'Pine', verb: 'Cutting pine' },
      'cut-birch': { name: 'Birch', verb: 'Cutting birch' },
      'catch-perch': { name: 'Perch', verb: 'Catching perch' },
      'catch-pike': { name: 'Pike', verb: 'Catching pike' },
      'mine-stone': { name: 'Stone', verb: 'Mining stone' },
      'mine-copper': { name: 'Copper', verb: 'Mining copper' },
    },
    items: {
      'pine-log': { name: 'Pine log', count_one: 'pine log', count_other: 'pine logs' },
      'birch-log': { name: 'Birch log', count_one: 'birch log', count_other: 'birch logs' },
      perch: { name: 'Perch', count_one: 'perch', count_other: 'perch' },
      pike: { name: 'Pike', count_one: 'pike', count_other: 'pike' },
      stone: { name: 'Stone', count_one: 'stone', count_other: 'stone' },
      'copper-ore': { name: 'Copper ore', count_one: 'copper ore', count_other: 'copper ore' },
    },
  },
}

/** Any string as a value; plural groups may add forms English never uses, such as `_many`. */
type Widen<T> = T extends string
  ? string
  : { [K in keyof T]: Widen<T[K]> } & (T extends { count_other: string } ? { count_many?: string } : unknown)

/** The shape every language file must satisfy. */
export type Translation = Widen<typeof en>
