import { COPY } from './copy.js';

function mergeContent(base, overrides) {
  if (Array.isArray(base)) {
    return Array.isArray(overrides) ? [...overrides] : [...base];
  }

  if (base && typeof base === 'object') {
    const result = { ...base };
    if (!overrides || typeof overrides !== 'object') {
      return result;
    }

    Object.entries(overrides).forEach(([key, value]) => {
      const baseValue = result[key];
      if (Array.isArray(value)) {
        result[key] = [...value];
      } else if (value && typeof value === 'object' && !Array.isArray(value) && typeof value !== 'function') {
        result[key] = mergeContent(baseValue && typeof baseValue === 'object' ? baseValue : {}, value);
      } else {
        result[key] = value;
      }
    });
    return result;
  }

  return overrides ?? base;
}

export function getStoryFacts(state) {
  const gambleCount = Math.max(state.stats?.gambleCount || 0, state.flags?.gamble_count || 0);
  const hasOpenedGamble = Boolean(
    state.flags?.gamble_opened
    || state.flags?.friend_link_seen
    || state.flags?.machine_deposit_total > 0
    || state.virtualBalance > 0,
  );
  const hasPressedGamble = Boolean(gambleCount > 0 || state.flags?.first_gamble_done);

  return {
    gambleStage: hasPressedGamble ? 'pressed' : hasOpenedGamble ? 'seen' : 'none',
    hasOpenedGamble,
    hasPressedGamble,
    hasFamilyHistory: Boolean(
      state.flags?.family_branch_count > 0
      || state.flags?.family_reply_count > 0
      || state.flags?.drawing_seen,
    ),
    hasWorkHistory: Boolean(
      state.flags?.work_branch_count > 0
      || state.stats?.workCount > 0,
    ),
    hasBillHistory: Boolean(
      state.flags?.bill_seen
      || state.billPaid > 0,
    ),
  };
}

const OPENING_VARIANTS = {
  2: {
    none: [
      '第二周开始了。',
      '你本来想先看工作群，可任务栏上那枚陌生的红点一直没从余光里消失。',
    ],
    seen: [
      '第二周开始了。',
      '你明明还没按过那颗按钮，却已经记住了它挂在任务栏上的样子。',
    ],
    pressed: COPY.cycles[2].opening,
  },
  5: {
    none: [
      '第五周，也是最后一夜。',
      '你其实还没真的按过那颗按钮，可这几周它一直像影子一样跟着你。',
    ],
    seen: [
      '第五周，也是最后一夜。',
      '你还没真的按过它，可你已经知道自己不是第一次把鼠标移到它上面。',
    ],
    pressed: COPY.cycles[5].opening,
  },
};

const BRANCH_VARIANTS = {
  '2.gamble_again': {
    none: {
      pick: [
        '你把【红点闪烁】推进行动格。',
        '明明还没真正碰过它，可你还是想知道那扇门后面到底有什么。',
      ],
      chat: [
        { from: '阿凯', text: '昨晚你没点吧？其实那玩意儿就是图个刺激。' },
        { from: '阿凯', text: '真要试就按一下，不至于怎样。' },
      ],
      intro: [
        '你第一次把网页完整点开。',
        '按钮安静地亮着，像是在等你把“只是看一眼”说成真的。',
      ],
    },
    seen: {
      pick: [
        '你把【红点闪烁】推进行动格。',
        '你没按过它，却已经在脑子里给它留了位置。',
      ],
      chat: [
        { from: '阿凯', text: '昨晚研究完没？其实按不按都随你，别老惦记着就行。' },
        { from: '阿凯', text: '当然，你要是真想试，一下就够你记住了。' },
      ],
      intro: [
        '你又把网页翻了出来。',
        '上次你停在按钮前，这一次鼠标还是慢慢挪了过去。',
      ],
    },
  },
  '3.gamble_big': {
    none: {
      pick: [
        '你把【压大一点】推进了行动格。',
        '真正可怕的不是已经沉进去，而是你开始想：如果总要试，不如一次压得更重。',
      ],
      intro: [
        '阿凯没有再发消息。',
        '是你自己把那颗按钮和账单放到了一起，越想越近。',
      ],
    },
    seen: {
      pick: [
        '你把【压大一点】推进了行动格。',
        '上次你停在按钮前，可那种没做完的感觉并没有跟着停下。',
      ],
      intro: [
        '阿凯没有再发消息。',
        '你却已经能自己把那个页面在脑子里重新点开。',
      ],
    },
  },
  '5.one_more_gamble': {
    none: {
      pick: [
        '你把【红键诱惑】推进了行动格。',
        '你终于不再说“先看看”，而是承认自己想知道按下去以后会发生什么。',
      ],
      prompt: '今晚，你要怎么做？',
      choices: {
        press: '按下去试试',
        stop: '还是不按',
      },
      stopLines: [
        '你盯着按钮看了很久，最后还是没有让第一次发生。',
        '这不是轻松的胜利，更像是把一场差点成真的事硬生生按了回去。',
      ],
    },
    seen: {
      pick: [
        '你把【红键诱惑】推进了行动格。',
        '你一直停在门口，这一晚才终于把“要不要按”摆到自己面前。',
      ],
      prompt: '这一次，你要不要真的按下去？',
      choices: {
        press: '这次按下去',
        stop: '继续忍住',
      },
      stopLines: [
        '你盯着按钮看了很久，最后还是把手挪开了。',
        '这不算彻底摆脱，但至少这次你没让那道门真的关上你自己。',
      ],
    },
  },
};

const FINAL_VARIANTS = {
  none: {
    title: '鼠标停在红键上。',
    body: '屏幕里的红按钮还在一明一灭。你还没真正按过它，但这几周你一直在把自己往这里带。',
    press: '按下去',
    notPress: '关掉它',
  },
  seen: {
    title: '这一次，你把手放在鼠标上。',
    body: '红按钮还是一明一灭。你没真正按过，可你知道自己不是第一次停在这里。',
    press: '这次按下去',
    notPress: '继续不按',
  },
  pressed: {
    title: COPY.final.title,
    body: COPY.final.body,
    press: COPY.final.press,
    notPress: COPY.final.notPress,
  },
};

export function resolveCycleOpening(cycle, state) {
  const facts = getStoryFacts(state);
  return OPENING_VARIANTS[cycle]?.[facts.gambleStage] || COPY.cycles[cycle]?.opening || [];
}

export function resolveBranchCopy(cycle, cardId, state) {
  const branch = COPY.cycles[cycle]?.branches?.[cardId];
  if (!branch) return null;

  const facts = getStoryFacts(state);
  const overrides = BRANCH_VARIANTS[`${cycle}.${cardId}`]?.[facts.gambleStage];
  if (!overrides) return branch;

  return mergeContent(branch, overrides);
}

export function resolveFinalDecisionCopy(state) {
  const facts = getStoryFacts(state);
  const variant = FINAL_VARIANTS[facts.gambleStage] || FINAL_VARIANTS.pressed;
  const memoText = String(state.flags?.memo_text || '').trim();
  const hasMemo = Boolean(state.flags?.memo_done && memoText);
  return {
    title: variant.title,
    body: variant.body,
    replayPrefix: hasMemo ? COPY.final.replayPrefix : COPY.final.unwrittenPrefix,
    memoText: hasMemo ? memoText : COPY.memo.defaultText,
    pressLabel: variant.press,
    notPressLabel: variant.notPress,
  };
}

const GOOD_ENDINGS = new Set(['perfect', 'awaken', 'stop_loss', 'memory']);
const BAD_ENDINGS = new Set(['ruin', 'delusion']);

export function resolveEndingCopy(endingId, state) {
  const base = COPY.endings?.[endingId];
  if (!base) return null;

  const facts = getStoryFacts(state);
  const contextKey = getEndingContextKey(endingId, state, facts);
  const bodyExtra = COPY.endingEpilogues?.[endingId]?.[contextKey] || '';

  return bodyExtra
    ? { ...base, bodyExtra }
    : { ...base };
}

function getEndingContextKey(endingId, state, facts) {
  if (GOOD_ENDINGS.has(endingId)) {
    if (facts.hasFamilyHistory) return 'family';
    if ((state.billPaid || 0) > 0 || facts.hasBillHistory) return 'debt';
    if (facts.hasWorkHistory) return 'work';
    return 'alone';
  }

  if (BAD_ENDINGS.has(endingId)) {
    if (facts.hasFamilyHistory) return 'family';
    if (facts.hasWorkHistory) return 'work';
    if (facts.hasBillHistory) return 'debt';
    return 'alone';
  }

  return 'alone';
}

function flattenText(value, output = []) {
  if (typeof value === 'string') {
    output.push(value);
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => flattenText(item, output));
    return output;
  }

  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => flattenText(item, output));
  }

  return output;
}

export function auditStoryContinuity() {
  const scenarios = [
    {
      name: 'cycle2 first-time gamble copy',
      opening: resolveCycleOpening(2, {
        flags: {},
        stats: { gambleCount: 0 },
        virtualBalance: 0,
        billPaid: 0,
      }),
      branch: resolveBranchCopy(2, 'gamble_again', {
        flags: {},
        stats: { gambleCount: 0 },
        virtualBalance: 0,
        billPaid: 0,
      }),
      blocked: ['昨晚手气怎么样', '再玩一次', '重新打开网页'],
    },
    {
      name: 'cycle5 unpressed final copy',
      opening: resolveCycleOpening(5, {
        flags: {},
        stats: { gambleCount: 0 },
        virtualBalance: 0,
        billPaid: 0,
      }),
      final: resolveFinalDecisionCopy({
        flags: {},
        stats: { gambleCount: 0 },
        virtualBalance: 0,
        billPaid: 0,
      }),
      blocked: ['最后一次'],
    },
  ];

  return scenarios.flatMap((scenario) => {
    const text = flattenText({
      opening: scenario.opening,
      branch: scenario.branch,
      final: scenario.final,
    }).join('\n');
    return scenario.blocked
      .filter((needle) => text.includes(needle))
      .map((needle) => `${scenario.name} contains "${needle}"`);
  });
}
