/* =====================================================================
   achievements.js —— 成就徽章 / 每日目标 / 连续打卡
   ---------------------------------------------------------------------
   设计原则：所有成就都是「根据已有数据算出来的」，不额外记录状态。
   这样即使你清空了记录，成就也会自然重算，不会出现数据不一致。

   【小白提示｜怎么加一个徽章】
   在下面的 LIST 数组里加一项即可：
     { id:'唯一英文id', icon:'🎯', name:'badge.xxx.name', desc:'badge.xxx.desc',
       check: function (ctx) { return 条件; } }
   然后去 i18n.js 里补上对应的中英文文案。
   ===================================================================== */

(function (ET) {
  'use strict';

  /**
   * ctx 结构（运行时由 evaluate 组装）：
   *   { record, summary, streak, todayMinutes, goalMinutes, records }
   */

  var LIST = [
    {
      id: 'first_round', icon: '🎯',
      name: 'badge.first_round.name', desc: 'badge.first_round.desc',
      check: function (c) { return c.summary.sessions >= 1; }
    },
    {
      id: 'chars_1000', icon: '✍️',
      name: 'badge.chars_1000.name', desc: 'badge.chars_1000.desc',
      check: function (c) { return c.summary.totalChars >= 1000; }
    },
    {
      id: 'chars_10000', icon: '📚',
      name: 'badge.chars_10000.name', desc: 'badge.chars_10000.desc',
      check: function (c) { return c.summary.totalChars >= 10000; }
    },
    {
      id: 'chars_50000', icon: '🧱',
      name: 'badge.chars_50000.name', desc: 'badge.chars_50000.desc',
      check: function (c) { return c.summary.totalChars >= 50000; }
    },
    {
      id: 'wpm_30', icon: '⚡',
      name: 'badge.wpm_30.name', desc: 'badge.wpm_30.desc',
      check: function (c) { return c.summary.bestWpm >= 30; }
    },
    {
      id: 'wpm_50', icon: '🚀',
      name: 'badge.wpm_50.name', desc: 'badge.wpm_50.desc',
      check: function (c) { return c.summary.bestWpm >= 50; }
    },
    {
      id: 'wpm_80', icon: '🏎️',
      name: 'badge.wpm_80.name', desc: 'badge.wpm_80.desc',
      check: function (c) { return c.summary.bestWpm >= 80; }
    },
    {
      id: 'acc_perfect', icon: '💯',
      name: 'badge.acc_perfect.name', desc: 'badge.acc_perfect.desc',
      check: function (c) { return c.summary.bestAcc >= 100 && c.summary.sessions >= 1; }
    },
    {
      id: 'combo_100', icon: '🔥',
      name: 'badge.combo_100.name', desc: 'badge.combo_100.desc',
      check: function (c) { return bestMaxCombo(c) >= 100; }
    },
    {
      id: 'combo_300', icon: '🌋',
      name: 'badge.combo_300.name', desc: 'badge.combo_300.desc',
      check: function (c) { return bestMaxCombo(c) >= 300; }
    },
    {
      id: 'streak_3', icon: '📅',
      name: 'badge.streak_3.name', desc: 'badge.streak_3.desc',
      check: function (c) { return c.streak >= 3; }
    },
    {
      id: 'streak_7', icon: '🗓️',
      name: 'badge.streak_7.name', desc: 'badge.streak_7.desc',
      check: function (c) { return c.streak >= 7; }
    },
    {
      id: 'streak_30', icon: '🏆',
      name: 'badge.streak_30.name', desc: 'badge.streak_30.desc',
      check: function (c) { return c.streak >= 30; }
    },
    {
      id: 'daily_goal', icon: '✅',
      name: 'badge.daily_goal.name', desc: 'badge.daily_goal.desc',
      check: function (c) { return c.goalMinutes > 0 && c.todayMinutes >= c.goalMinutes; }
    },
    {
      id: 'rounds_50', icon: '🎖️',
      name: 'badge.rounds_50.name', desc: 'badge.rounds_50.desc',
      check: function (c) { return c.summary.sessions >= 50; }
    },
    {
      id: 'all_modes', icon: '🧩',
      name: 'badge.all_modes.name', desc: 'badge.all_modes.desc',
      check: function (c) {
        var modes = {};
        (c.records || []).forEach(function (r) { modes[r.mode] = 1; });
        return modes.en2en && modes.zh2en && modes.listen;
      }
    },
    {
      id: 'no_mistake_round', icon: '🛡️',
      name: 'badge.no_mistake_round.name', desc: 'badge.no_mistake_round.desc',
      check: function (c) {
        return (c.records || []).some(function (r) {
          return (r.errors || 0) === 0 && (r.chars || 0) >= 100;
        });
      }
    },
    {
      id: 'night_owl', icon: '🦉',
      name: 'badge.night_owl.name', desc: 'badge.night_owl.desc',
      check: function (c) {
        return (c.records || []).some(function (r) {
          var h = new Date(r.ts).getHours();
          return h >= 0 && h < 5;
        });
      }
    }
  ];

  /** 单轮最高连击 */
  function bestMaxCombo(c) {
    var best = 0;
    (c.records || []).forEach(function (r) { if ((r.maxCombo || 0) > best) best = r.maxCombo || 0; });
    return best;
  }

  var Achievements = {

    /** 全部徽章定义 */
    all: function () { return LIST; },

    /** 已解锁的徽章：{ id: 时间戳 } */
    unlocked: function () { return ET.Store.badges(); },

    /** 徽章是否已解锁 */
    isUnlocked: function (id) { return !!ET.Store.badges()[id]; },

    /**
     * 组装判定上下文。
     * @param {Object} [record] 刚完成的这一轮成绩（可省略）
     */
    context: function (record) {
      var goalMinutes = ET.Store.get('dailyGoal') ? (parseInt(ET.Store.get('dailyGoalMinutes'), 10) || 10) : 0;
      return {
        record: record || null,
        summary: ET.Store.summary(),
        streak: ET.Store.get('streak') ? ET.Store.streak() : 0,
        todayMinutes: Math.round((ET.Store.today().seconds || 0) / 60 * 10) / 10,
        goalMinutes: goalMinutes,
        records: ET.Store.records()
      };
    },

    /**
     * 跑一遍全部成就判定，把新达成的解锁掉。
     * @param {Object} [record]
     * @returns {Array} 新解锁的徽章定义数组
     */
    evaluate: function (record) {
      var ctx = Achievements.context(record);
      var fresh = [];
      LIST.forEach(function (b) {
        if (ET.Store.badges()[b.id]) return;        // 已解锁就跳过
        var ok = false;
        try { ok = !!b.check(ctx); } catch (e) { ok = false; }
        if (ok && ET.Store.unlockBadge(b.id)) fresh.push(b);
      });
      return fresh;
    },

    /**
     * 每日目标的完成情况。
     * @returns {{minutes:number, goal:number, pct:number, done:boolean, enabled:boolean}}
     */
    dailyProgress: function () {
      var enabled = !!ET.Store.get('dailyGoal');
      var goal = parseInt(ET.Store.get('dailyGoalMinutes'), 10) || 10;
      var minutes = Math.round(((ET.Store.today().seconds || 0) / 60) * 10) / 10;
      var pct = goal > 0 ? Math.min(100, Math.round((minutes / goal) * 100)) : 0;
      return { minutes: minutes, goal: goal, pct: pct, done: pct >= 100, enabled: enabled };
    },

    /**
     * 徽章进度（给徽章弹窗显示「已解锁 n / 总数」）。
     * @returns {{unlocked:number, total:number}}
     */
    progress: function () {
      var u = ET.Store.badges();
      var n = LIST.filter(function (b) { return !!u[b.id]; }).length;
      return { unlocked: n, total: LIST.length };
    }
  };

  ET.Achievements = Achievements;

})(window.ET);
