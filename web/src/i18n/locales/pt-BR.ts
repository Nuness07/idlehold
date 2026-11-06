import type { Translation } from './en'

/** Brazilian Portuguese copy. `satisfies Translation` makes a missing or extra key a type error. */
export const ptBR = {
  app: {
    loading: 'Abrindo o seu domínio…',
    errorTitle: 'Não foi possível chegar ao seu domínio',
    errorBody: 'O servidor do jogo não respondeu. Seu progresso está salvo no servidor; tente de novo em instantes.',
    tryAgain: 'Tentar de novo',
    lostSave:
      'Seu domínio anterior se perdeu quando o servidor reiniciou, então um novo foi criado. O progresso vai ficar guardado quando as contas chegarem.',
    actionFailed: 'O servidor não aceitou isso. Confira sua conexão e tente de novo.',
    totalLevel: 'Nível total',
    pageTitle: '{{count}} {{item}} · {{verb}} · IdleHold',
  },
  language: {
    label: 'Idioma',
    en: 'English',
    'pt-BR': 'Português (Brasil)',
  },
  trades: {
    heading: 'Ofícios',
    working: 'trabalhando',
  },
  sign: {
    level: 'Nível {{level}}',
    noXp: 'Ainda sem experiência. Comece uma ação para começar.',
    mastered: 'Dominado',
    xpToLevel: '{{xp}} XP para o nível {{level}}',
    levelIn: 'Nível {{level}} em cerca de {{time}}',
  },
  away: {
    label: 'Enquanto você esteve fora',
    sentence: 'Enquanto você esteve fora por <strong>{{time}}</strong>, seu domínio juntou <gains></gains>.',
    item: '<strong>{{amount}}</strong> {{item}}',
    level: '{{trade}} subiu para o <strong>nível {{level}}</strong>',
    dismiss: 'Dispensar resumo',
  },
  working: {
    idleTitle: 'Nada está sendo trabalhado',
    idleBody: 'Escolha uma ação abaixo. Ela continua enquanto você estiver fora.',
    cycle: 'Ciclo',
    every: 'A cada {{time}}',
    yield: 'Rende',
    output: '+{{quantity}} {{item}}',
    experience: 'Experiência',
    xp: '+{{xp}} XP',
    stop: 'Parar',
    stopping: 'Parando…',
    progressLabel: '{{verb}}, ciclo atual',
  },
  actions: {
    heading: 'Ações',
    meta: '{{time}} · {{quantity}} {{item}} · {{xp}} XP',
    working: 'Trabalhando',
    start: 'Começar',
    switch: 'Trocar',
    starting: 'Começando…',
  },
  stores: {
    heading: 'Estoque',
    empty: 'Nada guardado ainda. Comece uma ação e o estoque vai enchendo, mesmo enquanto você estiver fora.',
  },
  content: {
    trades: {
      woodcutting: 'Lenhador',
      fishing: 'Pescador',
      mining: 'Minerador',
    },
    actions: {
      'cut-pine': { name: 'Pinheiro', verb: 'Cortando pinheiro' },
      'cut-birch': { name: 'Bétula', verb: 'Cortando bétula' },
      'catch-perch': { name: 'Perca', verb: 'Pescando perca' },
      'catch-pike': { name: 'Lúcio', verb: 'Pescando lúcio' },
      'mine-stone': { name: 'Pedra', verb: 'Minerando pedra' },
      'mine-copper': { name: 'Cobre', verb: 'Minerando cobre' },
    },
    items: {
      // `_many` is Portuguese's form for round millions ("2 milhões de toras"); here it reads like `_other`.
      'pine-log': { name: 'Tora de pinheiro', count_one: 'tora de pinheiro', count_many: 'toras de pinheiro', count_other: 'toras de pinheiro' },
      'birch-log': { name: 'Tora de bétula', count_one: 'tora de bétula', count_many: 'toras de bétula', count_other: 'toras de bétula' },
      perch: { name: 'Perca', count_one: 'perca', count_many: 'percas', count_other: 'percas' },
      pike: { name: 'Lúcio', count_one: 'lúcio', count_many: 'lúcios', count_other: 'lúcios' },
      stone: { name: 'Pedra', count_one: 'pedra', count_many: 'pedras', count_other: 'pedras' },
      'copper-ore': { name: 'Minério de cobre', count_one: 'minério de cobre', count_many: 'minérios de cobre', count_other: 'minérios de cobre' },
    },
  },
} satisfies Translation
