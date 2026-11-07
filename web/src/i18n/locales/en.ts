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
    lostSave: 'Your previous hold could not be found, so a new one was started.',
    actionFailed: 'The server did not accept that. Check your connection and try again.',
    totalLevel: 'Total level',
    pageTitle: '{{count}} {{item}} · {{verb}} · IdleHold',
  },
  language: {
    label: 'Language',
    en: 'English',
    'pt-BR': 'Português (Brasil)',
  },
  account: {
    saveProgress: 'Save progress',
    signIn: 'Sign in',
    signOut: 'Sign out',
    signedInAs: 'Signed in as {{email}}',
    close: 'Close',
    email: 'E-mail',
    password: 'Password',
    passwordHint: 'At least 8 characters.',
    register: {
      title: 'Keep your hold',
      body: 'Create an account and this hold, with everything in it, is saved to it. Play from any browser.',
      submit: 'Create account',
      submitting: 'Creating account…',
      switch: 'Already have an account? <action>Sign in</action>',
    },
    login: {
      title: 'Sign in',
      body: 'Pick up your hold where you left it.',
      guestWarning: 'Signing in opens your account’s hold. The guest hold in this browser is left behind.',
      submit: 'Sign in',
      submitting: 'Signing in…',
      switch: 'New here? <action>Create an account</action>',
    },
    errors: {
      email: 'Check the e-mail. It may be invalid or already have an account.',
      password: 'The password needs at least 8 characters.',
      login: 'Wrong e-mail or password, or too many attempts. Try again in a few minutes.',
      failed: 'The server did not answer. Try again in a moment.',
    },
    nudge: {
      body: 'Your hold is growing. Create an account so it is not lost with this browser’s data.',
      action: 'Create account',
      dismiss: 'Dismiss',
    },
    signedOut: {
      title: 'This hold belongs to an account',
      body: 'Sign in to keep playing it.',
      newGuest: 'Start a new hold as a guest',
    },
  },
  village: {
    rail: 'Village',
    defaultName: 'Idle Road',
    sceneLabel: 'A campfire in a forest clearing at sunset, among the ruins of the old village: a half-standing cottage, a collapsed house and crumbled stone walls, with a pine forest and hills on the horizon.',
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
      foraging: 'Foraging',
    },
    actions: {
      'gather-twigs': { name: 'Twigs', verb: 'Gathering twigs' },
      'cut-pine': { name: 'Pine', verb: 'Cutting pine' },
      'cut-birch': { name: 'Birch', verb: 'Cutting birch' },
      'catch-perch': { name: 'Perch', verb: 'Catching perch' },
      'catch-pike': { name: 'Pike', verb: 'Catching pike' },
      'pick-pebbles': { name: 'Pebbles', verb: 'Picking up pebbles' },
      'mine-stone': { name: 'Stone', verb: 'Mining stone' },
      'mine-copper': { name: 'Copper', verb: 'Mining copper' },
      'pick-wild-berries': { name: 'Wild berries', verb: 'Picking wild berries' },
    },
    items: {
      twig: { name: 'Twig', count_one: 'twig', count_other: 'twigs' },
      'pine-log': { name: 'Pine log', count_one: 'pine log', count_other: 'pine logs' },
      'birch-log': { name: 'Birch log', count_one: 'birch log', count_other: 'birch logs' },
      perch: { name: 'Perch', count_one: 'perch', count_other: 'perch' },
      pike: { name: 'Pike', count_one: 'pike', count_other: 'pike' },
      pebble: { name: 'Pebble', count_one: 'pebble', count_other: 'pebbles' },
      stone: { name: 'Stone', count_one: 'stone', count_other: 'stone' },
      'copper-ore': { name: 'Copper ore', count_one: 'copper ore', count_other: 'copper ore' },
      'wild-berry': { name: 'Wild berry', count_one: 'wild berry', count_other: 'wild berries' },
    },
  },
}

/** Any string as a value; plural groups may add forms English never uses, such as `_many`. */
type Widen<T> = T extends string
  ? string
  : { [K in keyof T]: Widen<T[K]> } & (T extends { count_other: string } ? { count_many?: string } : unknown)

/** The shape every language file must satisfy. */
export type Translation = Widen<typeof en>
