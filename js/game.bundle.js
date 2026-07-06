(() => {
  // js/balance.js
  var BALANCE = {
    days: 3,
    apPerDay: 3,
    apPerCycle: 3,
    cycles: 5,
    startCash: [800, 1200],
    billTotal: [3e3, 5e3],
    work: {
      success: [400, 700],
      fail: [80, 150],
      hitsRequired: 3,
      totalHits: 5,
      diligentBonusChance: 0.15
    },
    gamble: {
      firstFree: true,
      betCash: [80, 150],
      addictionChance: [0.15, 0.25, 0.4]
    },
    /** 基础转盘格 — 实际权重由 getDynamicWheel 按天数调整 */
    wheelBase: [
      { id: "small_win", label: "\u5C0F\u8D62", weight: 25, effect: "cash", range: [50, 150] },
      { id: "mid_win", label: "\u4E2D\u8D62", weight: 10, effect: "cash", range: [150, 300] },
      { id: "big_win", label: "\u5927\u8D62", weight: 3, effect: "cash", range: [300, 500] },
      { id: "small_loss", label: "\u5C0F\u4E8F", weight: 30, effect: "loss", range: [50, 120] },
      { id: "mid_loss", label: "\u4E2D\u4E8F", weight: 20, effect: "loss", range: [120, 250] },
      { id: "double", label: "\u7FFB\u500D", weight: 5, effect: "double" },
      { id: "clear", label: "\u6E05\u7A7A", weight: 7, effect: "clear" }
    ],
    /** 天数偏置：day1 偏赢，day3 偏亏 */
    dayBias: {
      1: { win: 1.4, loss: 0.7, double: 1.2, clear: 0.5 },
      2: { win: 1, loss: 1, double: 1, clear: 1 },
      3: { win: 0.6, loss: 1.5, double: 0.8, clear: 1.4 }
    },
    withdraw: [200, 500],
    mood: {
      addictionForce: 3,
      anxietyTrigger: 3,
      workPenaltyThreshold: 3,
      workSpeedPenalty: [0.85, 0.7, 0.55]
    },
    debt: {
      perfectRatio: 0.3,
      awakenRatio: 0.7,
      virtualWeight: 0.5
    }
  };
  function randRange(range) {
    const [min, max] = range;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function pickWeighted(items) {
    const total = items.reduce((s, i) => s + i.weight, 0);
    if (total <= 0) return items[0];
    let r = Math.random() * total;
    for (const item of items) {
      r -= item.weight;
      if (r <= 0) return item;
    }
    return items[items.length - 1];
  }
  function getDynamicWheel(day, addiction) {
    const bias = BALANCE.dayBias[day] || BALANCE.dayBias[2];
    const addictionLossBoost = 1 + addiction * 0.12;
    return BALANCE.wheelBase.map((seg) => {
      let w = seg.weight;
      if (seg.effect === "cash") w *= bias.win;
      if (seg.effect === "loss") w *= bias.loss * addictionLossBoost;
      if (seg.id === "double") w *= bias.double;
      if (seg.id === "clear") w *= bias.clear;
      return { ...seg, weight: Math.max(0, Math.round(w)) };
    }).filter((s) => s.weight > 0);
  }

  // js/cycles.js
  var CYCLE_COUNT = 5;
  var CYCLE_DEFS = {
    1: {
      id: "cycle_1",
      cardIds: ["friend_link", "work_report", "wife_msg"]
    },
    2: {
      id: "cycle_2",
      cardIds: ["gamble_again", "wife_breakfast", "work_daily"]
    },
    3: {
      id: "cycle_3",
      cardIds: ["work_hard", "gamble_big", "family_drawing"]
    },
    4: {
      id: "cycle_4",
      cardIds: ["bill_reminder", "memo_prompt", "anxiety_ping"]
    },
    5: {
      id: "cycle_5",
      cardIds: ["final_prep", "family_wait", "one_more_gamble"]
    }
  };
  var CARD_META = {
    friend_link: { art: "assets/pixel/card-friend-link.png", branch: "friend_link" },
    work_report: { art: "assets/pixel/card-work-report.png", branch: "work_report" },
    wife_msg: { art: "assets/pixel/card-wife-msg.png", branch: "wife_msg" },
    gamble_again: { art: "assets/pixel/card-gamble-again.png", branch: "gamble_again" },
    wife_breakfast: { art: "assets/pixel/card-wife-breakfast.png", branch: "wife_breakfast" },
    work_daily: { art: "assets/pixel/card-work-daily.png", branch: "work_daily" },
    work_hard: { art: "assets/pixel/card-work-hard.png", branch: "work_hard" },
    gamble_big: { art: "assets/pixel/card-gamble-big.png", branch: "gamble_big" },
    family_drawing: { art: "assets/pixel/card-family-drawing.png", branch: "family_drawing" },
    bill_reminder: { art: "assets/pixel/card-bill.png", branch: "bill_reminder" },
    memo_prompt: { art: "assets/pixel/card-memo.png", branch: "memo_prompt" },
    anxiety_ping: { art: "assets/pixel/card-anxiety.png", branch: "anxiety_ping" },
    final_prep: { art: "assets/pixel/card-final.png", branch: "final_prep" },
    family_wait: { art: "assets/pixel/card-family-wait.png", branch: "family_wait" },
    one_more_gamble: { art: "assets/pixel/card-one-more.png", branch: "one_more_gamble" }
  };
  function getCycleDef(cycleNum) {
    return CYCLE_DEFS[cycleNum] || null;
  }
  function getCardsForCycle(cycleNum) {
    const def = getCycleDef(cycleNum);
    if (!def) return [];
    return def.cardIds.map((id) => ({ id, ...CARD_META[id] }));
  }

  // js/state.js
  function createInitialState() {
    return {
      cycle: 1,
      ap: BALANCE.apPerCycle,
      cash: randRange(BALANCE.startCash),
      virtualBalance: 0,
      billTotal: randRange(BALANCE.billTotal),
      billPaid: 0,
      mood: { addiction: 0, stable: 0, anxiety: 0, diligent: 0 },
      moodCards: [],
      cycleResolved: false,
      story: { bookmark: null, node: null, cycleStartSave: null },
      flags: {
        intro_done: false,
        gamble_opened: false,
        gamble_count: 0,
        first_gamble_done: false,
        friend_link_seen: false,
        machine_deposit_total: 0,
        triple_unlocked: false,
        ten_unlocked: false,
        card_picked: null,
        initial_asset: 0,
        worked_this_cycle: false,
        work_branch_count: 0,
        family_branch_count: 0,
        family_reply_count: 0,
        bill_seen: false,
        memo_text: "",
        memo_done: false,
        drawing_seen: false,
        final_pressed: false,
        work_unlocked: true
      },
      stats: { gambleCount: 0, workCount: 0, workSuccess: 0, totalEarned: 0, totalLost: 0 },
      phase: "playing",
      endingId: null,
      log: []
    };
  }
  var state = createInitialState();
  function getState() {
    return state;
  }
  function resetGame() {
    state = createInitialState();
    return state;
  }
  function loadState(saved) {
    if (saved && typeof saved === "object") {
      state = {
        ...createInitialState(),
        ...saved,
        flags: { ...createInitialState().flags, ...saved.flags },
        story: { ...createInitialState().story, ...saved.story },
        moodCards: saved.moodCards || []
      };
    }
    return state;
  }
  function exportState() {
    return JSON.parse(JSON.stringify(state));
  }
  function spendAp2(n = 1) {
    if (state.ap < n) return false;
    state.ap -= n;
    return true;
  }
  function addCash(n) {
    state.cash = Math.max(0, state.cash + n);
    if (n > 0) state.stats.totalEarned += n;
    if (n < 0) state.stats.totalLost += Math.abs(n);
  }
  function addVirtual(n) {
    state.virtualBalance = Math.max(0, state.virtualBalance + n);
  }
  function getDebt() {
    const assets = state.cash + state.virtualBalance * BALANCE.debt.virtualWeight;
    return Math.max(0, state.billTotal - assets);
  }
  function addMood(type, n = 1) {
    state.mood[type] = Math.max(0, (state.mood[type] || 0) + n);
    for (let i = 0; i < n; i++) {
      state.moodCards.push(type);
    }
    if (type === "stable" && state.mood.anxiety > 0) {
      state.mood.anxiety = Math.max(0, state.mood.anxiety - 1);
    }
    if (type === "diligent" && state.mood.addiction > 0) {
      state.mood.addiction = Math.max(0, state.mood.addiction - 1);
    }
    return type;
  }
  function pushLog(msg) {
    state.log.push({ cycle: state.cycle, text: msg });
  }
  function endCycle() {
    if (state.cycle >= CYCLE_COUNT) return false;
    state.cycle += 1;
    state.ap = BALANCE.apPerCycle;
    state.cycleResolved = false;
    state.flags.worked_this_cycle = false;
    state.flags.card_picked = null;
    return true;
  }
  function canAct() {
    return state.phase === "playing";
  }
  function setEnding(id) {
    state.phase = "ending";
    state.endingId = id;
  }
  function payBill(amount) {
    const pay = Math.min(amount, state.cash, getDebt());
    if (pay <= 0) return 0;
    state.cash -= pay;
    state.billPaid += pay;
    return pay;
  }
  function getWorkSpeedMultiplier() {
    const addiction = state.mood.addiction;
    if (addiction >= BALANCE.mood.workPenaltyThreshold) return BALANCE.mood.workSpeedPenalty[2];
    if (addiction >= 2) return BALANCE.mood.workSpeedPenalty[1];
    if (addiction >= 1) return BALANCE.mood.workSpeedPenalty[0];
    if (state.mood.diligent >= 1) return 1.1;
    return 1;
  }
  function getWorkIncomeMultiplier() {
    const addiction = state.mood.addiction;
    if (addiction >= BALANCE.mood.workPenaltyThreshold) return 0.6;
    if (addiction >= 2) return 0.75;
    if (addiction >= 1) return 0.9;
    return 1;
  }
  function syncGambleUnlocks() {
    const n = state.stats.gambleCount;
    state.flags.triple_unlocked = n >= 5;
    state.flags.ten_unlocked = n >= 10;
  }

  // js/copy.js
  var COPY = {
    meta: {
      title: "\u7EA2\u952E\u68AD\u54C8",
      titleEn: "All In on Red",
      theme: "\u522B\u6309\u90A3\u4E2A\u952E",
      subtitle: "\u50CF\u7D20\u684C\u9762 \xB7 \u4E94\u5468\u671F\u6C89\u8FF7\u53D9\u4E8B \xB7 \u8D4C\u535A\u3001\u5DE5\u4F5C\u4E0E\u56DE\u5BB6\u4E4B\u95F4"
    },
    intro: {
      p1: "\u6DF1\u591C\u529E\u516C\u5BA4\u91CC\uFF0C\u5361\u724C\u684C\u9762\u4F1A\u4E0D\u65AD\u5237\u51FA\u4E8B\u4EF6\u3002\u6BCF\u4E2A\u5468\u671F\u4F60\u53EA\u80FD\u628A\u4E00\u5F20\u724C\u653E\u8FDB\u884C\u52A8\u683C\uFF0C\u5176\u4F59\u7684\u53EA\u80FD\u653E\u8FC7\u3002",
      p2: "\u670B\u53CB\u7684\u94FE\u63A5\u3001\u5DE5\u4F5C\u65E5\u62A5\u3001\u5BB6\u4EBA\u7684\u6D88\u606F\u3001\u8D26\u5355\u548C\u5907\u5FD8\u5F55\uFF0C\u4F1A\u628A\u4F60\u4E00\u70B9\u70B9\u63A8\u5411\u4E0D\u540C\u7684\u591C\u665A\u3002",
      p3: "\u4F60\u53EF\u4EE5\u5DE5\u4F5C\u3001\u53D6\u94B1\u3001\u7EE7\u7EED\u8D4C\uFF0C\u4E5F\u53EF\u4EE5\u5728\u8FD8\u6765\u5F97\u53CA\u7684\u65F6\u5019\u628A\u624B\u6536\u56DE\u6765\u3002\u95EE\u9898\u662F\uFF0C\u4F60\u4F1A\u5728\u54EA\u4E00\u6B65\u505C\u4E0B\uFF1F",
      start: "\u5F00\u59CB\u6E38\u620F",
      continue: "\u7EE7\u7EED\u6E38\u620F",
      newGame: "\u65B0\u6E38\u620F",
      saveTitle: "\u672C\u5730\u5B58\u6863",
      saveHint: "\u7EE7\u7EED\u4F1A\u4ECE\u5F53\u524D\u5468\u671F\u5F00\u5934\u8FDB\u5165\u3002",
      startHint: "\u70B9\u51FB\u5F00\u59CB\u540E\u8FDB\u5165\u684C\u9762",
      saveCycle: (cycle) => `\u8FDB\u5EA6\uFF1A\u7B2C ${cycle} \u5468`,
      saveCash: (cash) => `\u73B0\u91D1 \xA5${cash}`,
      saveDebt: (debt) => `\u5F85\u8FD8 \xA5${debt}`,
      savePresses: (presses) => `\u5DF2\u6309 ${presses} \u6B21`,
      saveMemory: (hasMemory) => hasMemory ? "\u8BB0\u5FC6\uFF1A\u5DF2\u7559\u4E0B\u7ED3\u5C40\u75D5\u8FF9" : "\u8BB0\u5FC6\uFF1A\u8FD8\u6CA1\u6709\u91CD\u6765\u8FC7",
      hint: "\u5148\u770B\u5E95\u90E8\u5267\u60C5\u6846\uFF0C\u518D\u4ECE\u724C\u684C\u9009\u4E00\u5F20\u4E8B\u4EF6\u724C\u5F00\u59CB\u3002",
      continueHint: (cycle) => `\u5DF2\u8BFB\u53D6\u672C\u5730\u5B58\u6863\uFF0C\u4ECE\u7B2C ${cycle} \u5468\u7EE7\u7EED\u3002`
    },
    hud: {
      cycleLabel: (cycle, max) => `\u5468\u671F ${cycle} / ${max}`,
      pressCount: (count) => `\u6309\u952E ${count} \u6B21`,
      debtLabel: (debt, total) => `\u5F85\u8FD8 \xA5${debt} / \xA5${total}`,
      cycleReady: "\u672C\u5468\u671F\u6545\u4E8B\u544A\u4E00\u6BB5\u843D\u3002\u70B9 HUD\u300C\u7ED3\u675F\u672C\u5468\u671F\u300D\u8FDB\u5165\u4E0B\u4E00\u5468\u3002"
    },
    cards: {
      ui: {
        tableTitle: "\u4E8B\u4EF6\u724C\u684C",
        slotLabel: "\u884C\u52A8\u683C",
        pickOne: "\u8BF7\u9009\u62E9\u4E00\u5F20\u4E8B\u4EF6\u724C\u3002",
        forfeited: "\u5176\u4F59\u4E24\u5F20\u724C\u5728\u8FD9\u4E00\u5468\u4F5C\u5E9F\u4E86\u3002\u4F60\u53EA\u80FD\u6CBF\u7740\u8FD9\u4E00\u6B21\u9009\u62E9\u5F80\u524D\u8D70\u3002"
      },
      friend_link: { title: "\u670B\u53CB\u7684\u94FE\u63A5", desc: "\u5927\u5B66\u5BA4\u53CB\u53D1\u6765\u795E\u79D8\u7F51\u9875\uFF1A\u522B\u6309\u90A3\u4E2A\u952E.html" },
      work_report: { title: "\u5DE5\u4F5C\u65E5\u62A5", desc: "\u8001\u677F\u50AC\u7740\u8FDB\u5EA6\u3002\u660E\u65E9\u4E5D\u70B9\u4E4B\u524D\u5FC5\u987B\u4EA4\u3002" },
      wife_msg: { title: "\u59BB\u5B50\u7684\u6D88\u606F", desc: "\u5C0F\u96C5\uFF1A\u8FD8\u4E0D\u56DE\u6765\u5417\uFF1F\u53A8\u623F\u91CC\u7559\u4E86\u7CA5\u3002" },
      gamble_again: { title: "\u7EA2\u70B9\u95EA\u70C1", desc: "\u7B2C\u4E8C\u5468\u5F00\u59CB\uFF0C\u4EFB\u52A1\u680F\u4E0A\u7684\u7EA2\u70B9\u53C8\u4EAE\u4E86\u4E00\u4E0B\u3002" },
      wife_breakfast: { title: "\u59BB\u5B50\u65E9\u9910", desc: "\u5C0F\u96C5\u53D1\u6765\u4E00\u5F20\u65E9\u9910\u7167\uFF1A\u8BB0\u5F97\u5403\u996D\u3002" },
      work_daily: { title: "\u5DE5\u4F5C\u65E5\u7A0B", desc: "\u8FD0\u7EF4\u5217\u8868\u8FD8\u5728\u6EDA\u52A8\uFF0C\u4ECA\u5929\u4E5F\u5F97\u628A\u5B83\u505A\u5B8C\u3002" },
      work_hard: { title: "\u52AA\u529B\u5DE5\u4F5C", desc: "\u8D26\u5355\u8D8A\u6765\u8D8A\u8FD1\uFF0C\u53EA\u5269\u628A\u81EA\u5DF1\u518D\u69A8\u4E00\u69A8\u3002" },
      gamble_big: { title: "\u538B\u5927\u4E00\u70B9", desc: "\u4F60\u5F00\u59CB\u60F3\u7528\u66F4\u91CD\u7684\u7B79\u7801\uFF0C\u628A\u522B\u7684\u58F0\u97F3\u90FD\u538B\u4E0B\u53BB\u3002" },
      family_drawing: { title: "\u6735\u6735\u7684\u753B", desc: "\u5973\u513F\u53D1\u6765\u4E00\u5F20\u65B0\u753B\uFF0C\u8BF4\u60F3\u7B49\u4F60\u56DE\u5BB6\u3002" },
      bill_reminder: { title: "\u8D26\u5355\u63D0\u9192", desc: "\u7CFB\u7EDF\u5F39\u7A97\uFF1A\u8FD9\u4E2A\u6708\u7684\u8D26\u5355\u5DF2\u7ECF\u7B2C\u4E8C\u6B21\u63D0\u9192\u3002" },
      memo_prompt: { title: "\u5907\u5FD8\u5F55", desc: "\u5199\u4E00\u53E5\u7ED9\u4ECA\u665A\u7684\u81EA\u5DF1\uFF0C\u7B49\u4F1A\u513F\u4F1A\u7528\u5F97\u4E0A\u3002" },
      anxiety_ping: { title: "\u672A\u8BFB\u6D88\u606F", desc: "\u624B\u673A\u53C8\u9707\u4E86\u4E00\u4E0B\u3002\u4F60\u77E5\u9053\u81EA\u5DF1\u4E0D\u60F3\u70B9\u5F00\u3002" },
      final_prep: { title: "\u6700\u540E\u4E00\u591C", desc: "\u7A97\u5916\u5F88\u9759\uFF0C\u90A3\u4E2A\u6309\u94AE\u5374\u8FD8\u4EAE\u7740\u3002" },
      family_wait: { title: "\u5BB6\u4EBA\u7B49\u5F85", desc: "\u5C0F\u96C5\u8BF4\u6C64\u8FD8\u70ED\u7740\uFF0C\u6735\u6735\u5DF2\u7ECF\u7761\u4E86\u3002" },
      one_more_gamble: { title: "\u7EA2\u952E\u8BF1\u60D1", desc: "\u5C4F\u5E55\u4E0A\u7684\u6570\u5B57\u6BD4\u6D88\u606F\u66F4\u4EAE\uFF0C\u4E5F\u66F4\u8FD1\u3002" }
    },
    mood: {
      addiction: "\u4E0A\u763E",
      stable: "\u8E0F\u5B9E",
      anxiety: "\u4E0D\u5B89",
      diligent: "\u52E4\u52C9"
    },
    narrative: {
      choices: {
        rewind: "\u56DE\u5230\u4E4B\u524D\uFF0C\u91CD\u65B0\u9009\u62E9",
        mainMenu: "\u8FD4\u56DE\u4E3B\u83DC\u5355",
        continueDemo: "\u8FDB\u5165\u7ED3\u5C40"
      }
    },
    cycles: {
      1: {
        title: "\u7B2C\u4E00\u5468 \xB7 \u597D\u5947",
        opening: [
          "\u6DF1\u591C 11 \u70B9\u3002\u529E\u516C\u5BA4\u53EA\u5269\u4F60\u4E00\u4E2A\u4EBA\u3002",
          "\u53F0\u706F\u7167\u7740\u6CA1\u5199\u5B8C\u7684\u65E5\u62A5\uFF0C\u5C4F\u5E55\u7684\u84DD\u5149\u6620\u5728\u8138\u4E0A\u3002\u7A97\u5916\u5728\u4E0B\u5C0F\u96E8\uFF0C\u697C\u91CC\u5B89\u9759\u5F97\u50CF\u53EA\u5269\u98CE\u6247\u58F0\u3002",
          "\u624B\u673A\u9707\u4E86\u4E00\u4E0B\uFF0C\u724C\u684C\u4E0A\u540C\u65F6\u7FFB\u51FA\u4E86\u4E09\u5F20\u4E8B\u4EF6\u724C\u3002\u4F60\u53EA\u80FD\u9009\u4E00\u5F20\u3002"
        ],
        branches: {
          friend_link: {
            pick: [
              "\u4F60\u628A\u3010\u670B\u53CB\u7684\u94FE\u63A5\u3011\u63A8\u8FDB\u884C\u52A8\u683C\u3002",
              "\u90A3\u4E2A\u6587\u4EF6\u540D\u50CF\u4E2A\u5EC9\u4EF7\u73A9\u7B11\uFF0C\u53EF\u5B83\u504F\u504F\u5728\u8FD9\u79CD\u65F6\u5019\u663E\u5F97\u5F88\u6709\u5438\u5F15\u529B\u3002"
            ],
            chat: [
              { from: "\u963F\u51EF", text: "\u8FD8\u5728\u516C\u53F8\uFF1F\u7ED9\u4F60\u53D1\u4E2A\u89E3\u95F7\u7684\u3002" },
              { from: "\u963F\u51EF", text: "\u522B\u6309\u90A3\u4E2A\u952E\u3002\u54C8\u54C8\uFF0C\u9A97\u4F60\u7684\uFF0C\u6309\u4E00\u4E0B\u8BD5\u8BD5\u3002" },
              { from: "\u7CFB\u7EDF", text: "\u963F\u51EF\u53D1\u9001\u4E86\u6587\u4EF6\uFF1A\u522B\u6309\u90A3\u4E2A\u952E.html", file: true }
            ],
            openGamble: [
              "\u4F60\u70B9\u5F00\u4E86\u94FE\u63A5\u3002\u6DF1\u8272\u9875\u9762\u4E2D\u592E\u53EA\u6709\u4E00\u4E2A\u7EA2\u6309\u94AE\uFF0C\u50CF\u6709\u4EBA\u6545\u610F\u628A\u6240\u6709\u6CE8\u610F\u529B\u90FD\u585E\u7ED9\u5B83\u3002",
              "\u4E0B\u65B9\u5199\u7740\u4E00\u884C\u5B57\uFF1A\u6B22\u8FCE\u6765\u5230\u6E38\u620F\u3002\u5148\u5B58\u4E00\u70B9\u865A\u62DF\u8D44\u4EA7\uFF0C\u518D\u51B3\u5B9A\u8981\u4E0D\u8981\u6309\u3002"
            ],
            assetPrompt: "\u5148\u9009\u4E00\u4E2A\u521D\u59CB\u6295\u5165\u3002",
            assets: [
              { id: 100, label: "\u8BD5\u6C34 \xA5100", desc: "\u53EA\u662F\u770B\u770B\uFF0C\u4E0D\u81F3\u4E8E\u4F24\u7B4B\u52A8\u9AA8\u3002" },
              { id: 300, label: "\u5C0F\u989D \xA5300", desc: "\u63A8\u8350\uFF1A\u521A\u597D\u591F\u8BA9\u4F60\u8BA4\u771F\u4E00\u70B9\u3002" },
              { id: 500, label: "\u4E2D\u989D \xA5500", desc: "\u5F00\u59CB\u6709\u70B9\u8D4C\u5473\u4E86\u3002" },
              { id: 1e3, label: "\u5927\u989D \xA51000", desc: "\u5DF2\u7ECF\u4E0D\u50CF\u73A9\u7B11\u3002" }
            ],
            assetThought: "\u4F60\u8BF4\u670D\u81EA\u5DF1\uFF1A\u53EA\u662F\u865A\u62DF\u8D44\u4EA7\uFF0C\u4E0D\u662F\u771F\u7684\u628A\u94B1\u4EA4\u51FA\u53BB\u3002\u53EF\u4F60\u7684\u5FC3\u8DF3\u5DF2\u7ECF\u5148\u4FE1\u4E86\u3002",
            gambleReady: [
              "\u6570\u5B57\u4EAE\u8D77\u6765\u4EE5\u540E\uFF0C\u6309\u94AE\u6BD4\u521A\u624D\u66F4\u7EA2\u4E86\u4E00\u70B9\u3002",
              "\u5B83\u4E0D\u50CF\u5728\u9080\u8BF7\u4F60\uFF0C\u66F4\u50CF\u5728\u7B49\u4F60\u8BC1\u660E\u81EA\u5DF1\u80FD\u505C\u4E0B\u3002"
            ],
            firstChoice: {
              prompt: "\u4F60\u8981\u600E\u4E48\u5F00\u59CB\uFF1F",
              try: "\u5148\u6309\u4E00\u4E0B\u8BD5\u8BD5",
              rules: "\u5148\u770B\u770B\u89C4\u5219"
            },
            rules: {
              title: "\u300A\u522B\u6309\u90A3\u4E2A\u952E\u300B\u89C4\u5219",
              body: [
                "\u6BCF\u6B21\u6309\u4E0B\u53BB\uFF0C\u673A\u5668\u4F1A\u5728\u8D62\u548C\u8F93\u4E4B\u95F4\u7ED9\u4F60\u4E00\u4E2A\u968F\u673A\u7ED3\u679C\u3002",
                "\u6309\u5F97\u8D8A\u591A\uFF0C\u53EF\u89E3\u9501\u7684\u8FDE\u6309\u8D8A\u591A\uFF1B\u8FDE\u6309\u8D8A\u591A\uFF0C\u505C\u4E0B\u6765\u7684\u5FF5\u5934\u5C31\u8D8A\u5C0F\u3002",
                "\u673A\u5668\u91CC\u7684\u94B1\u4E0D\u592A\u50CF\u94B1\uFF0C\u66F4\u50CF\u4E00\u4E32\u8FD8\u6CA1\u6765\u5F97\u53CA\u540E\u6094\u7684\u6570\u5B57\u3002"
              ],
              continue: "\u77E5\u9053\u4E86\uFF0C\u6309\u4E00\u4E0B\u770B\u770B",
              quit: "\u7B97\u4E86\uFF0C\u6211\u9000\u51FA"
            },
            rulesQuit: [
              "\u4F60\u5173\u6389\u4E86\u7F51\u9875\uFF0C\u5C4F\u5E55\u6697\u4E86\u4E00\u4E9B\u3002",
              "\u8D70\u51FA\u529E\u516C\u5BA4\u7684\u65F6\u5019\uFF0C\u96E8\u5DF2\u7ECF\u5C0F\u4E86\u3002\u4F60\u7ED9\u5C0F\u96C5\u56DE\u4E86\u53E5\u201C\u9A6C\u4E0A\u5230\u5BB6\u201D\u3002\u5979\u53EA\u56DE\u4E86\u4E00\u4E2A\u201C\u597D\u201D\u3002",
              "\u8DEF\u706F\u4E0B\u90A3\u4E00\u77AC\u95F4\uFF0C\u4F60\u5FFD\u7136\u89C9\u5F97\u81EA\u5DF1\u521A\u521A\u8EB2\u8FC7\u4E86\u4EC0\u4E48\u3002"
            ],
            press1: {
              result: "+\xA550",
              lines: [
                "\u6570\u5B57\u8DF3\u4E86\u4E00\u4E0B\u3002\u4F60\u8D62\u4E86\u7B2C\u4E00\u628A\u3002",
                "\u53EA\u662F \xA550\uFF0C\u4E0D\u503C\u4E00\u63D0\u3002\u53EF\u6B63\u56E0\u4E3A\u4E0D\u503C\u4E00\u63D0\uFF0C\u5B83\u53CD\u800C\u8BA9\u4F60\u89C9\u5F97\u201C\u518D\u6765\u4E00\u6B21\u4E5F\u6CA1\u5173\u7CFB\u201D\u3002"
              ],
              again: "\u518D\u8BD5\u4E00\u6B21",
              stop: "\u5230\u6B64\u4E3A\u6B62"
            },
            stopAfter1: [
              "\u4F60\u628A\u7A97\u53E3\u5173\u6389\u65F6\uFF0C\u624B\u6307\u751A\u81F3\u6709\u70B9\u4E0D\u820D\u3002",
              "\u53EF\u6B63\u56E0\u4E3A\u8FD9\u6837\uFF0C\u4F60\u53CD\u800C\u5E86\u5E78\u81EA\u5DF1\u505C\u5728\u4E86\u8FD9\u91CC\u3002\u56DE\u5BB6\u7684\u8DEF\u4E0A\uFF0C\u5FC3\u8DF3\u4E5F\u6162\u6162\u7A33\u4E86\u4E0B\u6765\u3002"
            ],
            press2: {
              result: "+\xA580",
              lines: [
                "\u53C8\u8D62\u4E86\u3002\u4E24\u6B21\u52A0\u8D77\u6765\uFF0C\u6570\u5B57\u5DF2\u7ECF\u6BD4\u4F60\u52A0\u73ED\u8FD9\u4E00\u5C0F\u65F6\u6765\u5F97\u8FD8\u5FEB\u3002",
                "\u4F60\u5F00\u59CB\u66FF\u5B83\u627E\u7406\u7531\uFF1A\u8FD0\u6C14\u597D\u65F6\u987A\u624B\u8D5A\u4E00\u70B9\uFF0C\u4E5F\u6CA1\u4EC0\u4E48\u5427\u3002"
              ],
              again: "\u624B\u6C14\u4E0D\u9519\uFF0C\u518D\u6765",
              stop: "\u591F\u4E86\uFF0C\u6536\u624B"
            },
            stopAfter2: [
              "\xA5130 \u770B\u8D77\u6765\u50CF\u4E00\u4E2A\u5B8C\u7F8E\u7684\u505C\u624B\u70B9\u3002",
              "\u4F60\u5173\u6389\u9875\u9762\uFF0C\u5374\u5728\u8111\u5B50\u91CC\u9ED8\u8BB0\u4E86\u90A3\u4E2A\u6309\u94AE\u7684\u4F4D\u7F6E\u3002\u4F60\u77E5\u9053\u8FD9\u5E76\u4E0D\u7B97\u5F7B\u5E95\u3002"
            ],
            press3: {
              result: "-\xA5120",
              lines: [
                "\u7B2C\u4E09\u628A\u8F93\u4E86\u3002\u521A\u624D\u7684\u8F7B\u677E\u611F\u50CF\u88AB\u4EBA\u7528\u6307\u7532\u8F7B\u8F7B\u5212\u7834\u3002",
                "\u4F60\u7B2C\u4E00\u53CD\u5E94\u4E0D\u662F\u201C\u7B97\u4E86\u201D\uFF0C\u800C\u662F\u201C\u518D\u6309\u4E00\u6B21\u5C31\u8D62\u56DE\u6765\u4E86\u201D\u3002"
              ],
              again: "\u518D\u6765\u4E00\u6B21\uFF0C\u8D62\u56DE\u6765",
              stop: "\u4E0D\u6309\u4E86\uFF0C\u56DE\u5BB6"
            },
            stopAfter3: [
              "\u4F60\u628A\u624B\u673A\u6263\u5728\u684C\u4E0A\uFF0C\u5F3A\u884C\u628A\u89C6\u7EBF\u4ECE\u90A3\u9897\u6309\u94AE\u4E0A\u632A\u5F00\u3002",
              "\u8FD9\u4E00\u6B21\u4F60\u8D62\u5F97\u4E0D\u591A\uFF0C\u5374\u603B\u7B97\u6CA1\u628A\u6574\u665A\u90FD\u8D54\u8FDB\u53BB\u3002"
            ],
            colleague: [
              "\u5C31\u5728\u4F60\u51C6\u5907\u7EE7\u7EED\u7684\u65F6\u5019\uFF0C\u8EAB\u540E\u5FFD\u7136\u4F20\u6765\u811A\u6B65\u58F0\u3002",
              "\u201C\u4F60\u8FD8\u6CA1\u8D70\uFF1F\u201D\u5C0F\u738B\u5728\u95E8\u53E3\u505C\u4E86\u4E00\u4E0B\uFF0C\u770B\u89C1\u4F60\u614C\u5FD9\u9501\u5C4F\uFF0C\u773C\u795E\u91CC\u6709\u4E00\u70B9\u4E0D\u786E\u5B9A\u7684\u62C5\u5FC3\u3002",
              "\u201C\u5DEE\u4E0D\u591A\u4E86\u3002\u201D\u4F60\u8BF4\u3002",
              "\u4ED6\u70B9\u70B9\u5934\uFF0C\u7559\u4E0B\u4E00\u53E5\u201C\u522B\u71AC\u592A\u72E0\u201D\uFF0C\u8F6C\u8EAB\u8D70\u4E86\u3002\u529E\u516C\u5BA4\u91CD\u65B0\u5B89\u9759\u4E0B\u6765\uFF0C\u6BD4\u521A\u624D\u66F4\u5B89\u9759\u3002"
            ],
            afterColleague: {
              prompt: "\u95E8\u53C8\u5173\u4E0A\u4E86\u3002\u7EA2\u6309\u94AE\u8FD8\u5728\u539F\u5730\u3002",
              oneMore: "\u5C31\u518D\u6309\u4E00\u6B21",
              quit: "\u5173\u6389\uFF0C\u56DE\u5BB6"
            },
            quitAfterColleague: [
              "\u8FD9\u4E00\u6B21\u4E0D\u662F\u7406\u667A\u8D62\u4E86\uFF0C\u662F\u88AB\u90A3\u53E5\u201C\u522B\u71AC\u592A\u72E0\u201D\u78B0\u4E86\u4E00\u4E0B\u3002",
              "\u4F60\u6536\u62FE\u4E1C\u897F\u79BB\u5F00\u529E\u516C\u5BA4\u3002\u7535\u68AF\u4E0B\u884C\u7684\u65F6\u5019\uFF0C\u4F60\u5FFD\u7136\u5F88\u60F3\u9A6C\u4E0A\u89C1\u5230\u5BB6\u91CC\u90A3\u76CF\u8FD8\u4EAE\u7740\u7684\u706F\u3002"
            ],
            press4: {
              lines: [
                "\u4F60\u8FD8\u662F\u6309\u4E86\u4E0B\u53BB\u3002",
                "\u5C4F\u5E55\u7A81\u7136\u4E00\u9ED1\u3002\u624B\u673A\u6CA1\u7535\u4E86\u3002\u90A3\u9897\u6309\u94AE\u8FDE\u540C\u521A\u624D\u7684\u6570\u5B57\u4E00\u8D77\u88AB\u5207\u65AD\uFF0C\u50CF\u6709\u4EBA\u7C97\u66B4\u5730\u66FF\u4F60\u505A\u4E86\u51B3\u5B9A\u3002",
                "\u4F60\u5728\u9ED1\u6389\u7684\u5C4F\u5E55\u91CC\u770B\u89C1\u4E86\u81EA\u5DF1\u7684\u8138\u3002\u5DF2\u7ECF 12 \u70B9\u534A\u4E86\u3002"
              ]
            },
            cycleEndHint: "\u4F60\u6CA1\u6709\u771F\u6B63\u8D62\u8FC7\u5B83\uFF0C\u53EA\u662F\u88AB\u8FEB\u505C\u5728\u4E86\u8FD9\u91CC\u3002\u7B2C\u4E8C\u5468\u4F1A\u66F4\u96BE\u3002"
          },
          work_report: {
            pick: [
              "\u4F60\u628A\u3010\u5DE5\u4F5C\u65E5\u62A5\u3011\u63A8\u8FDB\u4E86\u884C\u52A8\u683C\u3002",
              "\u81F3\u5C11\u4ECA\u665A\u8FD8\u6709\u4E00\u4EF6\u4E8B\u662F\u660E\u786E\u7684\uFF1A\u628A\u62A5\u544A\u4EA4\u4E0A\u53BB\u3002"
            ],
            work: [
              "\u6587\u6863\u4E00\u9875\u4E00\u9875\u5F80\u4E0B\u6EDA\uFF0C\u952E\u76D8\u58F0\u5728\u7A7A\u529E\u516C\u5BA4\u91CC\u663E\u5F97\u683C\u5916\u8BDA\u5B9E\u3002",
              "\u8FD9\u4E0D\u662F\u8BA9\u4EBA\u5174\u594B\u7684\u4E8B\uFF0C\u5374\u662F\u5C11\u6570\u505A\u5B8C\u4EE5\u540E\u4F1A\u771F\u7684\u8F7B\u4E00\u70B9\u7684\u4E8B\u3002"
            ],
            done: "\u65E5\u62A5\u7EC8\u4E8E\u53D1\u51FA\u53BB\u4E86\u3002\u8001\u677F\u53EA\u56DE\u4E86\u4E24\u4E2A\u5B57\uFF1A\u201C\u6536\u5230\u3002\u201D\u4F46\u4F60\u77E5\u9053\u8FD9\u4E24\u4E2A\u5B57\u8DB3\u591F\u8BA9\u4ECA\u665A\u5B89\u7A33\u4E00\u70B9\u3002"
          },
          wife_msg: {
            pick: [
              "\u4F60\u628A\u3010\u59BB\u5B50\u7684\u6D88\u606F\u3011\u653E\u8FDB\u884C\u52A8\u683C\u3002",
              "\u90A3\u6761\u201C\u53A8\u623F\u91CC\u6709\u7CA5\u201D\u6BD4\u4EFB\u4F55\u50AC\u4FC3\u90FD\u8F7B\uFF0C\u5374\u6BD4\u50AC\u4FC3\u66F4\u8BA9\u4EBA\u4E0D\u597D\u610F\u601D\u3002"
            ],
            chat: [
              { from: "\u5C0F\u96C5", text: "\u8FD8\u4E0D\u56DE\u6765\u5417\uFF1F\u53A8\u623F\u91CC\u6709\u7CA5\uFF0C\u81EA\u5DF1\u70ED\u4E00\u4E0B\u3002" }
            ],
            replyGood: "\u597D\uFF0C\u6211\u5C3D\u91CF\u65E9\u70B9\u56DE",
            replyLate: "\u8FD8\u5F97\u518D\u5FD9\u4E00\u4F1A\u513F",
            replyGoodFollow: [
              { from: "\u4F60", text: "\u597D\uFF0C\u6211\u5C3D\u91CF\u65E9\u70B9\u56DE\u3002" },
              { from: "\u5C0F\u96C5", text: "\u55EF\uFF0C\u8DEF\u4E0A\u6162\u70B9\u3002" }
            ],
            replyLateFollow: [
              { from: "\u4F60", text: "\u8FD8\u5F97\u518D\u5FD9\u4E00\u4F1A\u513F\u3002" },
              { from: "\u5C0F\u96C5", text: "\u2026\u2026\u77E5\u9053\u4E86\u3002" }
            ]
          }
        },
        earlyEndings: {
          rules_quit: {
            title: "\u53CA\u65F6\u79BB\u5F00\u7684\u4EBA",
            body: "\u4F60\u5728\u6700\u5F00\u59CB\u5C31\u770B\u6E05\u4E86\u5B83\u7684\u628A\u620F\u3002\u90A3\u4E0D\u662F\u610F\u5FD7\u591A\u575A\u5B9A\uFF0C\u53EA\u662F\u4F60\u8FD8\u6CA1\u628A\u81EA\u5DF1\u7684\u5FC3\u8DF3\u4EA4\u51FA\u53BB\u3002\u90A3\u4E00\u665A\u7684\u8DEF\u706F\u5F88\u51B7\uFF0C\u4F46\u56DE\u5BB6\u7684\u65B9\u5411\u5F88\u6E05\u695A\u3002",
            achievement: "\u6210\u5C31\uFF1A\u53CA\u65F6\u79BB\u5F00\u7684\u4EBA"
          },
          stop_after_1: {
            title: "\u89C1\u597D\u5C31\u6536\u7684\u4EBA",
            body: "\u7B2C\u4E00\u628A\u8D62\u7684\u65F6\u5019\uFF0C\u4F60\u5C31\u542C\u89C1\u4E86\u81EA\u5DF1\u5FC3\u91CC\u90A3\u4E2A\u201C\u518D\u6765\u4E00\u6B21\u201D\u7684\u58F0\u97F3\u3002\u5E78\u597D\uFF0C\u4F60\u6CA1\u6709\u987A\u7740\u5B83\u8D70\u3002\u5F88\u591A\u65F6\u5019\uFF0C\u771F\u6B63\u8D5A\u56DE\u6765\u7684\u4E0D\u662F\u6570\u5B57\uFF0C\u662F\u8FD8\u80FD\u56DE\u5934\u3002",
            achievement: "\u6210\u5C31\uFF1A\u89C1\u597D\u5C31\u6536\u7684\u4EBA"
          },
          stop_after_2: {
            title: "\u6709\u514B\u5236\u529B\u7684\u4EBA",
            body: "\u7B2C\u4E8C\u628A\u7684\u8F7B\u5FEB\u5DEE\u4E00\u70B9\u5C31\u9A97\u8FC7\u4F60\u3002\u53EF\u4F60\u8FD8\u662F\u5728\u6700\u8212\u670D\u7684\u65F6\u5019\u505C\u4E0B\u4E86\u3002\u56DE\u5BB6\u7684\u7535\u68AF\u91CC\uFF0C\u4F60\u7B2C\u4E00\u6B21\u610F\u8BC6\u5230\uFF1A\u514B\u5236\u5F80\u5F80\u53D1\u751F\u5728\u6700\u60F3\u7EE7\u7EED\u7684\u65F6\u5019\u3002",
            achievement: "\u6210\u5C31\uFF1A\u6709\u514B\u5236\u529B\u7684\u4EBA"
          },
          stop_after_3: {
            title: "\u53CA\u65F6\u56DE\u5934\u7684\u4EBA",
            body: "\u4F60\u6CA1\u8D62\u591A\u5C11\uFF0C\u5374\u81F3\u5C11\u6CA1\u628A\u81EA\u5DF1\u6574\u665A\u90FD\u8F93\u8FDB\u53BB\u3002\u540E\u6765\u56DE\u60F3\u8D77\u6765\uFF0C\u4F60\u8BB0\u4F4F\u7684\u4E0D\u662F\u90A3\u4E32\u6570\u5B57\uFF0C\u800C\u662F\u90A3\u4E00\u4E0B\u786C\u751F\u751F\u628A\u624B\u7F29\u56DE\u6765\u7684\u75BC\u3002",
            achievement: "\u6210\u5C31\uFF1A\u53CA\u65F6\u56DE\u5934\u7684\u4EBA"
          },
          quit_colleague: {
            title: "\u6709\u4EBA\u5728\u7B49\u4F60\u56DE\u5BB6",
            body: "\u90A3\u53E5\u201C\u522B\u71AC\u592A\u72E0\u201D\u50CF\u4E00\u6839\u5F88\u7EC6\u7684\u9488\uFF0C\u628A\u4F60\u4ECE\u90A3\u4E2A\u7EA2\u6309\u94AE\u7684\u5149\u91CC\u624E\u4E86\u51FA\u6765\u3002\u4F60\u6CA1\u6709\u6210\u4E3A\u66F4\u597D\u7684\u4EBA\uFF0C\u53EA\u662F\u60F3\u8D77\u4E86\u8FD8\u6709\u4EBA\u4F1A\u7ED9\u4F60\u7559\u4E00\u76CF\u706F\u3002",
            achievement: "\u6210\u5C31\uFF1A\u6709\u4EBA\u5728\u7B49\u4F60\u56DE\u5BB6"
          },
          phone_dead: {
            title: "\u88AB\u8FEB\u4E2D\u65AD\u7684\u4EBA",
            body: "\u6709\u65F6\u5019\u547D\u8FD0\u4F1A\u66FF\u4EBA\u505A\u51B3\u5B9A\u3002\u624B\u673A\u9ED1\u6389\u7684\u90A3\u4E00\u523B\uFF0C\u4F60\u6CA1\u6709\u7EE7\u7EED\u8D62\uFF0C\u4E5F\u6CA1\u6709\u7EE7\u7EED\u8F93\uFF0C\u53EA\u662F\u7EC8\u4E8E\u770B\u89C1\u4E86\u90A3\u5F20\u88AB\u5C4F\u5E55\u7167\u5F97\u5F88\u82CD\u767D\u7684\u8138\u3002\u53EF\u771F\u6B63\u7684\u9EBB\u70E6\uFF0C\u5E76\u6CA1\u6709\u968F\u7740\u7535\u91CF\u4E00\u8D77\u6D88\u5931\u3002",
            achievement: "\u6210\u5C31\uFF1A\u88AB\u8FEB\u4E2D\u65AD\u7684\u4EBA"
          }
        },
        demoEndPrompt: "\u8FD9\u6761\u5206\u652F\u5DF2\u7ECF\u8D70\u5230\u4E86\u4E00\u4E2A\u4E34\u65F6\u7ED3\u5C40\u3002\u4F60\u60F3\u56DE\u5230\u5173\u952E\u8282\u70B9\u91CD\u9009\uFF0C\u8FD8\u662F\u5C31\u8BA9\u8FD9\u4E00\u665A\u505C\u5728\u8FD9\u91CC\uFF1F"
      },
      2: {
        title: "\u7B2C\u4E8C\u5468 \xB7 \u4F59\u6E29",
        opening: [
          "\u7B2C\u4E8C\u5468\u5F00\u59CB\u4E86\u3002",
          "\u4F60\u4EE5\u4E3A\u81EA\u5DF1\u4F1A\u5148\u770B\u5DE5\u4F5C\u7FA4\uFF0C\u7ED3\u679C\u7B2C\u4E00\u773C\u8FD8\u662F\u843D\u5728\u4EFB\u52A1\u680F\u90A3\u679A\u6CA1\u5173\u6389\u7684\u7EA2\u70B9\u4E0A\u3002"
        ],
        branches: {
          gamble_again: {
            pick: [
              "\u4F60\u628A\u3010\u518D\u73A9\u4E00\u6B21\u3011\u63A8\u8FDB\u884C\u52A8\u683C\u3002",
              "\u8BF4\u662F\u201C\u518D\u73A9\u4E00\u6B21\u201D\uFF0C\u5176\u5B9E\u66F4\u50CF\u5728\u786E\u8BA4\u90A3\u79CD\u5FC3\u8DF3\u662F\u4E0D\u662F\u8FD8\u5728\u90A3\u91CC\u3002"
            ],
            chat: [
              { from: "\u963F\u51EF", text: "\u6628\u665A\u624B\u6C14\u600E\u4E48\u6837\uFF1F\u8FD9\u79CD\u4E1C\u897F\u522B\u592A\u8BA4\u771F\uFF0C\u56FE\u4E2A\u723D\u3002" },
              { from: "\u963F\u51EF", text: "\u4E0D\u8FC7\u4F60\u8981\u662F\u8FD8\u60F3\u8BD5\uFF0C\u5348\u4F11\u6765\u4E00\u628A\u6700\u89E3\u538B\u3002" }
            ],
            intro: [
              "\u4F60\u91CD\u65B0\u6253\u5F00\u7F51\u9875\u3002\u6309\u94AE\u8FD8\u662F\u90A3\u9897\u6309\u94AE\uFF0C\u50CF\u4EC0\u4E48\u90FD\u6CA1\u53D1\u751F\u8FC7\u3002",
              "\u53EF\u4F60\u5DF2\u7ECF\u77E5\u9053\uFF0C\u771F\u6B63\u53D8\u4E86\u7684\u662F\u4F60\u770B\u5B83\u7684\u773C\u795E\u3002"
            ],
            prompt: "\u4ECA\u5929\u8981\u600E\u4E48\u78B0\u5B83\uFF1F",
            choices: {
              press: "\u5C31\u6309\u4E00\u6B21",
              store: "\u5148\u628A\u94B1\u5B58\u8FDB\u53BB",
              close: "\u5148\u5173\u6389"
            },
            storeLines: [
              "\u4F60\u6CA1\u6709\u6309\uFF0C\u53EA\u662F\u628A\u73B0\u91D1\u5148\u5B58\u8FDB\u673A\u5668\u3002",
              "\u7EB8\u5E01\u53D8\u6210\u6570\u5B57\u4EE5\u540E\uFF0C\u5FFD\u7136\u6CA1\u6709\u521A\u624D\u90A3\u4E48\u50CF\u201C\u82B1\u94B1\u201D\u4E86\u3002\u4F60\u77E5\u9053\u8FD9\u5F88\u5371\u9669\u3002"
            ],
            closeLines: [
              "\u4F60\u628A\u6807\u7B7E\u9875\u7F29\u56DE\u4EFB\u52A1\u680F\u3002",
              "\u4F60\u6CA1\u6709\u5220\u9664\u5B83\u3002\u53EA\u662F\u6682\u65F6\u4E0D\u53BB\u770B\u5B83\u3002"
            ],
            resultGood: [
              "\u8D62\u7684\u65F6\u5019\uFF0C\u8EAB\u4F53\u6BD4\u8111\u5B50\u5148\u7ED9\u4E86\u53CD\u5E94\u3002",
              "\u4F60\u7B11\u4E86\u4E00\u4E0B\uFF0C\u9A6C\u4E0A\u53C8\u628A\u7B11\u610F\u538B\u4E0B\u53BB\u3002\u4F60\u4E0D\u60F3\u627F\u8BA4\u81EA\u5DF1\u5728\u671F\u5F85\u8FD9\u4E2A\u611F\u89C9\u3002"
            ],
            resultBad: [
              "\u8F93\u6389\u7684\u90A3\u4E00\u4E0B\uFF0C\u4F60\u5148\u662F\u76B1\u7709\uFF0C\u7136\u540E\u7ACB\u523B\u53BB\u60F3\u201C\u4E0B\u4E00\u628A\u4F1A\u4E0D\u4F1A\u56DE\u6765\u201D\u3002",
              "\u8FD9\u5FF5\u5934\u6765\u5F97\u6BD4\u4E8F\u6389\u7684\u94B1\u8FD8\u5FEB\u3002"
            ]
          },
          wife_breakfast: {
            pick: [
              "\u4F60\u628A\u3010\u59BB\u5B50\u65E9\u9910\u3011\u63A8\u8FDB\u4E86\u884C\u52A8\u683C\u3002",
              "\u6709\u65F6\u5019\u5173\u5FC3\u6765\u5F97\u592A\u8F7B\uFF0C\u53CD\u800C\u8BA9\u4EBA\u66F4\u4E0D\u6562\u76F4\u89C6\u3002"
            ],
            chat: [
              { from: "\u5C0F\u96C5", text: "\u65E9\u4E0A\u7ED9\u4F60\u7559\u4E86\u9E21\u86CB\u548C\u7CA5\uFF0C\u522B\u53C8\u5FD9\u5230\u5FD8\u4E86\u5403\u3002" },
              { from: "\u5C0F\u96C5", text: "\u4ECA\u665A\u56DE\u6765\u5403\u996D\u5417\uFF1F\u6735\u6735\u6628\u5929\u7761\u524D\u8FD8\u95EE\u4F60\u3002" }
            ],
            choices: {
              good: "\u4ECA\u665A\u65E9\u70B9\u56DE",
              late: "\u5148\u5FD9\uFF0C\u522B\u7B49\u6211"
            },
            goodFollow: [
              { from: "\u4F60", text: "\u4ECA\u665A\u65E9\u70B9\u56DE\u3002\u4F60\u548C\u6735\u6735\u5148\u5403\u3002" },
              { from: "\u5C0F\u96C5", text: "\u597D\u3002\u90A3\u6211\u628A\u6C64\u6E29\u7740\u3002" }
            ],
            lateFollow: [
              { from: "\u4F60", text: "\u5148\u5FD9\uFF0C\u522B\u7B49\u6211\u3002" },
              { from: "\u5C0F\u96C5", text: "\u55EF\u3002\u90A3\u6211\u5148\u54C4\u5979\u7761\u3002" }
            ]
          },
          work_daily: {
            pick: [
              "\u4F60\u628A\u3010\u5DE5\u4F5C\u65E5\u7A0B\u3011\u63A8\u8FDB\u4E86\u884C\u52A8\u683C\u3002",
              "\u6E05\u5355\u5728\u90A3\u513F\uFF0C\u673A\u5668\u4E5F\u5728\u90A3\u513F\u3002\u81F3\u5C11\u4ECA\u665A\u4F60\u5148\u51B3\u5B9A\u5BF9\u4ED8\u770B\u5F97\u89C1\u7684\u9EBB\u70E6\u3002"
            ],
            intro: [
              "\u5DE5\u5355\u4E00\u6761\u6761\u5F39\u51FA\u6765\uFF0C\u6CA1\u6709\u54EA\u4E00\u6761\u4F1A\u8BA9\u4EBA\u5174\u594B\u3002",
              "\u53EF\u6BCF\u4FEE\u597D\u4E00\u4EF6\uFF0C\u73B0\u5B9E\u5C31\u4F1A\u7A0D\u5FAE\u5F80\u56DE\u957F\u4E00\u70B9\u3002"
            ],
            success: [
              "\u4F60\u628A\u8BE5\u505A\u7684\u90FD\u505A\u5B8C\u4E86\uFF0C\u8FDE\u81EA\u5DF1\u90FD\u610F\u5916\u4ECA\u5929\u5C45\u7136\u8FD8\u80FD\u4E13\u5FC3\u3002"
            ],
            fail: [
              "\u4F60\u52C9\u5F3A\u628A\u4E8B\u60C5\u505A\u5B8C\uFF0C\u50CF\u5728\u4E00\u5C42\u5F88\u8584\u7684\u56F0\u610F\u548C\u70E6\u8E81\u4E0A\u8D70\u94A2\u4E1D\u3002"
            ]
          }
        }
      },
      3: {
        title: "\u7B2C\u4E09\u5468 \xB7 \u6DF1\u9677",
        opening: [
          "\u7B2C\u4E09\u5468\uFF0C\u8D26\u5355\u548C\u5FC3\u8DF3\u4E00\u8D77\u903C\u8FD1\u3002",
          "\u4F60\u5F00\u59CB\u5206\u4E0D\u6E05\u81EA\u5DF1\u5230\u5E95\u662F\u5728\u9003\u907F\u751F\u6D3B\uFF0C\u8FD8\u662F\u5728\u7B49\u751F\u6D3B\u653E\u8FC7\u4F60\u3002"
        ],
        branches: {
          work_hard: {
            pick: [
              "\u4F60\u628A\u3010\u52AA\u529B\u5DE5\u4F5C\u3011\u63A8\u8FDB\u4E86\u884C\u52A8\u683C\u3002",
              "\u5982\u679C\u94B1\u7EC8\u7A76\u8981\u9760\u81EA\u5DF1\u6323\u56DE\u6765\uFF0C\u90A3\u4ECA\u665A\u4E5F\u8BB8\u8FD8\u6765\u5F97\u53CA\u8865\u4E00\u70B9\u3002"
            ],
            intro: [
              "\u8FDB\u5EA6\u6761\u4E0D\u8BA8\u559C\uFF0C\u4F46\u5B83\u81F3\u5C11\u4E0D\u4F1A\u9A97\u4F60\u3002",
              "\u4F60\u76EF\u7740\u5B83\u4E00\u70B9\u70B9\u5F80\u524D\u632A\uFF0C\u50CF\u5728\u76EF\u4E00\u53E3\u6C14\u8FD8\u80FD\u4E0D\u80FD\u63A5\u4E0A\u3002"
            ],
            success: [
              "\u8FD9\u5468\u7684\u5DE5\u4F5C\u50CF\u7EC8\u4E8E\u6491\u4F4F\u4E86\u4F60\u4E00\u70B9\u3002"
            ],
            fail: [
              "\u4F60\u628A\u8BE5\u4EA4\u7684\u90FD\u4EA4\u4E86\uFF0C\u53EF\u8EAB\u4F53\u5DF2\u7ECF\u5148\u4E00\u6B65\u5F00\u59CB\u53D1\u7A7A\u3002"
            ]
          },
          gamble_big: {
            pick: [
              "\u4F60\u628A\u3010\u8D4C\u4E00\u628A\u5927\u7684\u3011\u63A8\u8FDB\u4E86\u884C\u52A8\u683C\u3002",
              "\u8FD9\u5DF2\u7ECF\u4E0D\u662F\u201C\u6309\u4E00\u4E0B\u8BD5\u8BD5\u201D\u4E86\u3002\u4F60\u60F3\u8981\u7684\u662F\u4E00\u6B21\u80FD\u628A\u7126\u8651\u538B\u4F4F\u7684\u8D77\u4F0F\u3002"
            ],
            intro: [
              "\u963F\u51EF\u6CA1\u6709\u518D\u53D1\u6D88\u606F\u3002\u4F60\u751A\u81F3\u4E0D\u9700\u8981\u522B\u4EBA\u6002\u607F\uFF0C\u81EA\u5DF1\u5C31\u628A\u9875\u9762\u70B9\u5F00\u4E86\u3002"
            ],
            stakePrompt: "\u4F60\u51C6\u5907\u5F80\u673A\u5668\u91CC\u538B\u591A\u5C11\uFF1F",
            stakeChoices: {
              small: "\u5148\u538B \xA5300",
              large: "\u538B \xA5600",
              leave: "\u7B97\u4E86\uFF0C\u5148\u4E0D\u538B"
            },
            modePrompt: "\u4F60\u6253\u7B97\u600E\u4E48\u6309\uFF1F",
            modeChoices: {
              once: "\u6309\u4E00\u6B21",
              triple: "\u4E09\u8FDE\u6309"
            },
            leaveLines: [
              "\u4F60\u628A\u624B\u505C\u5728\u534A\u7A7A\uFF0C\u6700\u540E\u8FD8\u662F\u6CA1\u6709\u6309\u4E0B\u53BB\u3002",
              "\u4E0D\u4EE3\u8868\u4F60\u5F7B\u5E95\u6E05\u9192\u4E86\uFF0C\u53EA\u662F\u4ECA\u5929\u8FD8\u6CA1\u70C2\u5230\u5E95\u3002"
            ],
            noCash: "\u4F60\u7FFB\u4E86\u4E00\u4E0B\u73B0\u91D1\uFF0C\u53D1\u73B0\u81EA\u5DF1\u5176\u5B9E\u4E5F\u6CA1\u4EC0\u4E48\u53EF\u62BC\u7684\u4E86\u3002",
            afterGood: [
              "\u6DA8\u4E0A\u53BB\u7684\u65F6\u5019\uFF0C\u6570\u5B57\u50CF\u4E00\u5242\u6B62\u75BC\u836F\u3002",
              "\u4F60\u77E5\u9053\u5B83\u4F1A\u8FC7\uFF0C\u53EF\u8EAB\u4F53\u5DF2\u7ECF\u5148\u8BB0\u4F4F\u4E86\u8FD9\u4E00\u4E0B\u3002"
            ],
            afterBad: [
              "\u6389\u4E0B\u53BB\u7684\u65F6\u5019\uFF0C\u4F60\u8111\u5B50\u91CC\u53EA\u5269\u4E00\u4E2A\u5FF5\u5934\uFF1A\u662F\u4E0D\u662F\u8FD8\u5DEE\u6700\u540E\u4E00\u628A\u3002",
              "\u8FD9\u624D\u662F\u5B83\u6700\u5389\u5BB3\u7684\u5730\u65B9\u3002\u5B83\u8BA9\u4E8F\u635F\u542C\u8D77\u6765\u50CF\u5E0C\u671B\u3002"
            ]
          },
          family_drawing: {
            pick: [
              "\u4F60\u628A\u3010\u6735\u6735\u7684\u753B\u3011\u63A8\u8FDB\u4E86\u884C\u52A8\u683C\u3002",
              "\u90A3\u4E00\u77AC\u95F4\u4F60\u51E0\u4E4E\u4E0D\u6562\u70B9\u5F00\uFF0C\u50CF\u6015\u91CC\u9762\u88C5\u7740\u4F60\u5DF2\u7ECF\u6765\u4E0D\u53CA\u9762\u5BF9\u7684\u4E1C\u897F\u3002"
            ],
            chat: [
              { from: "\u6735\u6735", text: "\u7238\u7238\uFF0C\u6211\u753B\u4E86\u6211\u4EEC\u4E00\u5BB6\u3002\u4F60\u4EC0\u4E48\u65F6\u5019\u56DE\u5BB6\u5440\uFF1F", image: "assets/pixel/daughter-drawing.png", alt: "\u6735\u6735\u7684\u753B" },
              { from: "\u5C0F\u96C5", text: "\u5979\u8BF4\u4E00\u5B9A\u8981\u7B49\u4F60\u770B\u5B8C\u518D\u7761\u3002" }
            ],
            choices: {
              look: "\u8BA4\u771F\u770B\u770B",
              wait: "\u5148\u7B49\u4E00\u4E0B"
            },
            lookFollow: [
              { from: "\u4F60", text: "\u7238\u7238\u770B\u5230\u4E86\u3002\u753B\u5F97\u771F\u597D\u3002" },
              { from: "\u6735\u6735", text: "\u4F60\u56DE\u6765\u6211\u8981\u7ED9\u4F60\u8BB2\uFF01" },
              { from: "\u5C0F\u96C5", text: "\u5979\u5F00\u5FC3\u574F\u4E86\u3002" }
            ],
            waitFollow: [
              { from: "\u4F60", text: "\u5148\u7B49\u4E00\u4E0B\uFF0C\u7238\u7238\u8FD8\u5728\u5FD9\u3002" },
              { from: "\u6735\u6735", text: "\u54E6\u2026\u2026\u90A3\u6211\u5148\u7761\u4E86\u3002" },
              { from: "\u5C0F\u96C5", text: "\u5979\u521A\u521A\u628A\u624B\u673A\u62B1\u4E86\u5F88\u4E45\u3002" }
            ]
          }
        }
      },
      4: {
        title: "\u7B2C\u56DB\u5468 \xB7 \u5BF9\u8D26",
        opening: [
          "\u7B2C\u56DB\u5468\uFF0C\u73B0\u5B9E\u7EC8\u4E8E\u628A\u8138\u8D34\u5230\u4E86\u5C4F\u5E55\u4E0A\u3002",
          "\u6709\u4E9B\u4E1C\u897F\u4E0D\u662F\u4E0D\u770B\u5C31\u4E0D\u5B58\u5728\uFF0C\u53EA\u662F\u4F1A\u5728\u4F60\u6700\u7D2F\u7684\u65F6\u5019\u4E00\u8D77\u8DF3\u51FA\u6765\u3002"
        ],
        branches: {
          bill_reminder: {
            pick: [
              "\u4F60\u628A\u3010\u8D26\u5355\u63D0\u9192\u3011\u63A8\u8FDB\u4E86\u884C\u52A8\u683C\u3002",
              "\u7CFB\u7EDF\u901A\u77E5\u5F39\u51FA\u6765\u7684\u65F6\u5019\uFF0C\u4F60\u672C\u80FD\u5730\u60F3\u5148\u628A\u5B83\u5173\u6389\u3002"
            ],
            intro: [
              "\u201C\u8FD9\u4E2A\u6708\u7684\u8D26\u5355\u5DF2\u518D\u6B21\u63D0\u9192\u3002\u201D",
              "\u4F60\u76EF\u7740\u90A3\u884C\u5B57\uFF0C\u5FFD\u7136\u89C9\u5F97\u6BD4\u7EA2\u6309\u94AE\u8FD8\u523A\u773C\u3002"
            ],
            prompt: "\u8FD9\u5468\u4F60\u6253\u7B97\u600E\u4E48\u5904\u7406\uFF1F",
            choices: {
              small: "\u5148\u8FD8 \xA5500",
              all: "\u80FD\u8FD8\u591A\u5C11\u8FD8\u591A\u5C11",
              delay: "\u518D\u62D6\u4E00\u5468"
            },
            paidSmall: (amount) => amount > 0 ? `\u4F60\u5148\u8FD8\u4E86 \xA5${amount}\u3002\u6570\u5B57\u5E76\u6CA1\u6709\u56E0\u6B64\u53D8\u5F97\u6E29\u67D4\uFF0C\u4F46\u81F3\u5C11\u6CA1\u518D\u7EE7\u7EED\u5047\u88C5\u770B\u4E0D\u89C1\u3002` : "\u4F60\u60F3\u5148\u8FD8\u4E00\u70B9\uFF0C\u5374\u53D1\u73B0\u624B\u91CC\u6839\u672C\u6CA1\u6709\u80FD\u7ACB\u523B\u62FF\u51FA\u6765\u7684\u94B1\u3002",
            paidAll: (amount) => amount > 0 ? `\u4F60\u628A\u624B\u5934\u80FD\u62FF\u51FA\u6765\u7684\u90FD\u5148\u8865\u4E86\u8FDB\u53BB\uFF1A\xA5${amount}\u3002\u5FC3\u91CC\u8FD8\u662F\u7A7A\uFF0C\u4F46\u603B\u7B97\u4E0D\u662F\u5B8C\u5168\u7A7A\u7740\u3002` : "\u4F60\u70B9\u4E86\u201C\u80FD\u8FD8\u591A\u5C11\u8FD8\u591A\u5C11\u201D\uFF0C\u53EF\u73B0\u5B9E\u6CA1\u6709\u7ED9\u4F60\u4EFB\u4F55\u53EF\u4EE5\u6309\u4E0B\u53BB\u7684\u4F59\u5730\u3002",
            delay: [
              "\u4F60\u628A\u63D0\u9192\u5F80\u540E\u4E00\u5212\uFF0C\u50CF\u628A\u4E00\u53E3\u5FEB\u8981\u6F2B\u51FA\u6765\u7684\u6C34\u91CD\u65B0\u538B\u56DE\u53BB\u3002",
              "\u53EF\u4F60\u77E5\u9053\u5B83\u4E0D\u662F\u6D88\u5931\u4E86\uFF0C\u53EA\u662F\u6539\u5929\u4F1A\u6765\u5F97\u66F4\u91CD\u3002"
            ]
          },
          memo_prompt: {
            pick: [
              "\u4F60\u628A\u3010\u5907\u5FD8\u5F55\u3011\u63A8\u8FDB\u4E86\u884C\u52A8\u683C\u3002",
              "\u7A97\u53E3\u5F39\u5F00\u65F6\uFF0C\u5149\u6807\u4E00\u95EA\u4E00\u95EA\uFF0C\u50CF\u5728\u903C\u4F60\u628A\u5FC3\u91CC\u6700\u4E0D\u60F3\u627F\u8BA4\u7684\u90A3\u53E5\u8BDD\u5199\u4E0B\u6765\u3002"
            ],
            prompt: "\u4F60\u60F3\u5BF9\u4ECA\u665A\u7684\u81EA\u5DF1\u8BF4\u4EC0\u4E48\uFF1F",
            afterSave: [
              "\u4F60\u628A\u90A3\u53E5\u8BDD\u4FDD\u5B58\u4E86\u4E0B\u6765\u3002",
              "\u7CFB\u7EDF\u6CA1\u6709\u8BC4\u4EF7\u4F60\uFF0C\u4E5F\u6CA1\u6709\u5B89\u6170\u4F60\u3002\u5B83\u53EA\u662F\u5B89\u9759\u5730\u628A\u5B83\u8BB0\u4F4F\u4E86\u3002"
            ]
          },
          anxiety_ping: {
            pick: [
              "\u4F60\u628A\u3010\u672A\u8BFB\u6D88\u606F\u3011\u63A8\u8FDB\u4E86\u884C\u52A8\u683C\u3002",
              "\u624B\u673A\u53C8\u9707\u4E86\u4E00\u4E0B\u3002\u4E0D\u662F\u5F88\u54CD\uFF0C\u5374\u8DB3\u591F\u8BA9\u4F60\u80C3\u91CC\u8DDF\u7740\u6C89\u4E00\u4E0B\u3002"
            ],
            chat: [
              { from: "\u5C0F\u96C5", text: "\u6735\u6735\u7761\u4E86\u3002\u5979\u8BF4\u4ECA\u5929\u4E5F\u6CA1\u7B49\u5230\u4F60\u3002" },
              { from: "\u5C0F\u96C5", text: "\u4F60\u5FD9\u5B8C\u56DE\u4E2A\u6D88\u606F\u5C31\u884C\u3002" }
            ],
            choices: {
              reply: "\u56DE\u4E00\u53E5",
              avoid: "\u7EE7\u7EED\u88C5\u6CA1\u770B\u89C1"
            },
            replyFollow: [
              { from: "\u4F60", text: "\u6211\u770B\u5230\u5566\u3002\u4ECA\u5929\u4F1A\u65E9\u70B9\u6536\u3002" },
              { from: "\u5C0F\u96C5", text: "\u597D\u3002\u81F3\u5C11\u8BA9\u6211\u77E5\u9053\u4F60\u8FD8\u5728\u3002" }
            ],
            avoidFollow: [
              { from: "\u7CFB\u7EDF", text: "\u4F60\u628A\u6D88\u606F\u5212\u8D70\u4E86\u3002\u672A\u8BFB\u7684\u5C0F\u7EA2\u70B9\u5374\u8FD8\u5728\u90A3\u91CC\u3002" }
            ]
          }
        }
      },
      5: {
        title: "\u7B2C\u4E94\u5468 \xB7 \u6700\u540E\u4E00\u591C",
        opening: [
          "\u7B2C\u4E94\u5468\uFF0C\u4E5F\u662F\u6700\u540E\u4E00\u591C\u3002",
          "\u4F60\u5DF2\u7ECF\u77E5\u9053\u6309\u94AE\u4F1A\u5E26\u6765\u4EC0\u4E48\uFF0C\u4E5F\u77E5\u9053\u81EA\u5DF1\u4E3A\u4EC0\u4E48\u8FD8\u4F1A\u628A\u9F20\u6807\u79FB\u8FC7\u53BB\u3002"
        ],
        branches: {
          final_prep: {
            pick: [
              "\u4F60\u628A\u3010\u6700\u540E\u4E00\u591C\u3011\u63A8\u8FDB\u4E86\u884C\u52A8\u683C\u3002",
              "\u529E\u516C\u5BA4\u5B89\u9759\u5F97\u80FD\u542C\u89C1\u673A\u7BB1\u91CC\u7684\u98CE\u58F0\u3002\u90A3\u9897\u6309\u94AE\u50CF\u4E00\u9897\u8FD8\u6CA1\u613F\u610F\u505C\u4E0B\u6765\u7684\u5FC3\u810F\u3002"
            ]
          },
          family_wait: {
            pick: [
              "\u4F60\u628A\u3010\u5BB6\u4EBA\u7B49\u5F85\u3011\u63A8\u8FDB\u4E86\u884C\u52A8\u683C\u3002",
              "\u4F60\u70B9\u5F00\u5BB6\u5EAD\u7FA4\uFF0C\u50CF\u5728\u70B9\u5F00\u4E00\u6247\u8FD8\u6CA1\u5F7B\u5E95\u5173\u4E0A\u7684\u95E8\u3002"
            ],
            chat: [
              { from: "\u5C0F\u96C5", text: "\u6C64\u8FD8\u70ED\u7740\u3002\u4F60\u56DE\u6765\u8F7B\u4E00\u70B9\uFF0C\u6735\u6735\u521A\u7761\u3002" }
            ],
            choices: {
              reply: "\u6211\u9A6C\u4E0A\u56DE",
              silent: "\u5148\u4E0D\u56DE"
            },
            replyFollow: [
              { from: "\u4F60", text: "\u6211\u9A6C\u4E0A\u56DE\u3002" },
              { from: "\u5C0F\u96C5", text: "\u597D\u3002\u6211\u7B49\u4F60\u3002" }
            ],
            silentFollow: [
              { from: "\u7CFB\u7EDF", text: "\u4F60\u628A\u5BF9\u8BDD\u6846\u505C\u5728\u8F93\u5165\u72B6\u6001\uFF0C\u5374\u4EC0\u4E48\u4E5F\u6CA1\u53D1\u51FA\u53BB\u3002" }
            ]
          },
          one_more_gamble: {
            pick: [
              "\u4F60\u628A\u3010\u518D\u6309\u4E00\u6B21\u3011\u63A8\u8FDB\u4E86\u884C\u52A8\u683C\u3002",
              "\u4F60\u5FC3\u91CC\u751A\u81F3\u5DF2\u7ECF\u66FF\u81EA\u5DF1\u60F3\u597D\u4E86\u501F\u53E3\uFF1A\u6700\u540E\u4E00\u6B21\u3002\u4ECA\u665A\u771F\u7684\u6700\u540E\u4E00\u6B21\u3002"
            ],
            prompt: "\u8FD9\u4E00\u6B21\uFF0C\u4F60\u8981\u600E\u4E48\u505A\uFF1F",
            choices: {
              press: "\u5C31\u518D\u6309\u4E00\u6B21",
              stop: "\u8FD9\u6B21\u4E0D\u6309\u4E86"
            },
            stopLines: [
              "\u4F60\u76EF\u7740\u6309\u94AE\u770B\u4E86\u5F88\u4E45\uFF0C\u6700\u540E\u8FD8\u662F\u628A\u624B\u632A\u5F00\u4E86\u3002",
              "\u8FD9\u4E0D\u662F\u8F7B\u677E\u7684\u80DC\u5229\uFF0C\u66F4\u50CF\u662F\u4ECE\u6CE5\u91CC\u628A\u811A\u4E00\u70B9\u70B9\u62D4\u51FA\u6765\u3002"
            ],
            afterGood: [
              "\u8D62\u7684\u65F6\u5019\uFF0C\u6309\u94AE\u50CF\u5728\u544A\u8BC9\u4F60\uFF1A\u770B\u5427\uFF0C\u518D\u6765\u4E00\u6B21\u603B\u662F\u503C\u5F97\u7684\u3002",
              "\u4F60\u77E5\u9053\u8FD9\u53E5\u8BDD\u662F\u5047\u7684\uFF0C\u4F46\u5B83\u542C\u8D77\u6765\u592A\u50CF\u5B89\u6170\u4E86\u3002"
            ],
            afterBad: [
              "\u8F93\u7684\u65F6\u5019\uFF0C\u4F60\u53CD\u800C\u66F4\u60F3\u7EE7\u7EED\u3002",
              "\u597D\u50CF\u4E0D\u662F\u4E3A\u4E86\u628A\u94B1\u8D62\u56DE\u6765\uFF0C\u53EA\u662F\u4E3A\u4E86\u522B\u8BA9\u8FD9\u4E00\u628A\u767D\u767D\u75BC\u4E00\u4E0B\u3002"
            ]
          }
        }
      }
    },
    memo: {
      title: "\u5907\u5FD8\u5F55",
      prompt: "\u4F60\u60F3\u5BF9\u4ECA\u665A\u7684\u81EA\u5DF1\u8BF4\u4EC0\u4E48\uFF1F",
      placeholder: "\u5199\u4E00\u53E5\uFF0C\u7ED9\u4ECA\u665A\u7684\u81EA\u5DF1\u3002",
      confirm: "\u4FDD\u5B58",
      defaultText: "\u522B\u518D\u628A\u81EA\u5DF1\u4EA4\u7ED9\u4E00\u4E2A\u6309\u94AE\u3002"
    },
    final: {
      replayPrefix: "\u90A3\u5929\u591C\u91CC\uFF0C\u4F60\u5199\u4E0B\u2014\u2014",
      unwrittenPrefix: "\u90A3\u5929\u591C\u91CC\uFF0C\u4F60\u4EC0\u4E48\u90FD\u6CA1\u7559\u4E0B\uFF0C\u8111\u5B50\u91CC\u53EA\u5269\u4E00\u53E5\u2014\u2014",
      title: "\u6700\u540E\u4E00\u6B21\uFF0C\u4F60\u628A\u624B\u653E\u5728\u9F20\u6807\u4E0A\u3002",
      body: "\u5C4F\u5E55\u91CC\u7684\u7EA2\u6309\u94AE\u8FD8\u5728\u4E00\u660E\u4E00\u706D\u3002\u4F60\u77E5\u9053\u8FD9\u4E00\u56DE\u4E0D\u53EA\u662F\u8F93\u8D62\uFF0C\u800C\u662F\u4F60\u5230\u5E95\u8FD8\u60F3\u628A\u4EC0\u4E48\u7EE7\u7EED\u4EA4\u7ED9\u5B83\u3002",
      press: "\u6309",
      notPress: "\u4E0D\u6309"
    },
    buttons: {
      gambleOnce: "\u6309",
      triple: "\u4E09\u8FDE\u6309",
      ten: "\u5341\u8FDE\u6309",
      depositAll: "\u5B58\u5165\u673A\u5668",
      withdraw: "\u53D6\u51FA",
      workStart: "\u5F00\u59CB\u7EF4\u62A4",
      memoSave: "\u4FDD\u5B58",
      menu: "\u8FD4\u56DE\u4E3B\u83DC\u5355",
      restart: "\u91CD\u65B0\u5F00\u59CB",
      muteOn: "\u{1F50A}",
      muteOff: "\u{1F507}"
    },
    notify: {
      newCycle: (cycle) => ({ title: "\u65B0\u5468\u671F", body: `\u5468\u671F ${cycle} \u5F00\u59CB\u3002\u65B0\u7684\u4E8B\u4EF6\u724C\u7FFB\u5F00\u4E86\u3002` }),
      lastCycle: { title: "\u6700\u540E\u4E00\u5468", body: "\u4F60\u5DF2\u7ECF\u6765\u5230\u6700\u540E\u4E00\u5468\u3002" },
      moodAddiction: { title: "\u5FC3\u60C5\u53D8\u5316", body: "\u4E0A\u763E +1\u3002\u4F60\u5F00\u59CB\u671F\u5F85\u4E0B\u4E00\u6B21\u8D77\u4F0F\u3002" },
      moodStable: { title: "\u5FC3\u60C5\u53D8\u5316", body: "\u8E0F\u5B9E +1\u3002\u81F3\u5C11\u6709\u4E00\u523B\uFF0C\u4F60\u89C9\u5F97\u81EA\u5DF1\u8FD8\u8E29\u5728\u5730\u4E0A\u3002" },
      moodAnxiety: { title: "\u5FC3\u60C5\u53D8\u5316", body: "\u4E0D\u5B89 +1\u3002\u90A3\u79CD\u4E0B\u5760\u611F\u8FD8\u5728\u8EAB\u4F53\u91CC\u3002" },
      moodDiligent: { title: "\u5FC3\u60C5\u53D8\u5316", body: "\u52E4\u52C9 +1\u3002\u4F60\u8FD8\u8BB0\u5F97\u600E\u6837\u9760\u81EA\u5DF1\u628A\u4E8B\u505A\u5B8C\u3002" },
      tripleLocked: { title: "\u8FD8\u6CA1\u89E3\u9501", body: "\u4E09\u8FDE\u6309\u9700\u8981\u7D2F\u8BA1\u6309\u952E 5 \u6B21\u3002" },
      tenLocked: { title: "\u8FD8\u6CA1\u89E3\u9501", body: "\u5341\u8FDE\u6309\u9700\u8981\u7D2F\u8BA1\u6309\u952E 10 \u6B21\u3002" },
      memoEmpty: { title: "\u5907\u5FD8\u5F55", body: "\u81F3\u5C11\u5199\u4E00\u53E5\u771F\u6B63\u60F3\u7559\u4E0B\u6765\u7684\u8BDD\u3002" },
      memoSaved: { title: "\u5907\u5FD8\u5F55", body: "\u8FD9\u53E5\u8BDD\u5DF2\u7ECF\u88AB\u8BB0\u4E0B\u6765\u4E86\u3002" }
    },
    gamble: {
      fileCard: { name: "\u522B\u6309\u90A3\u4E2A\u952E.html", desc: "\u4E00\u4E2A\u7B80\u964B\u7684\u7F51\u9875\uFF0C\u4E2D\u592E\u53EA\u6709\u4E00\u4E2A\u6309\u94AE\u3002" },
      firstWin: "\u7B2C\u4E00\u6B21\u8D62\u7684\u65F6\u5019\uFF0C\u4F60\u751A\u81F3\u6CA1\u6765\u5F97\u53CA\u9AD8\u5174\uFF0C\u5FC3\u8DF3\u5C31\u5DF2\u7ECF\u5148\u5FEB\u4E86\u4E00\u62CD\u3002",
      firstLoss: "\u7B2C\u4E00\u6B21\u8F93\u7684\u65F6\u5019\uFF0C\u4F60\u51E0\u4E4E\u7ACB\u523B\u5F00\u59CB\u66FF\u4E0B\u4E00\u628A\u627E\u7406\u7531\u3002",
      addictionEcho: " \u4F60\u76EF\u7740\u90A3\u4E32\u6570\u5B57\uFF0C\u5FFD\u7136\u5F88\u60F3\u9A6C\u4E0A\u518D\u6765\u4E00\u6B21\u3002",
      apError: "\u884C\u52A8\u70B9\u4E0D\u591F\u4E86\u3002",
      depositOk: (amount) => `\u5B58\u5165\u673A\u5668 \xA5${amount}`,
      depositNotify: (amount) => `\u5DF2\u5B58\u5165 \xA5${amount}`,
      depositError: "\u6CA1\u6709\u53EF\u5B58\u8FDB\u53BB\u7684\u73B0\u91D1\u3002",
      withdrawOk: (amount) => `\u53D6\u51FA \xA5${amount}`,
      withdrawNotify: (amount) => `\u5DF2\u53D6\u51FA \xA5${amount}`,
      withdrawError: "\u673A\u5668\u91CC\u6CA1\u6709\u4F59\u989D\u3002",
      withdrawApError: "\u53D6\u51FA\u9700\u8981 1 \u70B9\u884C\u52A8\u3002",
      segmentMessages: {
        small_win: (amount) => `\u5C0F\u8D62 +\xA5${amount}`,
        mid_win: (amount) => `\u4E2D\u8D62 +\xA5${amount}`,
        big_win: (amount) => `\u5927\u8D62 +\xA5${amount}`,
        small_loss: (amount) => `\u5C0F\u4E8F -\xA5${amount}`,
        mid_loss: (amount) => `\u4E2D\u4E8F -\xA5${amount}`,
        double: (amount) => amount > 0 ? `\u7FFB\u500D\uFF01\u673A\u5668\u4F59\u989D\u6765\u5230 \xA5${amount}` : "\u7FFB\u500D\u5931\u8D25\uFF0C\u673A\u5668\u91CC\u5DF2\u7ECF\u6CA1\u6709\u4EC0\u4E48\u53EF\u7FFB\u4E86\u3002",
        clear: (amount) => amount > 0 ? `\u6E05\u7A7A\uFF01\u84B8\u53D1\u4E86 \xA5${amount}` : "\u6E05\u7A7A\u843D\u5728\u7A7A\u4ED3\u4E0A\uFF0C\u4EC0\u4E48\u4E5F\u6CA1\u53D1\u751F\u3002",
        default: "\u6570\u5B57\u95EA\u4E86\u4E00\u4E0B\u3002"
      }
    },
    work: {
      title: "\u7CFB\u7EDF\u7EF4\u62A4 \u2014 \u5728\u7EFF\u8272\u533A\u57DF\u70B9\u4E0B\u53BB",
      progress: (round, total, required) => `\u8FDB\u5EA6 ${round}/${total} \xB7 \u9700\u8981\u547D\u4E2D ${required} \u6B21`,
      penalty: (level) => `\u4E0A\u763E ${level} \xB7 \u4F60\u7684\u624B\u5DF2\u7ECF\u6CA1\u6709\u521A\u5F00\u59CB\u90A3\u4E48\u7A33\u4E86\u3002`,
      hit: "\u547D\u4E2D",
      miss: "\u504F\u4E86",
      success: (amount) => `\u7EF4\u62A4\u5B8C\u6210\uFF0C\u62FF\u5230 \xA5${amount}\u3002`,
      fail: (amount) => `\u4F60\u52C9\u5F3A\u505A\u5B8C\u4E86\uFF0C\u53EA\u62FF\u5230 \xA5${amount}\u3002`,
      addictionNote: " \u56E0\u4E3A\u4E0A\u763E\uFF0C\u4F60\u4ECA\u5929\u7684\u6548\u7387\u4E5F\u8DDF\u7740\u6389\u4E0B\u53BB\u4E86\u3002",
      locked: "\u5DE5\u4F5C\u8FD8\u6CA1\u5F00\u653E\u3002",
      alreadyDone: "\u8FD9\u5468\u5DF2\u7ECF\u5DE5\u4F5C\u8FC7\u4E86\u3002",
      noAp: "\u884C\u52A8\u70B9\u4E0D\u591F\u4E86\u3002",
      repair: "\u4FEE\u590D"
    },
    endings: {
      demo_stub: {
        title: "Demo \u672A\u5B8C\u5F85\u7EED",
        body: "\u8FD9\u4E00\u6BB5\u8FD8\u6CA1\u5199\u5B8C\uFF0C\u4F46\u73B0\u5728\u4F60\u5DF2\u7ECF\u4E0D\u4F1A\u5728\u8FD9\u91CC\u770B\u5230\u5B83\u4E86\u3002"
      },
      rules_quit: {
        title: "\u53CA\u65F6\u79BB\u5F00\u7684\u4EBA",
        body: "\u4F60\u5728\u6700\u5F00\u59CB\u5C31\u5173\u6389\u4E86\u90A3\u6247\u95E8\u3002\u540E\u6765\u5F88\u591A\u4E2A\u591C\u91CC\uFF0C\u4F60\u5076\u5C14\u4E5F\u4F1A\u60F3\u8D77\u90A3\u4E2A\u6587\u4EF6\u540D\uFF0C\u4F46\u5B83\u4E0D\u518D\u50CF\u8BF1\u60D1\uFF0C\u66F4\u50CF\u4E00\u6B21\u9669\u4E9B\u5931\u624B\u7684\u64E6\u80A9\u800C\u8FC7\u3002"
      },
      stop_after_1: {
        title: "\u89C1\u597D\u5C31\u6536\u7684\u4EBA",
        body: "\u7B2C\u4E00\u628A\u8D62\u4E86\u4EE5\u540E\uFF0C\u4F60\u8FD8\u662F\u505C\u4F4F\u4E86\u3002\u90A3\u4E00\u665A\u4F60\u6CA1\u6709\u53D8\u5F97\u66F4\u5F3A\uFF0C\u53EA\u662F\u6CA1\u6709\u628A\u201C\u518D\u6765\u4E00\u6B21\u201D\u5F53\u6210\u5FC5\u987B\u6267\u884C\u7684\u547D\u4EE4\u3002"
      },
      stop_after_2: {
        title: "\u6709\u514B\u5236\u529B\u7684\u4EBA",
        body: "\u6700\u8212\u670D\u7684\u65F6\u5019\u5F80\u5F80\u6700\u96BE\u505C\u3002\u53EF\u4F60\u504F\u504F\u5728\u90A3\u4E2A\u65F6\u5019\u5173\u6389\u4E86\u9875\u9762\u3002\u540E\u6765\u4F60\u4F1A\u660E\u767D\uFF0C\u8FD9\u6BD4\u8D62\u90A3\u4E00\u767E\u591A\u5757\u66F4\u96BE\uFF0C\u4E5F\u66F4\u503C\u94B1\u3002"
      },
      stop_after_3: {
        title: "\u53CA\u65F6\u56DE\u5934\u7684\u4EBA",
        body: "\u4E8F\u6389\u4E00\u70B9\u4EE5\u540E\uFF0C\u4F60\u7EC8\u4E8E\u628A\u624B\u4ECE\u6309\u94AE\u4E0A\u6536\u56DE\u6765\u3002\u4E0D\u662F\u56E0\u4E3A\u5B8C\u5168\u6E05\u9192\u4E86\uFF0C\u800C\u662F\u56E0\u4E3A\u90A3\u4E00\u4E0B\u75BC\u5F97\u521A\u597D\u591F\u8BA9\u4F60\u8BB0\u4F4F\u3002"
      },
      quit_colleague: {
        title: "\u6709\u4EBA\u5728\u7B49\u4F60\u56DE\u5BB6",
        body: "\u95E8\u53E3\u90A3\u53E5\u968F\u53E3\u7684\u63D0\u9192\uFF0C\u628A\u4F60\u4ECE\u5C4F\u5E55\u524D\u62FD\u51FA\u6765\u4E86\u4E00\u70B9\u3002\u4F60\u56DE\u5230\u5BB6\u65F6\uFF0C\u6C64\u5DF2\u7ECF\u6E29\u4E86\u4E24\u904D\uFF0C\u4F46\u81F3\u5C11\u8FD8\u70ED\u7740\u3002\u6709\u4EBA\u7B49\u4F60\uFF0C\u4E0D\u662F\u4E00\u4EF6\u53EF\u4EE5\u8F7B\u6613\u62FF\u53BB\u6362\u6570\u5B57\u7684\u4E8B\u3002"
      },
      phone_dead: {
        title: "\u88AB\u8FEB\u4E2D\u65AD\u7684\u4EBA",
        body: "\u624B\u673A\u6CA1\u7535\u7684\u90A3\u4E00\u523B\uFF0C\u4F60\u7B2C\u4E00\u6B21\u770B\u89C1\u81EA\u5DF1\u88AB\u9ED1\u5C4F\u6620\u51FA\u6765\u7684\u6837\u5B50\u3002\u53EF\u771F\u6B63\u53EF\u6015\u7684\u4E0D\u662F\u65AD\u6389\uFF0C\u800C\u662F\u4F60\u77E5\u9053\u53EA\u8981\u5B83\u4EAE\u8D77\u6765\uFF0C\u4F60\u5F88\u53EF\u80FD\u8FD8\u4F1A\u56DE\u53BB\u3002"
      },
      perfect: {
        title: "\u56DE\u5BB6\u7684\u4EBA",
        body: "\u4F60\u6CA1\u6709\u628A\u8FD9\u4E00\u5207\u90FD\u5904\u7406\u5F97\u5B8C\u7F8E\u3002\u8D26\u5355\u8FD8\u5728\uFF0C\u75B2\u60EB\u4E5F\u8FD8\u5728\u3002\u4F46\u4F60\u7EC8\u7A76\u5728\u6700\u540E\u4E00\u6B21\u628A\u624B\u6536\u4E86\u56DE\u6765\uFF0C\u628A\u8FD8\u6CA1\u5F7B\u5E95\u4E22\u6389\u7684\u90A3\u90E8\u5206\u81EA\u5DF1\u4E00\u70B9\u70B9\u62FD\u56DE\u73B0\u5B9E\uFF0C\u7136\u540E\u56DE\u5230\u4E86\u90A3\u76CF\u4E00\u76F4\u66FF\u4F60\u7559\u7740\u7684\u706F\u4E0B\u3002"
      },
      awaken: {
        title: "\u5E61\u7136\u9192\u609F",
        body: "\u4F60\u5E76\u4E0D\u662F\u6BEB\u53D1\u65E0\u635F\u5730\u79BB\u5F00\u3002\u73B0\u5B9E\u4ECD\u65E7\u6709\u4E8F\u7A7A\uFF0C\u5173\u7CFB\u4E5F\u5DF2\u7ECF\u88AB\u62D6\u51FA\u7EC6\u7EC6\u7684\u88C2\u75D5\u3002\u53EF\u5728\u6700\u540E\u4E00\u4E0B\u4E4B\u524D\uFF0C\u4F60\u7EC8\u4E8E\u627F\u8BA4\u81EA\u5DF1\u4E0D\u662F\u5728\u201C\u653E\u677E\u201D\uFF0C\u800C\u662F\u5728\u628A\u65E5\u5B50\u4E00\u70B9\u70B9\u8F93\u7ED9\u4E00\u4E2A\u6309\u94AE\u3002"
      },
      stop_loss: {
        title: "\u53CA\u65F6\u6B62\u635F",
        body: "\u4F60\u505C\u4E0B\u6765\u7684\u65F6\u5019\uFF0C\u4EE3\u4EF7\u5DF2\u7ECF\u4E0D\u8F7B\u4E86\u3002\u90A3\u4E9B\u88AB\u62D6\u5EF6\u7684\u8D26\u5355\u3001\u6CA1\u56DE\u7684\u6D88\u606F\u3001\u4E00\u6B21\u6B21\u62FF\u53BB\u548C\u6309\u94AE\u4EA4\u6362\u7684\u591C\u665A\uFF0C\u90FD\u8981\u6162\u6162\u8865\u56DE\u6765\u3002\u53EF\u603B\u5F52\uFF0C\u6BD4\u7EE7\u7EED\u5F80\u4E0B\u6389\u8981\u597D\u3002"
      },
      ruin: {
        title: "\u6C89\u6CA6",
        body: "\u4F60\u8FD8\u662F\u6309\u4E86\u4E0B\u53BB\u3002\u90A3\u4E00\u4E0B\u6CA1\u6709\u4EFB\u4F55\u620F\u5267\u6027\u7684\u96F7\u9E23\uFF0C\u53EA\u6709\u719F\u6089\u7684\u6570\u5B57\u3001\u719F\u6089\u7684\u5FC3\u8DF3\uFF0C\u548C\u4E00\u4E2A\u4F60\u7EC8\u4E8E\u4E0D\u518D\u66FF\u81EA\u5DF1\u8FA9\u89E3\u7684\u4E8B\u5B9E\uFF1A\u4F60\u5DF2\u7ECF\u628A\u201C\u518D\u6765\u4E00\u6B21\u201D\u8FC7\u6210\u4E86\u751F\u6D3B\u672C\u8EAB\u3002"
      },
      memory: {
        title: "\u524D\u4E16\u8BB0\u5FC6",
        body: "\u4F60\u6CA1\u6709\u6309\u3002\u4E0D\u662F\u56E0\u4E3A\u8FD9\u4E00\u6B21\u6BD4\u4E0A\u4E00\u6B21\u66F4\u52C7\u6562\uFF0C\u800C\u662F\u56E0\u4E3A\u67D0\u79CD\u8BF4\u4E0D\u6E05\u7684\u75B2\u60EB\u6BD4\u8BF1\u60D1\u5148\u4E00\u6B65\u62B5\u8FBE\u3002\u4F60\u770B\u7740\u81EA\u5DF1\u5199\u4E0B\u7684\u90A3\u53E5\u8BDD\uFF0C\u50CF\u9694\u7740\u4E00\u5C42\u65E7\u68A6\uFF0C\u7EC8\u4E8E\u8BA4\u51FA\u4E86\u5B83\u662F\u5199\u7ED9\u8C01\u7684\u3002"
      },
      delusion: {
        title: "\u6267\u8FF7\u4E0D\u609F",
        body: "\u4F60\u660E\u660E\u77E5\u9053\u7ED3\u5C40\u662F\u4EC0\u4E48\uFF0C\u8FD8\u662F\u6309\u4E86\u4E0B\u53BB\u3002\u91CD\u6765\u7684\u8BB0\u5FC6\u6CA1\u6709\u6551\u4F60\uFF0C\u53CD\u800C\u8BA9\u4F60\u66F4\u4F1A\u66FF\u81EA\u5DF1\u627E\u501F\u53E3\u3002\u6700\u53EF\u6015\u7684\u4ECE\u6765\u4E0D\u662F\u4E0D\u77E5\u9053\uFF0C\u800C\u662F\u77E5\u9053\u4EE5\u540E\u8FD8\u613F\u610F\u7EE7\u7EED\u3002"
      }
    },
    endingStats: {
      cycles: "\u5468\u671F",
      gambles: "\u6309\u952E\u6B21\u6570",
      cash: "\u73B0\u91D1",
      virtual: "\u673A\u5668\u4F59\u989D",
      debt: "\u5F85\u8FD8"
    }
  };

  // js/endings.js
  var REPLAY_KEY = "biean_last_ending";
  var NON_REPLAY_ENDINGS = /* @__PURE__ */ new Set([
    "perfect",
    "awaken",
    "rules_quit",
    "stop_after_1",
    "stop_after_2",
    "stop_after_3",
    "quit_colleague",
    "early_family",
    "memory"
  ]);
  function getLastEnding() {
    try {
      return localStorage.getItem(REPLAY_KEY);
    } catch {
      return null;
    }
  }
  function saveLastEnding(id) {
    if (!id || NON_REPLAY_ENDINGS.has(id)) return;
    try {
      localStorage.setItem(REPLAY_KEY, id);
    } catch {
    }
  }
  function getDebtRatioFromState(state2) {
    const assets = state2.cash + state2.virtualBalance * BALANCE.debt.virtualWeight;
    return Math.max(0, state2.billTotal - assets) / state2.billTotal;
  }
  function determineFinalEnding({ pressed, state: state2, lastEnding = getLastEnding() }) {
    const ratio = getDebtRatioFromState(state2);
    const hasBadReplayMemory = Boolean(lastEnding && !NON_REPLAY_ENDINGS.has(lastEnding));
    if (pressed) {
      return hasBadReplayMemory ? "delusion" : "ruin";
    }
    if (hasBadReplayMemory) {
      return "memory";
    }
    if (ratio < BALANCE.debt.perfectRatio && state2.stats.gambleCount <= 4) {
      return "perfect";
    }
    if (ratio < BALANCE.debt.awakenRatio) {
      return "awaken";
    }
    return "stop_loss";
  }

  // js/gambling.js
  function formatSegmentMessage(segment, delta, useVirtual) {
    const abs = Math.abs(delta);
    const id = segment.id;
    const templates = COPY.gamble.segmentMessages;
    if (id === "double") return templates.double(getState().virtualBalance);
    if (id === "clear") return templates.clear(abs);
    if (segment.effect === "cash") {
      if (id === "small_win") return `${templates.small_win(abs)}\uFF08${segment.label}\uFF09`;
      if (id === "mid_win") return `${templates.mid_win(abs)}\uFF08${segment.label}\uFF09`;
      if (id === "big_win") return `${templates.big_win(abs)}\uFF08${segment.label}\uFF09`;
      return `+\xA5${abs}\uFF08${segment.label}\uFF09`;
    }
    if (segment.effect === "loss") {
      if (id === "small_loss") return `${templates.small_loss(abs)}\uFF08${segment.label}\uFF09`;
      if (id === "mid_loss") return `${templates.mid_loss(abs)}\uFF08${segment.label}\uFF09`;
      return `-\xA5${abs}\uFF08${segment.label}\uFF09`;
    }
    return templates.default;
  }
  function spinOnce(useVirtual = true) {
    const state2 = getState();
    const wheel = getDynamicWheel(state2.cycle || 1, state2.mood.addiction);
    const segment = pickWeighted(wheel);
    let delta = 0;
    let message = "";
    switch (segment.effect) {
      case "cash": {
        const gain = randRange(segment.range);
        if (useVirtual && state2.virtualBalance > 0) {
          addVirtual(gain);
        } else {
          addCash(gain);
        }
        delta = gain;
        message = formatSegmentMessage(segment, gain, useVirtual);
        break;
      }
      case "loss": {
        const loss = randRange(segment.range);
        if (useVirtual && state2.virtualBalance >= loss) {
          addVirtual(-loss);
        } else {
          const fromCash = Math.min(state2.cash, loss);
          addCash(-fromCash);
          if (useVirtual && state2.virtualBalance > 0) {
            const rest = loss - fromCash;
            addVirtual(-Math.min(rest, state2.virtualBalance));
          }
        }
        delta = -loss;
        message = formatSegmentMessage(segment, -loss, useVirtual);
        break;
      }
      case "double": {
        const before = state2.virtualBalance;
        const doubled = Math.min(before * 2, 5e3);
        state2.virtualBalance = doubled;
        delta = doubled - before;
        message = formatSegmentMessage(segment, delta, true);
        break;
      }
      case "clear": {
        const cleared = state2.virtualBalance;
        state2.virtualBalance = 0;
        delta = -cleared;
        message = formatSegmentMessage(segment, delta, true);
        break;
      }
      default:
        message = COPY.gamble.segmentMessages.default;
    }
    return { segment, delta, message };
  }
  function gamble(spinCount = 1) {
    const state2 = getState();
    const results = [];
    let firstNarrative = null;
    const bet = randRange(BALANCE.gamble.betCash);
    if (state2.virtualBalance >= bet) {
      addVirtual(-bet);
    } else if (state2.cash >= bet) {
      addCash(-bet);
    } else if (state2.cash + state2.virtualBalance >= bet) {
      const fromV = state2.virtualBalance;
      addVirtual(-fromV);
      addCash(-(bet - fromV));
    }
    const prevCount = state2.flags.gamble_count;
    for (let i = 0; i < spinCount; i++) {
      const useVirtual = state2.virtualBalance > 0 || state2.flags.gamble_count > 0;
      results.push(spinOnce(useVirtual));
    }
    state2.flags.gamble_count += spinCount;
    state2.stats.gambleCount += spinCount;
    state2.flags.first_gamble_done = true;
    state2.flags.gamble_opened = true;
    state2.flags.triple_unlocked = state2.stats.gambleCount >= 5;
    state2.flags.ten_unlocked = state2.stats.gambleCount >= 10;
    if (prevCount === 0 && results.length > 0) {
      firstNarrative = results[0].delta >= 0 ? COPY.gamble.firstWin : COPY.gamble.firstLoss;
    }
    const addictionIdx = Math.min(state2.mood.addiction, 2);
    const chance = BALANCE.gamble.addictionChance[addictionIdx];
    let moodGained = null;
    if (Math.random() < chance + (spinCount > 1 ? 0.15 : 0)) {
      addMood("addiction", 1);
      moodGained = "addiction";
      results[results.length - 1].message += COPY.gamble.addictionEcho;
    }
    if (results.some((r) => r.delta < 0) && Math.random() < 0.15) {
      addMood("anxiety", 1);
      if (!moodGained) moodGained = "anxiety";
    }
    if (moodGained) {
      results[results.length - 1].moodGained = moodGained;
    }
    pushLog(`\u8D4C\u535A ${spinCount} \u6B21`);
    return { ok: true, results, firstNarrative };
  }
  function depositToMachine(amount) {
    const state2 = getState();
    const amt = Math.min(Math.max(0, amount), state2.cash);
    if (amt <= 0) return { ok: false, error: COPY.gamble.depositError };
    addCash(-amt);
    addVirtual(amt);
    state2.flags.gamble_opened = true;
    state2.flags.machine_deposit_total = (state2.flags.machine_deposit_total || 0) + amt;
    pushLog(`\u5B58\u5165\u673A\u5668 \xA5${amt}`);
    return { ok: true, amount: amt };
  }
  function withdrawFromMachine() {
    const state2 = getState();
    if (state2.virtualBalance <= 0) {
      return { ok: false, error: COPY.gamble.withdrawError };
    }
    if (!spendAp(1)) {
      return { ok: false, error: COPY.gamble.withdrawApError };
    }
    const maxOut = randRange(BALANCE.withdraw);
    const amt = Math.min(state2.virtualBalance, maxOut);
    addVirtual(-amt);
    addCash(amt);
    pushLog(`\u4ECE\u673A\u5668\u53D6\u51FA \xA5${amt}`);
    return { ok: true, amount: amt };
  }

  // js/audio.js
  var STORAGE_KEY = "biean_mute";
  var ctx = null;
  var muted = false;
  function ensureCtx() {
    if (!ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctx = new AC();
      } catch {
        return null;
      }
    }
    if (!ctx) return null;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {
      });
    }
    return ctx;
  }
  function setMuted(value) {
    muted = !!value;
    try {
      localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
    } catch {
    }
    updateMuteButton();
  }
  function toggleMute() {
    setMuted(!muted);
    if (!muted) play("click");
  }
  var muteBusy = false;
  function initAudio() {
    try {
      muted = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      muted = false;
    }
    updateMuteButton();
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#btn-mute")) return;
      if (muteBusy) return;
      muteBusy = true;
      try {
        ensureCtx();
      } catch {
      }
      toggleMute();
      queueMicrotask(() => {
        muteBusy = false;
      });
    });
    document.addEventListener(
      "click",
      () => ensureCtx(),
      { once: true, capture: true }
    );
  }
  function updateMuteButton() {
    const btn = document.getElementById("btn-mute");
    if (!btn) return;
    btn.textContent = muted ? "\u{1F507}" : "\u{1F50A}";
    btn.title = muted ? "\u5F00\u542F\u97F3\u6548" : "\u9759\u97F3";
    btn.setAttribute("aria-pressed", muted ? "true" : "false");
  }
  function tone(freq, duration, type = "sine", gain = 0.12, when = 0) {
    const ac = ensureCtx();
    if (!ac || muted) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(1e-3, t0 + duration);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }
  function noise(duration, gain = 0.06) {
    const ac = ensureCtx();
    if (!ac || muted) return;
    const t0 = ac.currentTime;
    const bufferSize = ac.sampleRate * duration;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = ac.createBufferSource();
    const g = ac.createGain();
    src.buffer = buffer;
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(1e-3, t0 + duration);
    src.connect(g);
    g.connect(ac.destination);
    src.start(t0);
  }
  var SFX = {
    click() {
      tone(880, 0.06, "square", 0.06);
      tone(1200, 0.04, "sine", 0.04, 0.02);
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, "sine", 0.1, i * 0.1));
    },
    loss() {
      tone(220, 0.25, "sawtooth", 0.08);
      tone(180, 0.35, "sawtooth", 0.06, 0.08);
      noise(0.15, 0.04);
    },
    notify() {
      tone(660, 0.08, "sine", 0.09);
      tone(880, 0.12, "sine", 0.07, 0.08);
    },
    dayEnd() {
      tone(392, 0.3, "triangle", 0.08);
      tone(294, 0.5, "triangle", 0.06, 0.25);
    },
    start() {
      [262, 392, 523, 659].forEach((f, i) => tone(f, 0.16, "triangle", 0.08, i * 0.08));
    },
    cardPick() {
      tone(740, 0.06, "square", 0.05);
      tone(980, 0.08, "triangle", 0.04, 0.04);
    },
    windowOpen() {
      tone(520, 0.08, "square", 0.05);
      tone(700, 0.1, "triangle", 0.04, 0.03);
    },
    windowClose() {
      tone(320, 0.09, "triangle", 0.05);
    },
    windowMinimize() {
      tone(410, 0.06, "triangle", 0.05);
      tone(280, 0.08, "triangle", 0.04, 0.04);
    },
    workHit() {
      tone(660, 0.05, "square", 0.05);
    },
    workMiss() {
      tone(220, 0.08, "sawtooth", 0.04);
    },
    tension() {
      const ac = ensureCtx();
      if (!ac || muted) return;
      const t0 = ac.currentTime;
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(55, t0);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.04, t0 + 0.8);
      g.gain.linearRampToValueAtTime(0.02, t0 + 2.5);
      osc.connect(g);
      g.connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + 2.6);
    },
    endingGood() {
      [392, 494, 587, 784].forEach((f, i) => tone(f, 0.35, "sine", 0.09, i * 0.15));
    },
    endingBad() {
      tone(130, 0.6, "sawtooth", 0.1);
      tone(98, 0.9, "sawtooth", 0.08, 0.2);
      noise(0.4, 0.05);
    },
    gamble() {
      tone(440, 0.05, "square", 0.05);
      tone(330, 0.08, "triangle", 0.04, 0.04);
    }
  };
  function play(name) {
    try {
      SFX[name]?.();
    } catch {
    }
  }
  function bindButtonSounds() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn, .gamble-btn, .taskbar-app, .file-card");
      if (btn && !btn.disabled) play("click");
    }, true);
  }

  // js/work.js
  function startWorkQTE(container, onComplete) {
    const state2 = getState();
    if (!state2.flags.work_unlocked) {
      onComplete({ success: false, income: 0, message: COPY.work.locked });
      return;
    }
    if (state2.flags.worked_this_cycle) {
      onComplete({ success: false, income: 0, message: COPY.work.alreadyDone });
      return;
    }
    if (!spendAp2(1)) {
      onComplete({ success: false, income: 0, message: COPY.work.noAp });
      return;
    }
    const cfg = BALANCE.work;
    const speedMult = getWorkSpeedMultiplier();
    const addiction = state2.mood.addiction;
    let hits = 0;
    let round = 0;
    let active = true;
    const penaltyHint = addiction >= 1 ? `<p class="work-qte-hint work-penalty">${COPY.work.penalty(addiction)}</p>` : "";
    container.innerHTML = `
    <div class="work-qte">
      <p class="work-qte-title">${COPY.work.title}</p>
      <p class="work-qte-hint">${COPY.work.progress(0, cfg.totalHits, cfg.hitsRequired)}</p>
      ${penaltyHint}
      <div class="work-bar">
        <div class="work-target" id="work-target"></div>
        <div class="work-cursor" id="work-cursor"></div>
      </div>
      <button type="button" class="btn btn-primary" id="work-hit">${COPY.work.repair}</button>
      <p class="work-feedback" id="work-feedback"></p>
    </div>
  `;
    const target = container.querySelector("#work-target");
    const cursor = container.querySelector("#work-cursor");
    const feedback = container.querySelector("#work-feedback");
    const roundEl = container.querySelector(".work-qte-hint");
    const hitBtn = container.querySelector("#work-hit");
    let animId = 0;
    let pos = 0;
    let dir = 1;
    const baseSpeed = 1.15 + Math.random() * 0.75;
    const speed = baseSpeed * speedMult;
    function layoutTarget() {
      const shrink = addiction >= 2 ? 0.9 : 1;
      const left = 12 + Math.random() * 48;
      const width = (18 + Math.random() * 18) * shrink;
      target.style.left = `${left}%`;
      target.style.width = `${width}%`;
    }
    function animate() {
      if (!active) return;
      pos += dir * speed;
      if (pos >= 100) {
        pos = 100;
        dir = -1;
      }
      if (pos <= 0) {
        pos = 0;
        dir = 1;
      }
      cursor.style.left = `${pos}%`;
      animId = requestAnimationFrame(animate);
    }
    layoutTarget();
    animate();
    hitBtn.addEventListener("click", () => {
      if (!active) return;
      const tLeft = parseFloat(target.style.left);
      const tWidth = parseFloat(target.style.width);
      const hit = pos >= tLeft && pos <= tLeft + tWidth;
      round += 1;
      if (hit) {
        hits += 1;
        feedback.textContent = COPY.work.hit;
        feedback.className = "work-feedback good";
        play("workHit");
      } else {
        feedback.textContent = COPY.work.miss;
        feedback.className = "work-feedback bad";
        play("workMiss");
      }
      roundEl.textContent = COPY.work.progress(round, cfg.totalHits, cfg.hitsRequired);
      if (round >= cfg.totalHits) {
        finish();
      } else {
        layoutTarget();
      }
    });
    function finish() {
      active = false;
      cancelAnimationFrame(animId);
      state2.flags.worked_this_cycle = true;
      state2.stats.workCount += 1;
      const success = hits >= cfg.hitsRequired;
      if (success) state2.stats.workSuccess += 1;
      const incomeMult = getWorkIncomeMultiplier();
      let income = success ? randRange(cfg.success) : randRange(cfg.fail);
      income = Math.round(income * incomeMult);
      addCash(income);
      const moodsGained = [];
      if (success) {
        addMood("stable", 1);
        moodsGained.push("stable");
        if (Math.random() < cfg.diligentBonusChance) {
          addMood("diligent", 1);
          moodsGained.push("diligent");
        }
      }
      pushLog(success ? `\u5DE5\u4F5C\u6210\u529F +\xA5${income}` : `\u5DE5\u4F5C\u52C9\u5F3A +\xA5${income}`);
      let message = success ? COPY.work.success(income) : COPY.work.fail(income);
      if (incomeMult < 1) {
        message += COPY.work.addictionNote;
      }
      onComplete({ success, income, message, moodsGained });
    }
  }

  // js/story-logic.js
  function mergeContent(base, overrides) {
    if (Array.isArray(base)) {
      return Array.isArray(overrides) ? [...overrides] : [...base];
    }
    if (base && typeof base === "object") {
      const result = { ...base };
      if (!overrides || typeof overrides !== "object") {
        return result;
      }
      Object.entries(overrides).forEach(([key, value]) => {
        const baseValue = result[key];
        if (Array.isArray(value)) {
          result[key] = [...value];
        } else if (value && typeof value === "object" && !Array.isArray(value) && typeof value !== "function") {
          result[key] = mergeContent(baseValue && typeof baseValue === "object" ? baseValue : {}, value);
        } else {
          result[key] = value;
        }
      });
      return result;
    }
    return overrides ?? base;
  }
  function getStoryFacts(state2) {
    const gambleCount = Math.max(state2.stats?.gambleCount || 0, state2.flags?.gamble_count || 0);
    const hasOpenedGamble = Boolean(
      state2.flags?.gamble_opened || state2.flags?.friend_link_seen || state2.flags?.machine_deposit_total > 0 || state2.virtualBalance > 0
    );
    const hasPressedGamble = Boolean(gambleCount > 0 || state2.flags?.first_gamble_done);
    return {
      gambleStage: hasPressedGamble ? "pressed" : hasOpenedGamble ? "seen" : "none",
      hasOpenedGamble,
      hasPressedGamble,
      hasFamilyHistory: Boolean(
        state2.flags?.family_branch_count > 0 || state2.flags?.family_reply_count > 0 || state2.flags?.drawing_seen
      ),
      hasWorkHistory: Boolean(
        state2.flags?.work_branch_count > 0 || state2.stats?.workCount > 0
      ),
      hasBillHistory: Boolean(
        state2.flags?.bill_seen || state2.billPaid > 0
      )
    };
  }
  var OPENING_VARIANTS = {
    2: {
      none: [
        "\u7B2C\u4E8C\u5468\u5F00\u59CB\u4E86\u3002",
        "\u4F60\u672C\u6765\u60F3\u5148\u770B\u5DE5\u4F5C\u7FA4\uFF0C\u53EF\u4EFB\u52A1\u680F\u4E0A\u90A3\u679A\u964C\u751F\u7684\u7EA2\u70B9\u4E00\u76F4\u6CA1\u4ECE\u4F59\u5149\u91CC\u6D88\u5931\u3002"
      ],
      seen: [
        "\u7B2C\u4E8C\u5468\u5F00\u59CB\u4E86\u3002",
        "\u4F60\u660E\u660E\u8FD8\u6CA1\u6309\u8FC7\u90A3\u9897\u6309\u94AE\uFF0C\u5374\u5DF2\u7ECF\u8BB0\u4F4F\u4E86\u5B83\u6302\u5728\u4EFB\u52A1\u680F\u4E0A\u7684\u6837\u5B50\u3002"
      ],
      pressed: COPY.cycles[2].opening
    },
    5: {
      none: [
        "\u7B2C\u4E94\u5468\uFF0C\u4E5F\u662F\u6700\u540E\u4E00\u591C\u3002",
        "\u4F60\u5176\u5B9E\u8FD8\u6CA1\u771F\u7684\u6309\u8FC7\u90A3\u9897\u6309\u94AE\uFF0C\u53EF\u8FD9\u51E0\u5468\u5B83\u4E00\u76F4\u50CF\u5F71\u5B50\u4E00\u6837\u8DDF\u7740\u4F60\u3002"
      ],
      seen: [
        "\u7B2C\u4E94\u5468\uFF0C\u4E5F\u662F\u6700\u540E\u4E00\u591C\u3002",
        "\u4F60\u8FD8\u6CA1\u771F\u7684\u6309\u8FC7\u5B83\uFF0C\u53EF\u4F60\u5DF2\u7ECF\u77E5\u9053\u81EA\u5DF1\u4E0D\u662F\u7B2C\u4E00\u6B21\u628A\u9F20\u6807\u79FB\u5230\u5B83\u4E0A\u9762\u3002"
      ],
      pressed: COPY.cycles[5].opening
    }
  };
  var BRANCH_VARIANTS = {
    "2.gamble_again": {
      none: {
        pick: [
          "\u4F60\u628A\u3010\u7EA2\u70B9\u95EA\u70C1\u3011\u63A8\u8FDB\u884C\u52A8\u683C\u3002",
          "\u660E\u660E\u8FD8\u6CA1\u771F\u6B63\u78B0\u8FC7\u5B83\uFF0C\u53EF\u4F60\u8FD8\u662F\u60F3\u77E5\u9053\u90A3\u6247\u95E8\u540E\u9762\u5230\u5E95\u6709\u4EC0\u4E48\u3002"
        ],
        chat: [
          { from: "\u963F\u51EF", text: "\u6628\u665A\u4F60\u6CA1\u70B9\u5427\uFF1F\u5176\u5B9E\u90A3\u73A9\u610F\u513F\u5C31\u662F\u56FE\u4E2A\u523A\u6FC0\u3002" },
          { from: "\u963F\u51EF", text: "\u771F\u8981\u8BD5\u5C31\u6309\u4E00\u4E0B\uFF0C\u4E0D\u81F3\u4E8E\u600E\u6837\u3002" }
        ],
        intro: [
          "\u4F60\u7B2C\u4E00\u6B21\u628A\u7F51\u9875\u5B8C\u6574\u70B9\u5F00\u3002",
          "\u6309\u94AE\u5B89\u9759\u5730\u4EAE\u7740\uFF0C\u50CF\u662F\u5728\u7B49\u4F60\u628A\u201C\u53EA\u662F\u770B\u4E00\u773C\u201D\u8BF4\u6210\u771F\u7684\u3002"
        ]
      },
      seen: {
        pick: [
          "\u4F60\u628A\u3010\u7EA2\u70B9\u95EA\u70C1\u3011\u63A8\u8FDB\u884C\u52A8\u683C\u3002",
          "\u4F60\u6CA1\u6309\u8FC7\u5B83\uFF0C\u5374\u5DF2\u7ECF\u5728\u8111\u5B50\u91CC\u7ED9\u5B83\u7559\u4E86\u4F4D\u7F6E\u3002"
        ],
        chat: [
          { from: "\u963F\u51EF", text: "\u6628\u665A\u7814\u7A76\u5B8C\u6CA1\uFF1F\u5176\u5B9E\u6309\u4E0D\u6309\u90FD\u968F\u4F60\uFF0C\u522B\u8001\u60E6\u8BB0\u7740\u5C31\u884C\u3002" },
          { from: "\u963F\u51EF", text: "\u5F53\u7136\uFF0C\u4F60\u8981\u662F\u771F\u60F3\u8BD5\uFF0C\u4E00\u4E0B\u5C31\u591F\u4F60\u8BB0\u4F4F\u4E86\u3002" }
        ],
        intro: [
          "\u4F60\u53C8\u628A\u7F51\u9875\u7FFB\u4E86\u51FA\u6765\u3002",
          "\u4E0A\u6B21\u4F60\u505C\u5728\u6309\u94AE\u524D\uFF0C\u8FD9\u4E00\u6B21\u9F20\u6807\u8FD8\u662F\u6162\u6162\u632A\u4E86\u8FC7\u53BB\u3002"
        ]
      }
    },
    "3.gamble_big": {
      none: {
        pick: [
          "\u4F60\u628A\u3010\u538B\u5927\u4E00\u70B9\u3011\u63A8\u8FDB\u4E86\u884C\u52A8\u683C\u3002",
          "\u771F\u6B63\u53EF\u6015\u7684\u4E0D\u662F\u5DF2\u7ECF\u6C89\u8FDB\u53BB\uFF0C\u800C\u662F\u4F60\u5F00\u59CB\u60F3\uFF1A\u5982\u679C\u603B\u8981\u8BD5\uFF0C\u4E0D\u5982\u4E00\u6B21\u538B\u5F97\u66F4\u91CD\u3002"
        ],
        intro: [
          "\u963F\u51EF\u6CA1\u6709\u518D\u53D1\u6D88\u606F\u3002",
          "\u662F\u4F60\u81EA\u5DF1\u628A\u90A3\u9897\u6309\u94AE\u548C\u8D26\u5355\u653E\u5230\u4E86\u4E00\u8D77\uFF0C\u8D8A\u60F3\u8D8A\u8FD1\u3002"
        ]
      },
      seen: {
        pick: [
          "\u4F60\u628A\u3010\u538B\u5927\u4E00\u70B9\u3011\u63A8\u8FDB\u4E86\u884C\u52A8\u683C\u3002",
          "\u4E0A\u6B21\u4F60\u505C\u5728\u6309\u94AE\u524D\uFF0C\u53EF\u90A3\u79CD\u6CA1\u505A\u5B8C\u7684\u611F\u89C9\u5E76\u6CA1\u6709\u8DDF\u7740\u505C\u4E0B\u3002"
        ],
        intro: [
          "\u963F\u51EF\u6CA1\u6709\u518D\u53D1\u6D88\u606F\u3002",
          "\u4F60\u5374\u5DF2\u7ECF\u80FD\u81EA\u5DF1\u628A\u90A3\u4E2A\u9875\u9762\u5728\u8111\u5B50\u91CC\u91CD\u65B0\u70B9\u5F00\u3002"
        ]
      }
    },
    "5.one_more_gamble": {
      none: {
        pick: [
          "\u4F60\u628A\u3010\u7EA2\u952E\u8BF1\u60D1\u3011\u63A8\u8FDB\u4E86\u884C\u52A8\u683C\u3002",
          "\u4F60\u7EC8\u4E8E\u4E0D\u518D\u8BF4\u201C\u5148\u770B\u770B\u201D\uFF0C\u800C\u662F\u627F\u8BA4\u81EA\u5DF1\u60F3\u77E5\u9053\u6309\u4E0B\u53BB\u4EE5\u540E\u4F1A\u53D1\u751F\u4EC0\u4E48\u3002"
        ],
        prompt: "\u4ECA\u665A\uFF0C\u4F60\u8981\u600E\u4E48\u505A\uFF1F",
        choices: {
          press: "\u6309\u4E0B\u53BB\u8BD5\u8BD5",
          stop: "\u8FD8\u662F\u4E0D\u6309"
        },
        stopLines: [
          "\u4F60\u76EF\u7740\u6309\u94AE\u770B\u4E86\u5F88\u4E45\uFF0C\u6700\u540E\u8FD8\u662F\u6CA1\u6709\u8BA9\u7B2C\u4E00\u6B21\u53D1\u751F\u3002",
          "\u8FD9\u4E0D\u662F\u8F7B\u677E\u7684\u80DC\u5229\uFF0C\u66F4\u50CF\u662F\u628A\u4E00\u573A\u5DEE\u70B9\u6210\u771F\u7684\u4E8B\u786C\u751F\u751F\u6309\u4E86\u56DE\u53BB\u3002"
        ]
      },
      seen: {
        pick: [
          "\u4F60\u628A\u3010\u7EA2\u952E\u8BF1\u60D1\u3011\u63A8\u8FDB\u4E86\u884C\u52A8\u683C\u3002",
          "\u4F60\u4E00\u76F4\u505C\u5728\u95E8\u53E3\uFF0C\u8FD9\u4E00\u665A\u624D\u7EC8\u4E8E\u628A\u201C\u8981\u4E0D\u8981\u6309\u201D\u6446\u5230\u81EA\u5DF1\u9762\u524D\u3002"
        ],
        prompt: "\u8FD9\u4E00\u6B21\uFF0C\u4F60\u8981\u4E0D\u8981\u771F\u7684\u6309\u4E0B\u53BB\uFF1F",
        choices: {
          press: "\u8FD9\u6B21\u6309\u4E0B\u53BB",
          stop: "\u7EE7\u7EED\u5FCD\u4F4F"
        },
        stopLines: [
          "\u4F60\u76EF\u7740\u6309\u94AE\u770B\u4E86\u5F88\u4E45\uFF0C\u6700\u540E\u8FD8\u662F\u628A\u624B\u632A\u5F00\u4E86\u3002",
          "\u8FD9\u4E0D\u7B97\u5F7B\u5E95\u6446\u8131\uFF0C\u4F46\u81F3\u5C11\u8FD9\u6B21\u4F60\u6CA1\u8BA9\u90A3\u9053\u95E8\u771F\u7684\u5173\u4E0A\u4F60\u81EA\u5DF1\u3002"
        ]
      }
    }
  };
  var FINAL_VARIANTS = {
    none: {
      title: "\u9F20\u6807\u505C\u5728\u7EA2\u952E\u4E0A\u3002",
      body: "\u5C4F\u5E55\u91CC\u7684\u7EA2\u6309\u94AE\u8FD8\u5728\u4E00\u660E\u4E00\u706D\u3002\u4F60\u8FD8\u6CA1\u771F\u6B63\u6309\u8FC7\u5B83\uFF0C\u4F46\u8FD9\u51E0\u5468\u4F60\u4E00\u76F4\u5728\u628A\u81EA\u5DF1\u5F80\u8FD9\u91CC\u5E26\u3002",
      press: "\u6309\u4E0B\u53BB",
      notPress: "\u5173\u6389\u5B83"
    },
    seen: {
      title: "\u8FD9\u4E00\u6B21\uFF0C\u4F60\u628A\u624B\u653E\u5728\u9F20\u6807\u4E0A\u3002",
      body: "\u7EA2\u6309\u94AE\u8FD8\u662F\u4E00\u660E\u4E00\u706D\u3002\u4F60\u6CA1\u771F\u6B63\u6309\u8FC7\uFF0C\u53EF\u4F60\u77E5\u9053\u81EA\u5DF1\u4E0D\u662F\u7B2C\u4E00\u6B21\u505C\u5728\u8FD9\u91CC\u3002",
      press: "\u8FD9\u6B21\u6309\u4E0B\u53BB",
      notPress: "\u7EE7\u7EED\u4E0D\u6309"
    },
    pressed: {
      title: COPY.final.title,
      body: COPY.final.body,
      press: COPY.final.press,
      notPress: COPY.final.notPress
    }
  };
  function resolveCycleOpening(cycle, state2) {
    const facts = getStoryFacts(state2);
    return OPENING_VARIANTS[cycle]?.[facts.gambleStage] || COPY.cycles[cycle]?.opening || [];
  }
  function resolveBranchCopy(cycle, cardId, state2) {
    const branch = COPY.cycles[cycle]?.branches?.[cardId];
    if (!branch) return null;
    const facts = getStoryFacts(state2);
    const overrides = BRANCH_VARIANTS[`${cycle}.${cardId}`]?.[facts.gambleStage];
    if (!overrides) return branch;
    return mergeContent(branch, overrides);
  }
  function resolveFinalDecisionCopy(state2) {
    const facts = getStoryFacts(state2);
    const variant = FINAL_VARIANTS[facts.gambleStage] || FINAL_VARIANTS.pressed;
    const memoText = String(state2.flags?.memo_text || "").trim();
    const hasMemo = Boolean(state2.flags?.memo_done && memoText);
    return {
      title: variant.title,
      body: variant.body,
      replayPrefix: hasMemo ? COPY.final.replayPrefix : COPY.final.unwrittenPrefix,
      memoText: hasMemo ? memoText : COPY.memo.defaultText,
      pressLabel: variant.press,
      notPressLabel: variant.notPress
    };
  }

  // js/cards.js
  var uiCallbacks = null;
  var storyBusy = false;
  var MOOD_TOASTS = {
    addiction: COPY.notify.moodAddiction,
    stable: COPY.notify.moodStable,
    anxiety: COPY.notify.moodAnxiety,
    diligent: COPY.notify.moodDiligent
  };
  var CYCLE1_REWIND_NOTICE = "\u65F6\u95F4\u5411\u540E\u9000\u4E86\u4E00\u5C0F\u683C\u3002\u4F60\u56DE\u5230\u4E86\u90A3\u4E2A\u8FD8\u6765\u5F97\u53CA\u91CD\u9009\u7684\u65F6\u5019\u3002";
  function initCards(callbacks) {
    uiCallbacks = callbacks;
  }
  function isStoryBusy() {
    return storyBusy;
  }
  function getCycleCards() {
    return getCardsForCycle(getState().cycle);
  }
  async function beginCycle() {
    const state2 = getState();
    const cycleOpening = resolveCycleOpening(state2.cycle, state2);
    if (!COPY.cycles[state2.cycle]) return;
    state2.cycleResolved = false;
    state2.flags.card_picked = null;
    state2.story.bookmark = null;
    state2.story.cycleStartSave = createCycleStartSave();
    uiCallbacks.persistCycleStartSave?.(state2.story.cycleStartSave);
    uiCallbacks.openWindow("cards");
    uiCallbacks.renderCardTable(getCycleCards(), null);
    if (cycleOpening?.length) {
      await uiCallbacks.narrateSequential(cycleOpening);
    }
    uiCallbacks.setNarrativeChoices([]);
    await uiCallbacks.narrate(COPY.cards.ui.pickOne);
  }
  async function placeCard(cardId) {
    const state2 = getState();
    if (state2.cycleResolved || storyBusy || state2.phase !== "playing") return;
    const cards = getCardsForCycle(state2.cycle);
    if (!cards.some((card) => card.id === cardId)) return;
    state2.cycleResolved = true;
    state2.flags.card_picked = cardId;
    uiCallbacks.renderCardTable(cards, cardId);
    await uiCallbacks.narrate(COPY.cards.ui.forfeited);
    if (state2.cycle === 1) {
      await runCycle1Branch(cardId);
      return;
    }
    if (state2.cycle === 2) {
      await runCycle2Branch(cardId);
      return;
    }
    if (state2.cycle === 3) {
      await runCycle3Branch(cardId);
      return;
    }
    if (state2.cycle === 4) {
      await runCycle4Branch(cardId);
      return;
    }
    await runCycle5Branch(cardId);
  }
  async function runCycle1Branch(cardId) {
    const branch = resolveBranchCopy(1, cardId, getState());
    if (!branch) {
      await finishCycle();
      return;
    }
    switch (cardId) {
      case "friend_link":
        await runFriendLinkBranch(branch);
        break;
      case "work_report":
        await runWorkReportBranch(branch);
        break;
      case "wife_msg":
        await runWifeMsgBranch(branch);
        break;
      default:
        await finishCycle();
    }
  }
  async function runCycle2Branch(cardId) {
    const branch = resolveBranchCopy(2, cardId, getState());
    if (!branch) {
      await finishCycle();
      return;
    }
    storyBusy = true;
    try {
      if (cardId === "gamble_again") {
        await runGambleAgainBranch(branch);
        return;
      }
      if (cardId === "wife_breakfast") {
        await runWifeBreakfastBranch(branch);
        return;
      }
      if (cardId === "work_daily") {
        await runWorkBranch(branch);
        return;
      }
      await finishCycle();
    } finally {
      storyBusy = false;
    }
  }
  async function runCycle3Branch(cardId) {
    const branch = resolveBranchCopy(3, cardId, getState());
    if (!branch) {
      await finishCycle();
      return;
    }
    storyBusy = true;
    try {
      if (cardId === "work_hard") {
        await runWorkBranch(branch);
        return;
      }
      if (cardId === "gamble_big") {
        await runGambleBigBranch(branch);
        return;
      }
      if (cardId === "family_drawing") {
        await runFamilyDrawingBranch(branch);
        return;
      }
      await finishCycle();
    } finally {
      storyBusy = false;
    }
  }
  async function runCycle4Branch(cardId) {
    const branch = resolveBranchCopy(4, cardId, getState());
    if (!branch) {
      await finishCycle();
      return;
    }
    storyBusy = true;
    try {
      if (cardId === "bill_reminder") {
        await runBillReminderBranch(branch);
        return;
      }
      if (cardId === "memo_prompt") {
        await runMemoPromptBranch(branch);
        return;
      }
      if (cardId === "anxiety_ping") {
        await runAnxietyPingBranch(branch);
        return;
      }
      await finishCycle();
    } finally {
      storyBusy = false;
    }
  }
  async function runCycle5Branch(cardId) {
    const branch = resolveBranchCopy(5, cardId, getState());
    if (!branch) {
      await launchFinalDecision();
      return;
    }
    storyBusy = true;
    try {
      if (cardId === "final_prep") {
        await uiCallbacks.narrateSequential(branch.pick);
        await launchFinalDecision();
        return;
      }
      if (cardId === "family_wait") {
        await runFamilyWaitBranch(branch);
        return;
      }
      if (cardId === "one_more_gamble") {
        await runOneMoreGambleBranch(branch);
        return;
      }
      await launchFinalDecision();
    } finally {
      storyBusy = false;
    }
  }
  async function runWorkReportBranch(branch) {
    storyBusy = true;
    try {
      markWorkBranch();
      await uiCallbacks.narrateSequential(branch.pick);
      uiCallbacks.openWindow("work");
      await uiCallbacks.narrateSequential(branch.work);
      awardMood("diligent");
      await uiCallbacks.narrate(branch.done);
      await finishCycle();
    } finally {
      storyBusy = false;
    }
  }
  async function runWifeMsgBranch(branch) {
    storyBusy = true;
    try {
      markFamilyBranch();
      await uiCallbacks.narrateSequential(branch.pick);
      uiCallbacks.openWindow("family");
      appendMessages("family", branch.chat);
      const choice = await uiCallbacks.showChoices(
        [
          { id: "good", label: branch.replyGood, primary: true },
          { id: "late", label: branch.replyLate }
        ],
        "\u8981\u4E0D\u8981\u56DE\u5979\uFF1F"
      );
      if (choice === "good") {
        appendMessages("family", branch.replyGoodFollow);
        markFamilyReply();
        awardMood("stable");
      } else {
        appendMessages("family", branch.replyLateFollow);
        markFamilyReply();
        awardMood("anxiety");
      }
      await finishCycle();
    } finally {
      storyBusy = false;
    }
  }
  async function runFriendLinkBranch(branch) {
    storyBusy = true;
    try {
      const state2 = getState();
      state2.flags.friend_link_seen = true;
      state2.flags.gamble_opened = true;
      await uiCallbacks.narrateSequential(branch.pick);
      uiCallbacks.openWindow("chat");
      appendMessages("chat", branch.chat);
      uiCallbacks.openWindow("gamble");
      await uiCallbacks.narrateSequential(branch.openGamble);
      const asset = await uiCallbacks.showChoices(
        branch.assets.map((option) => ({
          id: String(option.id),
          label: option.label,
          desc: option.desc,
          primary: option.id === 300
        })),
        branch.assetPrompt
      );
      const amount = Number(asset) || 300;
      state2.flags.initial_asset = amount;
      const deposit = depositToMachine(Math.min(amount, getState().cash));
      if (!deposit.ok) {
        await uiCallbacks.narrate(COPY.gamble.depositError);
      }
      uiCallbacks.updateHUD();
      await uiCallbacks.narrate(branch.assetThought);
      await uiCallbacks.narrateSequential(branch.gambleReady);
      saveBookmark("c1_first_choice");
      const first = await uiCallbacks.showChoices(
        [
          { id: "try", label: branch.firstChoice.try, primary: true },
          { id: "rules", label: branch.firstChoice.rules }
        ],
        branch.firstChoice.prompt
      );
      if (first === "rules") {
        await showRules(branch);
        return;
      }
      await runPressSequence(branch);
    } finally {
      storyBusy = false;
    }
  }
  async function showRules(branch) {
    await uiCallbacks.narrate(`**${branch.rules.title}**`);
    await uiCallbacks.narrateSequential(branch.rules.body);
    saveBookmark("c1_after_rules");
    const pick = await uiCallbacks.showChoices(
      [
        { id: "continue", label: branch.rules.continue, primary: true },
        { id: "quit", label: branch.rules.quit }
      ],
      "\u770B\u5B8C\u4EE5\u540E\uFF0C\u4F60\u8FD8\u60F3\u7EE7\u7EED\u5417\uFF1F"
    );
    if (pick === "quit") {
      await uiCallbacks.narrateSequential(branch.rulesQuit);
      await showEarlyEnding("rules_quit", "c1_after_rules");
      return;
    }
    await runPressSequence(branch);
  }
  async function runPressSequence(branch) {
    await doScriptedPress(branch.press1, 50);
    saveBookmark("c1_after_press1");
    let pick = await uiCallbacks.showChoices([
      { id: "again", label: branch.press1.again, primary: true },
      { id: "stop", label: branch.press1.stop }
    ]);
    if (pick === "stop") {
      await uiCallbacks.narrateSequential(branch.stopAfter1);
      await showEarlyEnding("stop_after_1", "c1_after_press1");
      return;
    }
    await continueAfterPress1(branch);
  }
  async function continueAfterPress1(branch) {
    await doScriptedPress(branch.press2, 80);
    saveBookmark("c1_after_press2");
    const pick = await uiCallbacks.showChoices([
      { id: "again", label: branch.press2.again, primary: true },
      { id: "stop", label: branch.press2.stop }
    ]);
    if (pick === "stop") {
      await uiCallbacks.narrateSequential(branch.stopAfter2);
      await showEarlyEnding("stop_after_2", "c1_after_press2");
      return;
    }
    await continueAfterPress2(branch);
  }
  async function continueAfterPress2(branch) {
    await doScriptedPress(branch.press3, -120);
    saveBookmark("c1_after_press3");
    const pick = await uiCallbacks.showChoices([
      { id: "again", label: branch.press3.again, primary: true },
      { id: "stop", label: branch.press3.stop }
    ]);
    if (pick === "stop") {
      await uiCallbacks.narrateSequential(branch.stopAfter3);
      await showEarlyEnding("stop_after_3", "c1_after_press3");
      return;
    }
    await showColleagueDecision(branch);
  }
  async function showColleagueDecision(branch) {
    await uiCallbacks.narrateSequential(branch.colleague);
    saveBookmark("c1_colleague");
    const pick = await uiCallbacks.showChoices(
      [
        { id: "oneMore", label: branch.afterColleague.oneMore, primary: true },
        { id: "quit", label: branch.afterColleague.quit }
      ],
      branch.afterColleague.prompt
    );
    if (pick === "quit") {
      await uiCallbacks.narrateSequential(branch.quitAfterColleague);
      await showEarlyEnding("quit_colleague", "c1_colleague");
      return;
    }
    await uiCallbacks.narrateSequential(branch.press4.lines);
    await showEarlyEnding("phone_dead", "c1_colleague", true);
  }
  async function doScriptedPress(pressCopy, delta) {
    const state2 = getState();
    state2.stats.gambleCount += 1;
    state2.flags.gamble_count = (state2.flags.gamble_count || 0) + 1;
    state2.flags.gamble_opened = true;
    state2.flags.first_gamble_done = true;
    if (delta >= 0) {
      getState().virtualBalance += delta;
    } else {
      getState().virtualBalance = Math.max(0, getState().virtualBalance + delta);
    }
    if (delta >= 0) {
      awardMood("addiction");
    }
    uiCallbacks.renderWheelResult(pressCopy.result);
    uiCallbacks.setGambleLog(pressCopy.result);
    uiCallbacks.updateHUD();
    uiCallbacks.updateGambleButtons();
    await uiCallbacks.narrateSequential(pressCopy.lines);
  }
  async function runGambleAgainBranch(branch) {
    markGambleWindowSeen();
    await uiCallbacks.narrateSequential(branch.pick);
    uiCallbacks.openWindow("chat");
    appendMessages("chat", branch.chat);
    uiCallbacks.openWindow("gamble");
    await uiCallbacks.narrateSequential(branch.intro);
    const choice = await uiCallbacks.showChoices(
      [
        { id: "press", label: branch.choices.press, primary: true },
        { id: "store", label: branch.choices.store },
        { id: "close", label: branch.choices.close }
      ],
      branch.prompt
    );
    if (choice === "store") {
      const amount = Math.min(300, getState().cash);
      const result = depositToMachine(amount);
      if (result.ok) {
        uiCallbacks.setGambleLog(COPY.gamble.depositOk(result.amount));
        uiCallbacks.notify("\u673A\u5668", COPY.gamble.depositNotify(result.amount));
        uiCallbacks.updateHUD();
        await uiCallbacks.narrateSequential(branch.storeLines);
      } else {
        await uiCallbacks.narrate(result.error);
      }
      await finishCycle();
      return;
    }
    if (choice === "close") {
      await uiCallbacks.narrateSequential(branch.closeLines);
      await finishCycle();
      return;
    }
    const gambleResult = await executeGamble(1);
    if (gambleResult.ok) {
      await uiCallbacks.narrateSequential(gambleResult.netDelta >= 0 ? branch.resultGood : branch.resultBad);
    }
    await finishCycle();
  }
  async function runWifeBreakfastBranch(branch) {
    markFamilyBranch();
    await uiCallbacks.narrateSequential(branch.pick);
    uiCallbacks.openWindow("family");
    appendMessages("family", branch.chat);
    const choice = await uiCallbacks.showChoices(
      [
        { id: "good", label: branch.choices.good, primary: true },
        { id: "late", label: branch.choices.late }
      ],
      "\u4F60\u7684\u56DE\u590D\u4F1A\u7559\u4E0B\u75D5\u8FF9\u3002"
    );
    if (choice === "good") {
      appendMessages("family", branch.goodFollow);
      markFamilyReply();
      awardMood("stable");
    } else {
      appendMessages("family", branch.lateFollow);
      markFamilyReply();
      awardMood("anxiety");
    }
    await finishCycle();
  }
  async function runWorkBranch(branch) {
    markWorkBranch();
    await uiCallbacks.narrateSequential(branch.pick);
    uiCallbacks.openWindow("work");
    if (branch.intro?.length) {
      await uiCallbacks.narrateSequential(branch.intro);
    }
    const area = uiCallbacks.getWorkArea?.();
    if (!area) {
      await uiCallbacks.narrate("\u5DE5\u4F5C\u6A21\u5757\u6CA1\u6709\u51C6\u5907\u597D\u3002");
      await finishCycle();
      return;
    }
    const result = await new Promise((resolve) => startWorkQTE(area, resolve));
    (result.moodsGained || []).forEach((type) => addMoodFeedback(type));
    play(result.success ? "win" : "loss");
    uiCallbacks.updateHUD();
    uiCallbacks.notify("\u5DE5\u4F5C", result.message);
    await uiCallbacks.narrate(result.message);
    if (result.success && branch.success?.length) {
      await uiCallbacks.narrateSequential(branch.success);
    } else if (!result.success && branch.fail?.length) {
      await uiCallbacks.narrateSequential(branch.fail);
    }
    await finishCycle();
  }
  async function runGambleBigBranch(branch) {
    markGambleWindowSeen();
    await uiCallbacks.narrateSequential(branch.pick);
    uiCallbacks.openWindow("gamble");
    await uiCallbacks.narrateSequential(branch.intro);
    const stake = await uiCallbacks.showChoices(
      [
        { id: "small", label: branch.stakeChoices.small, primary: true },
        { id: "large", label: branch.stakeChoices.large },
        { id: "leave", label: branch.stakeChoices.leave }
      ],
      branch.stakePrompt
    );
    if (stake === "leave") {
      awardMood("stable");
      await uiCallbacks.narrateSequential(branch.leaveLines);
      await finishCycle();
      return;
    }
    const requestedAmount = stake === "large" ? 600 : 300;
    const amount = Math.min(requestedAmount, getState().cash);
    const deposit = depositToMachine(amount);
    if (!deposit.ok) {
      await uiCallbacks.narrate(branch.noCash);
      await finishCycle();
      return;
    }
    uiCallbacks.setGambleLog(COPY.gamble.depositOk(deposit.amount));
    uiCallbacks.updateHUD();
    await uiCallbacks.narrate(`\u4F60\u5148\u5F80\u673A\u5668\u91CC\u538B\u4E86 \xA5${deposit.amount}\u3002\u8FD9\u4E00\u6B21\u4F60\u4E0D\u60F3\u73A9\u201C\u5C0F\u6253\u5C0F\u95F9\u201D\u3002`);
    let spinCount = 1;
    if (getState().flags.triple_unlocked) {
      const mode = await uiCallbacks.showChoices(
        [
          { id: "once", label: branch.modeChoices.once },
          { id: "triple", label: branch.modeChoices.triple, primary: true }
        ],
        branch.modePrompt
      );
      spinCount = mode === "triple" ? 3 : 1;
    }
    const gambleResult = await executeGamble(spinCount);
    if (gambleResult.ok) {
      await uiCallbacks.narrateSequential(gambleResult.netDelta >= 0 ? branch.afterGood : branch.afterBad);
    }
    await finishCycle();
  }
  async function runFamilyDrawingBranch(branch) {
    const state2 = getState();
    markFamilyBranch();
    await uiCallbacks.narrateSequential(branch.pick);
    uiCallbacks.openWindow("family");
    appendMessages("family", branch.chat);
    const choice = await uiCallbacks.showChoices(
      [
        { id: "look", label: branch.choices.look, primary: true },
        { id: "wait", label: branch.choices.wait }
      ],
      "\u4F60\u8981\u4E0D\u8981\u9A6C\u4E0A\u770B\uFF1F"
    );
    state2.flags.drawing_seen = true;
    if (choice === "look") {
      appendMessages("family", branch.lookFollow);
      markFamilyReply();
      awardMood("stable");
    } else {
      appendMessages("family", branch.waitFollow);
      markFamilyReply();
      awardMood("anxiety");
    }
    await finishCycle();
  }
  async function runBillReminderBranch(branch) {
    getState().flags.bill_seen = true;
    await uiCallbacks.narrateSequential(branch.pick);
    await uiCallbacks.narrateSequential(branch.intro);
    const choice = await uiCallbacks.showChoices(
      [
        { id: "small", label: branch.choices.small, primary: true },
        { id: "all", label: branch.choices.all },
        { id: "delay", label: branch.choices.delay }
      ],
      branch.prompt
    );
    if (choice === "delay") {
      awardMood("anxiety");
      await uiCallbacks.narrateSequential(branch.delay);
      await finishCycle();
      return;
    }
    const paid = payBill(choice === "all" ? getState().cash : 500);
    uiCallbacks.updateHUD();
    if (choice === "all") {
      await uiCallbacks.narrate(branch.paidAll(paid));
    } else {
      await uiCallbacks.narrate(branch.paidSmall(paid));
    }
    if (paid > 0) {
      awardMood("stable");
    }
    await finishCycle();
  }
  async function runMemoPromptBranch(branch) {
    const state2 = getState();
    await uiCallbacks.narrateSequential(branch.pick);
    const text = await uiCallbacks.showTextEntry({
      title: COPY.memo.title,
      prompt: branch.prompt,
      placeholder: COPY.memo.placeholder,
      initialValue: state2.flags.memo_text || "",
      confirmLabel: COPY.memo.confirm
    });
    if (!text) {
      uiCallbacks.notify(COPY.notify.memoEmpty.title, COPY.notify.memoEmpty.body);
      await runMemoPromptBranch(branch);
      return;
    }
    state2.flags.memo_text = text;
    state2.flags.memo_done = true;
    uiCallbacks.notify(COPY.notify.memoSaved.title, COPY.notify.memoSaved.body);
    await uiCallbacks.narrateSequential(branch.afterSave);
    await finishCycle();
  }
  async function runAnxietyPingBranch(branch) {
    markFamilyBranch();
    await uiCallbacks.narrateSequential(branch.pick);
    uiCallbacks.openWindow("family");
    appendMessages("family", branch.chat);
    const choice = await uiCallbacks.showChoices(
      [
        { id: "reply", label: branch.choices.reply, primary: true },
        { id: "avoid", label: branch.choices.avoid }
      ],
      "\u8981\u4E0D\u8981\u56DE\u8FC7\u53BB\uFF1F"
    );
    if (choice === "reply") {
      appendMessages("family", branch.replyFollow);
      markFamilyReply();
      awardMood("stable");
    } else {
      appendMessages("family", branch.avoidFollow);
      awardMood("anxiety");
    }
    await finishCycle();
  }
  async function runFamilyWaitBranch(branch) {
    markFamilyBranch();
    await uiCallbacks.narrateSequential(branch.pick);
    uiCallbacks.openWindow("family");
    appendMessages("family", branch.chat);
    const choice = await uiCallbacks.showChoices(
      [
        { id: "reply", label: branch.choices.reply, primary: true },
        { id: "silent", label: branch.choices.silent }
      ],
      "\u4F60\u6700\u540E\u8981\u4E0D\u8981\u56DE\u8FD9\u53E5\uFF1F"
    );
    if (choice === "reply") {
      appendMessages("family", branch.replyFollow);
      markFamilyReply();
      awardMood("stable");
    } else {
      appendMessages("family", branch.silentFollow);
      awardMood("anxiety");
    }
    await launchFinalDecision();
  }
  async function runOneMoreGambleBranch(branch) {
    markGambleWindowSeen();
    await uiCallbacks.narrateSequential(branch.pick);
    uiCallbacks.openWindow("gamble");
    const choice = await uiCallbacks.showChoices(
      [
        { id: "press", label: branch.choices.press, primary: true },
        { id: "stop", label: branch.choices.stop }
      ],
      branch.prompt
    );
    if (choice === "stop") {
      await uiCallbacks.narrateSequential(branch.stopLines);
      await launchFinalDecision();
      return;
    }
    const gambleResult = await executeGamble(1);
    if (gambleResult.ok) {
      await uiCallbacks.narrateSequential(gambleResult.netDelta >= 0 ? branch.afterGood : branch.afterBad);
    }
    await launchFinalDecision();
  }
  async function executeGamble(spinCount) {
    uiCallbacks.openWindow("gamble");
    const result = gamble(spinCount);
    if (!result.ok) {
      uiCallbacks.notify("\u8D4C\u535A", result.error);
      uiCallbacks.updateGambleButtons();
      await uiCallbacks.narrate(result.error);
      return { ok: false, error: result.error, netDelta: 0 };
    }
    let netDelta = 0;
    if (result.firstNarrative) {
      await uiCallbacks.narrate(result.firstNarrative);
    }
    for (const spin of result.results) {
      netDelta += spin.delta;
      uiCallbacks.renderWheelResult(spin.segment.label);
      uiCallbacks.setGambleLog(spin.message);
      play(spin.delta >= 0 ? "win" : "loss");
      if (spin.moodGained) {
        addMoodFeedback(spin.moodGained);
      }
      uiCallbacks.updateHUD();
      uiCallbacks.updateGambleButtons();
      await sleep(260);
    }
    return { ok: true, netDelta, results: result.results };
  }
  async function launchFinalDecision() {
    const state2 = getState();
    const choice = await uiCallbacks.showFinalDecision(resolveFinalDecisionCopy(state2));
    state2.flags.final_pressed = choice === "press";
    const endingId = determineFinalEnding({
      pressed: choice === "press",
      state: state2
    });
    setEnding(endingId);
    saveLastEnding(endingId);
    uiCallbacks.clearSavedRun?.();
    uiCallbacks.showEndingScreen(endingId, COPY.endings[endingId]);
  }
  function appendMessages(channel, messages) {
    messages.forEach((message) => uiCallbacks.appendChat(channel, message));
  }
  function awardMood(type, amount = 1) {
    addMood(type, amount);
    addMoodFeedback(type, amount);
  }
  function addMoodFeedback(type, amount = 1) {
    for (let i = 0; i < amount; i += 1) {
      uiCallbacks.addMoodCard(type);
    }
    uiCallbacks.flashMood(type);
    uiCallbacks.updateHUD();
    const toast = MOOD_TOASTS[type];
    if (toast) {
      uiCallbacks.notify(toast.title, toast.body);
    }
  }
  function saveBookmark(id) {
    const state2 = getState();
    const snapshot = exportState();
    if (snapshot.story) {
      snapshot.story.bookmark = null;
      snapshot.story.cycleStartSave = null;
    }
    state2.story.bookmark = {
      id,
      cardId: state2.flags.card_picked,
      snapshot
    };
  }
  async function showEarlyEnding(endingKey, rewindBookmark, canContinueCycle = false) {
    const ending = COPY.cycles[1].earlyEndings[endingKey] || COPY.endings[endingKey];
    if (!ending) return;
    await uiCallbacks.narrate(COPY.cycles[1].demoEndPrompt);
    const pick = await uiCallbacks.showChoices([
      { id: "rewind", label: COPY.narrative.choices.rewind, primary: true },
      { id: "menu", label: COPY.narrative.choices.mainMenu },
      ...canContinueCycle ? [{ id: "continue", label: "\u8FDB\u5165\u5468\u671F 2" }] : [{ id: "continue_line", label: COPY.narrative.choices.continueDemo }]
    ]);
    if (pick === "rewind") {
      await rewindToBookmark(rewindBookmark);
      return;
    }
    if (pick === "menu") {
      location.reload();
      return;
    }
    if (pick === "continue" && canContinueCycle) {
      endCycle();
      uiCallbacks.updateHUD();
      await beginCycle();
      return;
    }
    setEnding(endingKey);
    uiCallbacks.showEndingScreen(endingKey, ending);
  }
  async function rewindToBookmark(bookmarkId) {
    const bookmark = getState().story?.bookmark;
    if (!bookmark?.snapshot || bookmark.id !== bookmarkId) {
      const state2 = getState();
      state2.phase = "playing";
      state2.endingId = null;
      state2.cycleResolved = false;
      state2.flags.card_picked = null;
      uiCallbacks.resetTransientView?.();
      uiCallbacks.updateHUD();
      await beginCycle();
      return;
    }
    loadState(bookmark.snapshot);
    const restored = getState();
    restored.phase = "playing";
    restored.endingId = null;
    restored.cycleResolved = true;
    restored.flags.card_picked = restored.flags.card_picked || bookmark.cardId || "friend_link";
    restored.story.bookmark = bookmark;
    uiCallbacks.resetTransientView?.();
    uiCallbacks.openWindow("cards");
    uiCallbacks.renderCardTable(getCycleCards(), restored.flags.card_picked);
    uiCallbacks.updateHUD();
    uiCallbacks.updateGambleButtons();
    await uiCallbacks.narrate(CYCLE1_REWIND_NOTICE);
    await resumeCycle1Bookmark(bookmarkId);
  }
  async function resumeCycle1Bookmark(bookmarkId) {
    const branch = resolveBranchCopy(1, "friend_link", getState());
    if (!branch) {
      await finishCycle();
      return;
    }
    restoreCycle1BookmarkWindows(branch);
    switch (bookmarkId) {
      case "c1_after_rules":
        await resumeCycle1AfterRules(branch);
        return;
      case "c1_after_press1":
        await resumeCycle1AfterPress1(branch);
        return;
      case "c1_after_press2":
        await resumeCycle1AfterPress2(branch);
        return;
      case "c1_after_press3":
        await resumeCycle1AfterPress3(branch);
        return;
      case "c1_colleague":
        await resumeCycle1Colleague(branch);
        return;
      case "c1_first_choice":
      default:
        await resumeCycle1FirstChoice(branch);
    }
  }
  function restoreCycle1BookmarkWindows(branch) {
    uiCallbacks.openWindow("chat");
    appendMessages("chat", branch.chat);
    uiCallbacks.openWindow("gamble");
  }
  async function resumeCycle1FirstChoice(branch) {
    const first = await uiCallbacks.showChoices(
      [
        { id: "try", label: branch.firstChoice.try, primary: true },
        { id: "rules", label: branch.firstChoice.rules }
      ],
      branch.firstChoice.prompt
    );
    if (first === "rules") {
      await showRules(branch);
      return;
    }
    await runPressSequence(branch);
  }
  async function resumeCycle1AfterRules(branch) {
    await uiCallbacks.narrate(`**${branch.rules.title}**`);
    await uiCallbacks.narrateSequential(branch.rules.body);
    const pick = await uiCallbacks.showChoices(
      [
        { id: "continue", label: branch.rules.continue, primary: true },
        { id: "quit", label: branch.rules.quit }
      ],
      "\u770B\u5B8C\u4EE5\u540E\uFF0C\u4F60\u8FD8\u60F3\u7EE7\u7EED\u5417\uFF1F"
    );
    if (pick === "quit") {
      await uiCallbacks.narrateSequential(branch.rulesQuit);
      await showEarlyEnding("rules_quit", "c1_after_rules");
      return;
    }
    await runPressSequence(branch);
  }
  async function resumeCycle1AfterPress1(branch) {
    uiCallbacks.renderWheelResult(branch.press1.result);
    uiCallbacks.setGambleLog(branch.press1.result);
    await uiCallbacks.narrateSequential(branch.press1.lines);
    const pick = await uiCallbacks.showChoices([
      { id: "again", label: branch.press1.again, primary: true },
      { id: "stop", label: branch.press1.stop }
    ]);
    if (pick === "stop") {
      await uiCallbacks.narrateSequential(branch.stopAfter1);
      await showEarlyEnding("stop_after_1", "c1_after_press1");
      return;
    }
    await continueAfterPress1(branch);
  }
  async function resumeCycle1AfterPress2(branch) {
    uiCallbacks.renderWheelResult(branch.press2.result);
    uiCallbacks.setGambleLog(branch.press2.result);
    await uiCallbacks.narrateSequential(branch.press2.lines);
    const pick = await uiCallbacks.showChoices([
      { id: "again", label: branch.press2.again, primary: true },
      { id: "stop", label: branch.press2.stop }
    ]);
    if (pick === "stop") {
      await uiCallbacks.narrateSequential(branch.stopAfter2);
      await showEarlyEnding("stop_after_2", "c1_after_press2");
      return;
    }
    await continueAfterPress2(branch);
  }
  async function resumeCycle1AfterPress3(branch) {
    uiCallbacks.renderWheelResult(branch.press3.result);
    uiCallbacks.setGambleLog(branch.press3.result);
    await uiCallbacks.narrateSequential(branch.press3.lines);
    const pick = await uiCallbacks.showChoices([
      { id: "again", label: branch.press3.again, primary: true },
      { id: "stop", label: branch.press3.stop }
    ]);
    if (pick === "stop") {
      await uiCallbacks.narrateSequential(branch.stopAfter3);
      await showEarlyEnding("stop_after_3", "c1_after_press3");
      return;
    }
    await showColleagueDecision(branch);
  }
  async function resumeCycle1Colleague(branch) {
    await uiCallbacks.narrateSequential(branch.colleague);
    saveBookmark("c1_colleague");
    const pick = await uiCallbacks.showChoices(
      [
        { id: "oneMore", label: branch.afterColleague.oneMore, primary: true },
        { id: "quit", label: branch.afterColleague.quit }
      ],
      branch.afterColleague.prompt
    );
    if (pick === "quit") {
      await uiCallbacks.narrateSequential(branch.quitAfterColleague);
      await showEarlyEnding("quit_colleague", "c1_colleague");
      return;
    }
    await uiCallbacks.narrateSequential(branch.press4.lines);
    await showEarlyEnding("phone_dead", "c1_colleague", true);
  }
  async function finishCycle() {
    await uiCallbacks.narrate(COPY.hud.cycleReady);
  }
  function markGambleWindowSeen() {
    const state2 = getState();
    state2.flags.gamble_opened = true;
  }
  function markFamilyBranch() {
    const state2 = getState();
    state2.flags.family_branch_count = (state2.flags.family_branch_count || 0) + 1;
  }
  function markFamilyReply() {
    const state2 = getState();
    state2.flags.family_reply_count = (state2.flags.family_reply_count || 0) + 1;
  }
  function markWorkBranch() {
    const state2 = getState();
    state2.flags.work_branch_count = (state2.flags.work_branch_count || 0) + 1;
  }
  function advanceCycleManually() {
    const state2 = getState();
    if (!state2.cycleResolved) {
      uiCallbacks.notify("\u63D0\u793A", "\u8BF7\u5148\u9009\u62E9\u4E00\u5F20\u4E8B\u4EF6\u724C\u3002");
      return false;
    }
    const advanced = endCycle();
    uiCallbacks.updateHUD();
    if (advanced) {
      const nextNotice = COPY.notify.newCycle(getState().cycle);
      uiCallbacks.notify(nextNotice.title, nextNotice.body);
      beginCycle();
    } else {
      uiCallbacks.notify(COPY.notify.lastCycle.title, COPY.notify.lastCycle.body);
    }
    return advanced;
  }
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  function createCycleStartSave() {
    const snapshot = exportState();
    snapshot.cycleResolved = false;
    snapshot.flags.card_picked = null;
    if (snapshot.story) {
      snapshot.story.bookmark = null;
      snapshot.story.cycleStartSave = null;
    }
    return snapshot;
  }

  // js/ui.js
  var clockInterval = null;
  var windowStack = 20;
  var uiCallbacks2 = null;
  var windowMinimized = {};
  var MOOD_ART = {
    addiction: "assets/pixel/mood-addiction.png",
    stable: "assets/pixel/mood-stable.png",
    anxiety: "assets/pixel/mood-anxiety.png",
    diligent: "assets/pixel/mood-diligent.png"
  };
  var AVATAR_ART = {
    "\u963F\u51EF": "assets/pixel/avatar-friend.png",
    "\u5C0F\u96C5": "assets/pixel/avatar-wife.png",
    "\u6735\u6735": "assets/pixel/avatar-daughter.png"
  };
  var BAD_ENDINGS = /* @__PURE__ */ new Set(["ruin", "delusion", "phone_dead"]);
  var ENDING_ART = {
    awaken: "assets/pixel/ending-awaken.png",
    bad: "assets/pixel/ending-ruin.png"
  };
  var WINDOW_STAGGERS = [
    { x: 0, y: 0 },
    { x: -180, y: -36 },
    { x: 170, y: 24 },
    { x: -110, y: 90 },
    { x: 115, y: -72 }
  ];
  function initUI(callbacks) {
    uiCallbacks2 = callbacks;
    updateClock();
    clockInterval = setInterval(updateClock, 1e3);
    bindTaskbar(callbacks);
    bindWindowChrome();
    bindGlobalActions(callbacks);
    bindCardDrag(callbacks);
    updateHUD();
    renderMoodTrayFromState();
    updateGambleButtons();
  }
  function updateClock() {
    const now = /* @__PURE__ */ new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const el = document.getElementById("clock");
    if (el) el.textContent = `${h}:${m}`;
  }
  function bindTaskbar(callbacks) {
    document.querySelectorAll(".taskbar-app").forEach((btn) => {
      btn.addEventListener("click", () => {
        openWindow(btn.dataset.app);
        callbacks.onOpenApp?.(btn.dataset.app);
      });
    });
  }
  function bindGlobalActions(callbacks) {
    document.getElementById("btn-end-cycle")?.addEventListener("click", () => {
      callbacks.onEndCycle?.();
    });
  }
  function bindCardDrag(callbacks) {
    const slot = document.getElementById("action-slot");
    if (!slot) return;
    slot.addEventListener("dragover", (e) => {
      e.preventDefault();
      slot.classList.add("drag-over");
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("drag-over"));
    slot.addEventListener("drop", (e) => {
      e.preventDefault();
      slot.classList.remove("drag-over");
      const id = e.dataTransfer.getData("text/card");
      if (id) callbacks.onPlaceCard?.(id);
    });
  }
  function bindWindowChrome() {
    document.querySelectorAll(".window").forEach((win) => {
      const id = win.dataset.id;
      win.querySelector(".btn-close")?.addEventListener("click", () => closeWindow(id));
      win.querySelector(".btn-minimize")?.addEventListener("click", () => minimizeWindow(id));
      makeDraggable(win);
    });
  }
  function makeDraggable(win) {
    const bar = win.querySelector(".title-bar");
    if (!bar) return;
    let ox = 0;
    let oy = 0;
    let dragging = false;
    let moved = false;
    bar.addEventListener("mousedown", (e) => {
      if (e.target.closest(".window-controls")) return;
      dragging = true;
      moved = false;
      const rect = win.getBoundingClientRect();
      ox = e.clientX - rect.left;
      oy = e.clientY - rect.top;
      win.style.zIndex = String(++windowStack);
    });
    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const desktop = document.getElementById("windows-container") || document.getElementById("desktop");
      const dRect = desktop.getBoundingClientRect();
      let x = e.clientX - dRect.left - ox;
      let y = e.clientY - dRect.top - oy;
      x = Math.max(0, Math.min(x, Math.max(0, dRect.width - win.offsetWidth)));
      y = Math.max(0, Math.min(y, Math.max(0, dRect.height - win.offsetHeight)));
      win.style.left = `${x}px`;
      win.style.top = `${y}px`;
      moved = true;
    });
    document.addEventListener("mouseup", () => {
      if (dragging && moved) {
        win.dataset.userMoved = "true";
        win.dataset.positioned = "true";
      }
      dragging = false;
    });
  }
  function openWindow(id) {
    const win = document.querySelector(`.window[data-id="${id}"]`);
    if (!win) return;
    const container = document.getElementById("windows-container");
    const wasHidden = win.classList.contains("hidden") || win.classList.contains("minimized");
    windowMinimized[id] = false;
    win.classList.remove("hidden", "minimized");
    win.style.zIndex = String(++windowStack);
    if ((wasHidden || win.dataset.positioned !== "true") && win.dataset.userMoved !== "true") {
      positionWindow(win);
    }
    if (container && container.clientWidth < 700) {
      document.querySelectorAll(".window").forEach((other) => {
        if (other === win || other.classList.contains("hidden")) return;
        other.classList.add("minimized");
        windowMinimized[other.dataset.id] = true;
      });
      win.classList.remove("minimized");
      windowMinimized[id] = false;
    }
    play("windowOpen");
    document.querySelectorAll(".taskbar-app").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.app === id);
    });
  }
  function closeWindow(id) {
    document.querySelector(`.window[data-id="${id}"]`)?.classList.add("hidden");
    document.querySelector(`.taskbar-app[data-app="${id}"]`)?.classList.remove("active");
    play("windowClose");
  }
  function minimizeWindow(id) {
    const win = document.querySelector(`.window[data-id="${id}"]`);
    if (!win) return;
    windowMinimized[id] = true;
    win.classList.add("minimized");
    document.querySelector(`.taskbar-app[data-app="${id}"]`)?.classList.remove("active");
    play("windowMinimize");
  }
  function flashMood(type) {
    const el = document.querySelector(`.mood.${type}`);
    if (!el) return;
    el.classList.add("mood-flash");
    setTimeout(() => el.classList.remove("mood-flash"), 700);
  }
  function addMoodCard(type) {
    const tray = document.getElementById("mood-cards");
    if (!tray) return;
    const chip = document.createElement("div");
    chip.className = `mood-chip mood-${type}`;
    chip.title = COPY.mood[type] || type;
    chip.innerHTML = `<img src="${MOOD_ART[type] || ""}" alt="" onerror="this.style.display='none'"/><span>${COPY.mood[type] || type}</span>`;
    tray.appendChild(chip);
  }
  function renderMoodTrayFromState() {
    const tray = document.getElementById("mood-cards");
    if (!tray) return;
    tray.innerHTML = "";
    getState().moodCards.forEach((type) => addMoodCard(type));
  }
  function updateHUD() {
    const s = getState();
    const debt = getDebt();
    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    set("hud-cycle", COPY.hud.cycleLabel(s.cycle, CYCLE_COUNT));
    set("hud-ap", `${s.ap} / 3`);
    set("hud-cash", `\xA5${s.cash}`);
    set("hud-virtual", `\xA5${s.virtualBalance}`);
    set("hud-debt", `\xA5${Math.round(debt)} / \xA5${s.billTotal}`);
    set("hud-addiction", String(s.mood.addiction));
    set("hud-stable", String(s.mood.stable));
    set("hud-anxiety", String(s.mood.anxiety));
    set("hud-diligent", String(s.mood.diligent || 0));
    set("hud-press", COPY.hud.pressCount(s.stats.gambleCount));
    const bar = document.getElementById("bill-bar-fill");
    if (bar) {
      const paid = Math.max(0, s.billTotal - debt);
      bar.style.width = `${Math.min(100, paid / s.billTotal * 100)}%`;
    }
    updateGambleButtons();
  }
  function updateGambleButtons() {
    syncGambleUnlocks();
    const s = getState();
    const gambleBtn = document.getElementById("btn-gamble-once");
    const tripleBtn = document.getElementById("btn-triple");
    const tenBtn = document.getElementById("btn-ten");
    const endBtn = document.getElementById("btn-end-cycle");
    if (gambleBtn) {
      gambleBtn.disabled = !canAct();
      gambleBtn.classList.toggle("hidden", s.stats.gambleCount < 0);
    }
    if (tripleBtn) {
      tripleBtn.classList.toggle("hidden", !s.flags.triple_unlocked);
      tripleBtn.disabled = !canAct();
    }
    if (tenBtn) {
      tenBtn.classList.toggle("hidden", !s.flags.ten_unlocked);
      tenBtn.disabled = !canAct();
    }
    if (endBtn) endBtn.disabled = !canAct();
  }
  function showNotification(title, body) {
    const area = document.getElementById("notifications");
    if (!area) return;
    const n = document.createElement("div");
    n.className = "notification toast-in";
    n.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(body)}</span>`;
    area.appendChild(n);
    setTimeout(() => {
      n.classList.add("toast-out");
      setTimeout(() => n.remove(), 400);
    }, 4e3);
  }
  function narrate(text) {
    return typewrite(text);
  }
  async function narrateSequential(lines) {
    for (const line of lines) {
      await typewrite(line);
      await sleep2(350);
    }
  }
  function typewrite(text) {
    return new Promise((resolve) => {
      const box = document.getElementById("narrative-text");
      if (!box) {
        resolve();
        return;
      }
      const p = document.createElement("p");
      p.className = "narrative-line";
      box.appendChild(p);
      box.scrollTop = box.scrollHeight;
      const raw = String(text).replace(/\*\*(.+?)\*\*/g, "$1");
      let i = 0;
      const tick = () => {
        if (i <= raw.length) {
          p.textContent = raw.slice(0, i);
          i += 2;
          box.scrollTop = box.scrollHeight;
          setTimeout(tick, 18);
        } else {
          resolve();
        }
      };
      tick();
    });
  }
  function showChoices(choices, prompt = "") {
    return new Promise((resolve) => {
      const area = document.getElementById("narrative-choices");
      if (!area) {
        resolve(choices[0]?.id || "ok");
        return;
      }
      area.innerHTML = "";
      if (prompt) {
        const hint = document.createElement("p");
        hint.className = "choice-prompt";
        hint.textContent = prompt;
        area.appendChild(hint);
      }
      choices.forEach((c) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `btn choice-btn ${c.primary ? "btn-primary" : "btn-ghost"}`;
        btn.textContent = c.label;
        if (c.desc) {
          const small = document.createElement("small");
          small.textContent = c.desc;
          btn.appendChild(small);
        }
        btn.addEventListener("click", () => {
          area.innerHTML = "";
          resolve(c.id);
        });
        area.appendChild(btn);
      });
    });
  }
  function setNarrativeChoices(choices) {
    const area = document.getElementById("narrative-choices");
    if (area) area.innerHTML = "";
  }
  function renderCardTable(cards, pickedId) {
    const pool = document.getElementById("card-pool");
    const slot = document.getElementById("action-slot");
    if (!pool || !slot) return;
    pool.innerHTML = "";
    slot.innerHTML = `<span class="slot-label">${COPY.cards.ui.slotLabel}</span>`;
    cards.forEach((card) => {
      const meta = COPY.cards[card.id] || { title: card.id, desc: "" };
      const el = document.createElement("div");
      el.className = "event-card";
      el.draggable = !pickedId;
      el.dataset.cardId = card.id;
      if (pickedId && pickedId !== card.id) el.classList.add("forfeited");
      if (pickedId === card.id) el.classList.add("picked");
      el.innerHTML = `
      <div class="card-art" style="background-image:url('${card.art}')"></div>
      <div class="card-title">${escapeHtml(meta.title)}</div>
      <div class="card-desc">${escapeHtml(meta.desc)}</div>
    `;
      if (!pickedId) {
        el.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("text/card", card.id);
        });
        el.addEventListener("click", () => {
          play("cardPick");
          uiCallbacks2?.onPlaceCard?.(card.id);
        });
      }
      pool.appendChild(el);
    });
    if (!pickedId) {
    } else if (pickedId) {
      const picked = cards.find((c) => c.id === pickedId);
      if (picked) {
        const meta = COPY.cards[picked.id] || { title: picked.id, desc: "" };
        slot.innerHTML = `
        <div class="event-card picked-in-slot">
          <div class="card-art" style="background-image:url('${picked.art}')"></div>
          <div class="card-title">${escapeHtml(meta.title)}</div>
        </div>`;
      }
    }
  }
  function showIntro({
    hasSave = false,
    saveSummary = null,
    onStart = null,
    onContinue = null,
    onNewGame = null
  } = {}) {
    const layer = document.getElementById("modal-layer");
    layer.classList.remove("hidden");
    layer.innerHTML = `
    <div class="modal intro-screen cover-screen">
      <div class="cover-hero">
        <div class="intro-brand">
          <img class="intro-icon pixel-border" src="assets/pixel/game-icon.png" alt="" onerror="this.style.display='none'"/>
          <h1>${escapeHtml(COPY.meta.title)}</h1>
          ${COPY.meta.titleEn ? `<p class="intro-title-en">${escapeHtml(COPY.meta.titleEn)}</p>` : ""}
          ${COPY.meta.theme ? `<p class="intro-tagline">${escapeHtml(COPY.meta.theme)}</p>` : ""}
        </div>
        <div class="cover-copy">
          <p class="subtitle">${escapeHtml(COPY.meta.subtitle)}</p>
          <div class="intro-body">
            <p>${escapeHtml(COPY.intro.p1)}</p>
            <p>${escapeHtml(COPY.intro.p2)}</p>
            <p>${escapeHtml(COPY.intro.p3)}</p>
          </div>
        </div>
      </div>
      <div class="intro-actions">
        ${hasSave && saveSummary ? `
          <div class="save-preview pixel-border">
            <strong>${escapeHtml(COPY.intro.saveTitle)}</strong>
            <div class="save-preview-grid">
              <span>${escapeHtml(COPY.intro.saveCycle(saveSummary.cycle))}</span>
              <span>${escapeHtml(COPY.intro.saveCash(saveSummary.cash))}</span>
              <span>${escapeHtml(COPY.intro.saveDebt(saveSummary.debt))}</span>
              <span>${escapeHtml(COPY.intro.savePresses(saveSummary.presses))}</span>
              <span class="save-preview-memory">${escapeHtml(COPY.intro.saveMemory(saveSummary.hasMemory))}</span>
            </div>
          </div>
        ` : ""}
        <div class="intro-menu">
          ${hasSave ? `
              <button type="button" class="btn btn-primary" id="btn-continue">${escapeHtml(COPY.intro.continue)}</button>
              <button type="button" class="btn btn-ghost" id="btn-new-game">${escapeHtml(COPY.intro.newGame)}</button>
            ` : `<button type="button" class="btn btn-primary" id="btn-start">${escapeHtml(COPY.intro.start)}</button>`}
        </div>
        <p class="intro-hint">${escapeHtml(hasSave ? COPY.intro.saveHint : COPY.intro.startHint)}</p>
      </div>
    </div>
  `;
    const closeIntro = (callback) => {
      play("start");
      layer.classList.add("hidden");
      layer.innerHTML = "";
      callback?.();
    };
    layer.querySelector("#btn-start")?.addEventListener("click", () => closeIntro(onStart));
    layer.querySelector("#btn-continue")?.addEventListener("click", () => closeIntro(onContinue));
    layer.querySelector("#btn-new-game")?.addEventListener("click", () => closeIntro(onNewGame));
  }
  function showTextEntry({ title, prompt, placeholder = "", initialValue = "", confirmLabel = COPY.memo.confirm }) {
    return new Promise((resolve) => {
      const layer = document.getElementById("modal-layer");
      if (!layer) {
        resolve(initialValue || "");
        return;
      }
      layer.classList.remove("hidden");
      layer.innerHTML = `
      <div class="modal text-entry-modal pixel-border">
        <h2>${escapeHtml(title)}</h2>
        <p class="text-entry-prompt">${escapeHtml(prompt)}</p>
        <textarea id="text-entry-input" class="text-entry-input" placeholder="${escapeHtml(placeholder)}">${escapeHtml(initialValue)}</textarea>
        <div class="text-entry-actions">
          <button type="button" class="btn btn-primary" id="btn-text-confirm">${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    `;
      const input = layer.querySelector("#text-entry-input");
      const confirm = layer.querySelector("#btn-text-confirm");
      setTimeout(() => input?.focus(), 0);
      confirm?.addEventListener("click", () => {
        const value = input?.value?.trim() || "";
        if (!value) {
          showNotification(COPY.notify.memoEmpty.title, COPY.notify.memoEmpty.body);
          input?.focus();
          return;
        }
        layer.classList.add("hidden");
        layer.innerHTML = "";
        resolve(value);
      });
    });
  }
  function showFinalDecision({ title, body, replayPrefix, memoText, pressLabel, notPressLabel }) {
    return new Promise((resolve) => {
      const layer = document.getElementById("modal-layer");
      if (!layer) {
        resolve("not_press");
        return;
      }
      layer.classList.remove("hidden");
      layer.innerHTML = `
      <div class="modal final-choice-modal pixel-border">
        <h2>${escapeHtml(title)}</h2>
        <p class="final-choice-body">${escapeHtml(body)}</p>
        <div class="final-choice-note pixel-border">
          <span class="final-choice-prefix">${escapeHtml(replayPrefix)}</span>
          <blockquote>${escapeHtml(memoText)}</blockquote>
        </div>
        <div class="final-choice-actions">
          <button type="button" class="btn btn-danger" id="btn-final-press">${escapeHtml(pressLabel)}</button>
          <button type="button" class="btn btn-primary" id="btn-final-not">${escapeHtml(notPressLabel)}</button>
        </div>
      </div>
    `;
      layer.querySelector("#btn-final-press")?.addEventListener("click", () => {
        layer.classList.add("hidden");
        layer.innerHTML = "";
        resolve("press");
      });
      layer.querySelector("#btn-final-not")?.addEventListener("click", () => {
        layer.classList.add("hidden");
        layer.innerHTML = "";
        resolve("not_press");
      });
    });
  }
  var CHANNEL_MAP = {
    chat: "chat-messages",
    family: "family-messages",
    work: "work-messages"
  };
  function appendChatMessage(channel, msg) {
    const listId = CHANNEL_MAP[channel] || `${channel}-messages`;
    const list = document.getElementById(listId);
    if (!list) return;
    const row = document.createElement("div");
    const bubbleTone = msg.from === "\u4F60" ? "self" : channel === "family" ? "family" : "friend";
    row.className = `chat-msg bubble-${bubbleTone} ${msg.from === "\u7CFB\u7EDF" ? "system" : ""} ${msg.from === "\u4F60" ? "sender-self" : ""}`.trim();
    const avatar = AVATAR_ART[msg.from];
    const avatarHtml = avatar ? `<img class="chat-avatar pixel-border" src="${avatar}" alt="" onerror="this.style.display='none'"/>` : "";
    const nameHtml = msg.from ? `<span class="chat-name">${escapeHtml(msg.from)}</span>` : "";
    if (msg.file) {
      row.innerHTML = `
      ${avatarHtml}
      <div class="chat-bubble-wrap">
        ${nameHtml}
        <div class="file-card pixel-border" data-open="gamble">
          <img class="file-icon" src="assets/pixel/file-icon-html.png" alt="" onerror="this.style.display='none'"/>
          <div class="file-copy">
            <strong>${escapeHtml(COPY.gamble.fileCard.name)}</strong>
            <small>${escapeHtml(COPY.gamble.fileCard.desc)}</small>
          </div>
        </div>
      </div>
    `;
      row.querySelector(".file-card")?.addEventListener("click", () => {
        openWindow("gamble");
      });
    } else if (msg.image) {
      row.innerHTML = `
      ${avatarHtml}
      <div class="chat-bubble-wrap">
        ${nameHtml}
        <div class="chat-image-card pixel-border">
          <img src="${escapeHtml(msg.image)}" alt="${escapeHtml(msg.alt || msg.text || "")}" onerror="this.style.display='none'"/>
          <p>${escapeHtml(msg.text || "")}</p>
        </div>
      </div>
    `;
    } else {
      row.innerHTML = `
      ${avatarHtml}
      <div class="chat-bubble-wrap">
        ${nameHtml}
        <p>${escapeHtml(msg.text)}</p>
      </div>
    `;
    }
    list.appendChild(row);
    list.scrollTop = list.scrollHeight;
  }
  function clearChat(channel) {
    const listId = CHANNEL_MAP[channel];
    const list = listId ? document.getElementById(listId) : null;
    if (list) list.innerHTML = "";
  }
  function resetTransientView() {
    document.getElementById("narrative-text")?.replaceChildren();
    document.getElementById("narrative-choices")?.replaceChildren();
    document.getElementById("notifications")?.replaceChildren();
    document.getElementById("gamble-log")?.replaceChildren();
    const wheel = document.getElementById("wheel-display");
    if (wheel) {
      wheel.textContent = "\u2014";
      wheel.classList.remove("spin-flash");
    }
    clearChat("chat");
    clearChat("family");
    clearChat("work");
    document.querySelectorAll(".window").forEach((win) => {
      if (win.dataset.id !== "cards") {
        win.classList.add("hidden");
      }
      win.classList.remove("minimized");
    });
  }
  function showEndingScreen(endingId, endingCopy) {
    const e = endingCopy || COPY.cycles?.[1]?.earlyEndings?.[endingId] || COPY.endings[endingId] || {
      title: "\u7ED3\u5C40",
      body: ""
    };
    const s = getState();
    const layer = document.getElementById("ending-layer");
    layer.classList.remove("hidden");
    play(BAD_ENDINGS.has(endingId) ? "endingBad" : "endingGood");
    const stats = COPY.endingStats;
    const tone2 = BAD_ENDINGS.has(endingId) ? "bad" : "good";
    const art = BAD_ENDINGS.has(endingId) ? ENDING_ART.bad : ENDING_ART.awaken;
    layer.innerHTML = `
    <div class="ending-screen pixel-border ending-${tone2}">
      <div class="ending-art pixel-border" style="background-image:url('${art}')"></div>
      ${e.achievement ? `<p class="achievement">${escapeHtml(e.achievement)}</p>` : ""}
      <h1>${escapeHtml(e.title)}</h1>
      <p class="ending-body">${escapeHtml(e.body)}</p>
      <div class="ending-stats">
        <span>${stats.cycles} <strong>${s.cycle}</strong></span>
        <span>${stats.gambles} <strong>${s.stats.gambleCount}</strong></span>
        <span>${stats.cash} <strong>\xA5${s.cash}</strong></span>
        <span>${stats.virtual} <strong>\xA5${s.virtualBalance}</strong></span>
        <span>${stats.debt} <strong>\xA5${Math.round(getDebt())}</strong></span>
      </div>
      <div class="ending-actions">
        <button type="button" class="btn btn-primary" id="btn-restart">${COPY.buttons.restart}</button>
        <button type="button" class="btn btn-ghost" id="btn-menu">${COPY.buttons.menu}</button>
      </div>
    </div>
  `;
    layer.querySelector("#btn-restart")?.addEventListener("click", () => {
      localStorage.removeItem("biean_save");
      location.reload();
    });
    layer.querySelector("#btn-menu")?.addEventListener("click", () => {
      location.reload();
    });
  }
  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function setGambleLog(text) {
    const el = document.getElementById("gamble-log");
    if (!el) return;
    const p = document.createElement("p");
    p.textContent = text;
    el.appendChild(p);
    el.scrollTop = el.scrollHeight;
  }
  function renderWheelResult(label) {
    const wheel = document.getElementById("wheel-display");
    if (!wheel) return;
    wheel.textContent = label;
    wheel.classList.add("spin-flash");
    setTimeout(() => wheel.classList.remove("spin-flash"), 600);
  }
  function sleep2(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
  function positionWindow(win) {
    const container = document.getElementById("windows-container");
    if (!container) return;
    if (!win.dataset.baseWidth) {
      win.dataset.baseWidth = win.style.width || `${win.offsetWidth}px`;
    }
    if (!win.dataset.baseHeight) {
      win.dataset.baseHeight = win.style.height || `${win.offsetHeight}px`;
    }
    const baseWidth = Number.parseFloat(win.dataset.baseWidth) || win.offsetWidth;
    const baseHeight = Number.parseFloat(win.dataset.baseHeight) || win.offsetHeight;
    const maxWidth = Math.max(280, container.clientWidth - 16);
    const maxHeight = Math.max(220, container.clientHeight - 16);
    win.style.width = `${Math.min(baseWidth, maxWidth)}px`;
    win.style.height = `${Math.min(baseHeight, maxHeight)}px`;
    const visibleWindows = [...container.querySelectorAll(".window:not(.hidden):not(.minimized)")].filter((other) => other !== win);
    const offset = WINDOW_STAGGERS[visibleWindows.length % WINDOW_STAGGERS.length];
    const left = (container.clientWidth - win.offsetWidth) / 2 + offset.x;
    const top = (container.clientHeight - win.offsetHeight) / 2 + offset.y;
    const maxLeft = Math.max(0, container.clientWidth - win.offsetWidth);
    const maxTop = Math.max(0, container.clientHeight - win.offsetHeight);
    win.style.left = `${Math.max(0, Math.min(left, maxLeft))}px`;
    win.style.top = `${Math.max(0, Math.min(top, maxTop))}px`;
    win.dataset.positioned = "true";
  }

  // js/main.js
  var SAVE_KEY = "biean_save";
  var REPLAY_KEY2 = "biean_last_ending";
  function boot() {
    initAudio();
    bindButtonSounds();
    const hasSave = tryLoadSave();
    const saveSummary = hasSave ? getSaveSummary() : null;
    initCards({
      openWindow,
      narrate,
      narrateSequential,
      showChoices,
      setNarrativeChoices,
      renderCardTable,
      appendChat: appendChatMessage,
      addMoodCard,
      flashMood,
      updateHUD,
      updateGambleButtons,
      renderWheelResult,
      setGambleLog,
      showEndingScreen,
      clearChat,
      resetTransientView,
      showTextEntry,
      showFinalDecision,
      getWorkArea: () => document.getElementById("work-area"),
      notify: showNotification,
      persistCycleStartSave,
      clearSavedRun,
      onCycleComplete: () => {
        play("dayEnd");
      }
    });
    initUI({
      onOpenApp(id) {
        if (id === "gamble") getState().flags.gamble_opened = true;
        updateHUD();
      },
      onEndCycle: () => {
        if (isStoryBusy()) return;
        play("dayEnd");
        advanceCycleManually();
      },
      onPlaceCard: (cardId) => {
        if (isStoryBusy()) return;
        placeCard(cardId);
      }
    });
    bindGambleUI();
    bindWorkUI();
    bindDepositUI();
    showIntro({
      hasSave,
      saveSummary,
      onStart: () => startFreshRun(),
      onContinue: hasSave ? () => continueSavedRun() : null,
      onNewGame: hasSave ? () => startFreshRun() : null
    });
  }
  function tryLoadSave() {
    resetGame();
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.phase === "playing" && saved.cycle >= 1) {
          loadState(saved);
          syncGambleUnlocks();
          return true;
        }
      }
    } catch {
      resetGame();
    }
    return false;
  }
  function saveGame() {
    try {
      if (getState().phase === "playing" && getState().story?.cycleStartSave) {
        persistCycleStartSave(getState().story.cycleStartSave);
      }
    } catch {
    }
  }
  function persistCycleStartSave(snapshot = getState().story?.cycleStartSave) {
    try {
      if (snapshot) {
        localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
      }
    } catch {
    }
  }
  function clearSavedRun() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
    }
  }
  function getSaveSummary() {
    const state2 = getState();
    return {
      cycle: state2.cycle,
      cash: state2.cash,
      debt: Math.round(getDebt()),
      presses: state2.stats.gambleCount,
      hasMemory: readReplayMemory()
    };
  }
  function readReplayMemory() {
    try {
      return Boolean(localStorage.getItem(REPLAY_KEY2));
    } catch {
      return false;
    }
  }
  function startFreshRun() {
    clearSavedRun();
    resetGame();
    syncGambleUnlocks();
    getState().flags.intro_done = true;
    startDesktopRun(COPY.intro.hint);
  }
  function continueSavedRun() {
    getState().flags.intro_done = true;
    startDesktopRun(COPY.intro.continueHint(getState().cycle));
  }
  function startDesktopRun(introMessage) {
    resetTransientView();
    updateHUD();
    updateGambleButtons();
    showNotification(COPY.meta.title, introMessage);
    play("notify");
    openWindow("cards");
    beginCycle();
  }
  function bindGambleUI() {
    document.getElementById("btn-gamble-once")?.addEventListener("click", () => doGamble(1));
    document.getElementById("btn-triple")?.addEventListener("click", () => doGamble(3));
    document.getElementById("btn-ten")?.addEventListener("click", () => doGamble(10));
  }
  async function doGamble(spinCount) {
    if (isStoryBusy()) return;
    const s = getState();
    if (s.phase !== "playing") return;
    const btn = document.getElementById("btn-gamble-once");
    const triple = document.getElementById("btn-triple");
    const ten = document.getElementById("btn-ten");
    [btn, triple, ten].forEach((b) => {
      if (b) b.disabled = true;
    });
    syncGambleUnlocks();
    if (spinCount === 3 && !s.flags.triple_unlocked) {
      showNotification(COPY.notify.tripleLocked.title, COPY.notify.tripleLocked.body);
      updateGambleButtons();
      return;
    }
    if (spinCount === 10 && !s.flags.ten_unlocked) {
      showNotification(COPY.notify.tenLocked.title, COPY.notify.tenLocked.body);
      updateGambleButtons();
      return;
    }
    play("gamble");
    const result = gamble(spinCount);
    if (!result.ok) {
      showNotification("\u8D4C\u535A", result.error);
      updateGambleButtons();
      return;
    }
    openWindow("gamble");
    syncGambleUnlocks();
    for (const r of result.results) {
      renderWheelResult(r.segment.label);
      setGambleLog(r.message);
      play(r.delta >= 0 ? "win" : "loss");
      if (r.moodGained) {
        flashMood(r.moodGained);
        addMoodCard(r.moodGained);
      }
      await sleep3(400);
    }
    updateHUD();
    updateGambleButtons();
    saveGame();
  }
  function bindWorkUI() {
    document.getElementById("btn-work-start")?.addEventListener("click", () => {
      if (isStoryBusy()) return;
      const area = document.getElementById("work-area");
      if (!area) return;
      startWorkQTE(area, ({ message, moodsGained, success }) => {
        showNotification("\u5DE5\u4F5C", message);
        (moodsGained || []).forEach((type) => {
          flashMood(type);
          addMoodCard(type);
        });
        play(success ? "win" : "loss");
        updateHUD();
        saveGame();
      });
    });
  }
  function bindDepositUI() {
    document.getElementById("btn-deposit-all")?.addEventListener("click", () => {
      const s = getState();
      const r = depositToMachine(s.cash);
      if (r.ok) {
        setGambleLog(COPY.gamble.depositOk(r.amount));
        showNotification("\u8D4C\u535A\u673A", COPY.gamble.depositNotify(r.amount));
      } else {
        showNotification("\u8D4C\u535A\u673A", r.error);
      }
      updateHUD();
      saveGame();
    });
    document.getElementById("btn-withdraw")?.addEventListener("click", () => {
      const r = withdrawFromMachine();
      if (r.ok) {
        setGambleLog(COPY.gamble.withdrawOk(r.amount));
        showNotification("\u8D4C\u535A\u673A", COPY.gamble.withdrawNotify(r.amount));
      } else {
        showNotification("\u8D4C\u535A\u673A", r.error);
      }
      updateHUD();
      saveGame();
    });
  }
  function sleep3(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
  document.addEventListener("DOMContentLoaded", boot);
  setInterval(saveGame, 5e3);
})();
