/**
 * 周期定义 — 每周期 3 张剧情事件牌（非随机）
 */
export const CYCLE_COUNT = 5;

/** @typedef {{ id: string, titleKey: string, descKey: string, art: string }} CycleCardDef */

/** @type {Record<number, { id: string, cardIds: string[] }>} */
export const CYCLE_DEFS = {
  1: {
    id: 'cycle_1',
    cardIds: ['friend_link', 'work_report', 'wife_msg'],
  },
  2: {
    id: 'cycle_2',
    cardIds: ['gamble_again', 'wife_breakfast', 'work_daily'],
  },
  3: {
    id: 'cycle_3',
    cardIds: ['work_hard', 'gamble_big', 'family_drawing'],
  },
  4: {
    id: 'cycle_4',
    cardIds: ['bill_reminder', 'memo_prompt', 'anxiety_ping'],
  },
  5: {
    id: 'cycle_5',
    cardIds: ['final_prep', 'family_wait', 'one_more_gamble'],
  },
};

/** 卡牌元数据（标题/描述走 copy.js） */
export const CARD_META = {
  friend_link: { art: 'assets/pixel/card-friend-link.png', branch: 'friend_link' },
  work_report: { art: 'assets/pixel/card-work-report.png', branch: 'work_report' },
  wife_msg: { art: 'assets/pixel/card-wife-msg.png', branch: 'wife_msg' },
  gamble_again: { art: 'assets/pixel/card-gamble-again.png', branch: 'gamble_again' },
  wife_breakfast: { art: 'assets/pixel/card-wife-breakfast.png', branch: 'wife_breakfast' },
  work_daily: { art: 'assets/pixel/card-work-daily.png', branch: 'work_daily' },
  work_hard: { art: 'assets/pixel/card-work-hard.png', branch: 'work_hard' },
  gamble_big: { art: 'assets/pixel/card-gamble-big.png', branch: 'gamble_big' },
  family_drawing: { art: 'assets/pixel/card-family-drawing.png', branch: 'family_drawing' },
  bill_reminder: { art: 'assets/pixel/card-bill.png', branch: 'bill_reminder' },
  memo_prompt: { art: 'assets/pixel/card-memo.png', branch: 'memo_prompt' },
  anxiety_ping: { art: 'assets/pixel/card-anxiety.png', branch: 'anxiety_ping' },
  final_prep: { art: 'assets/pixel/card-final.png', branch: 'final_prep' },
  family_wait: { art: 'assets/pixel/card-family-wait.png', branch: 'family_wait' },
  one_more_gamble: { art: 'assets/pixel/card-one-more.png', branch: 'one_more_gamble' },
};

export function getCycleDef(cycleNum) {
  return CYCLE_DEFS[cycleNum] || null;
}

export function getCardsForCycle(cycleNum) {
  const def = getCycleDef(cycleNum);
  if (!def) return [];
  return def.cardIds.map((id) => ({ id, ...CARD_META[id] }));
}
