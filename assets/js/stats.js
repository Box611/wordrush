/* =====================================================================
   stats.js —— 成绩计算与走势图
   ---------------------------------------------------------------------
   两个核心指标的口径说明（很重要，避免你疑惑「为什么数字和别的不一样」）：

     WPM（Words Per Minute，每分钟单词数）
       国际通行算法：1 个「单词」= 5 个字符。
       WPM = 正确字符数 ÷ 5 ÷ 用时（分钟）
       这里用的是「净速度」，打错的字符不计入 —— 所以只要正确率高，
       速度就是真实可用的速度。

     正确率 = 正确字符数 ÷ 总输入字符数 × 100%
       只统计你真正敲过的字符，没打的部分不算错。
  ===================================================================== */

(function (ET) {
  'use strict';

  var Stats = {

    /**
     * 计算 WPM。
     * @param {number} correctChars 正确字符数
     * @param {number} seconds 用时（秒）
     * @returns {number} 取整后的 WPM
     */
    wpm: function (correctChars, seconds) {
      if (!seconds || seconds < 0.6) return 0;
      var minutes = seconds / 60;
      var words = correctChars / ET.CONST.WPM_CHAR_UNIT;
      var v = words / minutes;
      if (!isFinite(v) || v < 0) return 0;
      return Math.round(v);
    },

    /**
     * 计算正确率（0~100，保留 1 位小数）。
     * @param {number} correct
     * @param {number} total
     * @returns {number}
     */
    accuracy: function (correct, total) {
      if (!total) return 100;
      var v = (correct / total) * 100;
      return Math.round(v * 10) / 10;
    },

    /**
     * 计算得分。
     * 规则：每打对一个字符得基础分，连击越高分数倍率越高；打错扣分（不低于 0）。
     * @param {number} correctChars
     * @param {number} errors
     * @param {number} maxCombo
     * @returns {number}
     */
    score: function (correctChars, errors, maxCombo) {
      var comboBonus = 1 + Math.min(maxCombo, 200) / 200;   // 最多 2 倍
      var raw = correctChars * ET.CONST.HIT_SCORE_BASE * comboBonus;
      var penalty = errors * ET.CONST.MISS_SCORE_PENALTY;
      return Math.max(0, Math.round(raw - penalty));
    },

    /**
     * 根据 WPM 给一个等级评价（用于成绩页的文案）。
     * @param {number} wpm
     * @returns {'perfect'|'good'|'keepGoing'}
     */
    grade: function (wpm, acc) {
      if (acc >= 99 && wpm >= 40) return 'perfect';
      if (acc >= 92) return 'good';
      return 'keepGoing';
    },

    /**
     * 把一条完整的练习数据汇总成一条成绩记录。
     * @param {Object} s 引擎的统计状态
     * @returns {Object}
     */
    buildRecord: function (s) {
      var seconds = Math.max(0.1, s.seconds);
      var wpm = Stats.wpm(s.correctChars, seconds);
      return {
        mode: s.practiceMode,
        errorMode: s.errorMode,
        source: s.sourceLabel,
        items: s.itemsDone,
        itemsTotal: s.itemsTotal,
        chars: s.typedChars,
        correctChars: s.correctChars,
        errors: s.errors,
        seconds: Math.round(seconds),
        wpm: wpm,
        acc: Stats.accuracy(s.correctChars, s.typedChars),
        maxCombo: s.maxCombo,
        score: Stats.score(s.correctChars, s.errors, s.maxCombo)
      };
    },

    /* ------------------------------------------------------------------
       走势图：用 Canvas 手绘折线图（不引入任何图表库，保持零依赖）
       ------------------------------------------------------------------ */

    /**
     * 在 canvas 上绘制 WPM 折线图。
     * @param {HTMLCanvasElement} canvas
     * @param {Array} records 成绩记录数组（新的在前）
     */
    drawChart: function (canvas, records) {
      if (!canvas) return;
      var list = (records || []).slice(0, 20).reverse();   // 取最近 20 条，按时间正序
      var css = getComputedStyle(document.documentElement);
      function v(name, fb) { return (css.getPropertyValue(name) || '').trim() || fb; }

      var colText = v('--text-soft', '#666');
      var colMuted = v('--muted', '#999');
      var colLine = v('--primary', '#4f46e5');
      var colFill = v('--primary-soft', 'rgba(79,70,229,.15)');
      var colBorder = v('--border', '#ddd');

      var dpr = window.devicePixelRatio || 1;
      var cssW = canvas.clientWidth || 640;
      var cssH = parseInt(canvas.getAttribute('height'), 10) || 180;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);

      var ctx = canvas.getContext('2d');
      // 极少数环境（老浏览器、无头测试环境、被策略禁用）拿不到 2D 上下文，
      // 这时直接放弃画图即可 —— 图表只是锦上添花，不该影响主功能。
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      var padL = 38, padR = 12, padT = 14, padB = 26;
      var w = cssW - padL - padR;
      var h = cssH - padT - padB;

      // 无数据时的占位文字
      if (!list.length) {
        ctx.fillStyle = colMuted;
        ctx.font = '13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ET.t('history.empty'), cssW / 2, cssH / 2);
        return;
      }

      var vals = list.map(function (r) { return r.wpm || 0; });
      var maxV = Math.max.apply(null, vals.concat([10]));
      var minV = 0;
      var span = Math.max(1, maxV - minV);

      function x(i) { return padL + (list.length === 1 ? w / 2 : (i / (list.length - 1)) * w); }
      function y(val) { return padT + h - ((val - minV) / span) * h; }

      // 横向网格线
      ctx.strokeStyle = colBorder;
      ctx.lineWidth = 1;
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillStyle = colMuted;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (var g = 0; g <= 4; g++) {
        var gv = minV + (span * g) / 4;
        var gy = y(gv);
        ctx.beginPath();
        ctx.moveTo(padL, gy);
        ctx.lineTo(padL + w, gy);
        ctx.globalAlpha = g === 0 ? 0.9 : 0.45;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillText(String(Math.round(gv)), padL - 6, gy);
      }

      // 面积填充
      ctx.beginPath();
      ctx.moveTo(x(0), y(vals[0]));
      for (var i = 1; i < vals.length; i++) ctx.lineTo(x(i), y(vals[i]));
      ctx.lineTo(x(vals.length - 1), padT + h);
      ctx.lineTo(x(0), padT + h);
      ctx.closePath();
      ctx.fillStyle = colFill;
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;

      // 折线
      ctx.beginPath();
      ctx.moveTo(x(0), y(vals[0]));
      for (var j = 1; j < vals.length; j++) ctx.lineTo(x(j), y(vals[j]));
      ctx.strokeStyle = colLine;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // 数据点
      ctx.fillStyle = colLine;
      for (var k = 0; k < vals.length; k++) {
        ctx.beginPath();
        ctx.arc(x(k), y(vals[k]), list.length > 14 ? 2.2 : 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 最高点标注
      var maxIdx = vals.indexOf(Math.max.apply(null, vals));
      ctx.fillStyle = colText;
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(vals[maxIdx] + '', x(maxIdx), y(vals[maxIdx]) - 6);
    }
  };

  ET.Stats = Stats;

})(window.ET);
