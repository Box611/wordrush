/* =====================================================================
   content.js —— 内容管理：内置词库 / 网络内容源 / 自定义文本
   ---------------------------------------------------------------------
   职责：
     1. 汇总所有可选「内容源」（词库、短句、文章、网页选段、我的内容）；
     2. 把一段原始英文文本按「句 / 词 / 段」正确拆分；
     3. 生成一轮练习的题目队列（抽取数量、是否打乱）。

   【小白提示】想改拆分规则（比如决定什么算一句话），改本文件的
   splitSentences 函数即可。
   ===================================================================== */

(function (ET) {
  'use strict';

  /**
   * 文本归一化。
   * 作用：把从网页 / Word / PDF 复制来的「花式字符」换成普通 ASCII 字符，
   *       否则用户永远打不对（因为键盘上根本没有那些字符）。
   * 处理内容：弯引号 → 直引号、长破折号 → 减号、省略号 → 三个点、不换行空格 → 普通空格。
   * @param {string} s
   * @returns {string}
   */
  function normalize(s) {
    return String(s == null ? '' : s)
      .replace(/[\u2018\u2019\u201B\u2032\u00B4`]/g, "'")   // ' ' ´ `
      .replace(/[\u201C\u201D\u201F\u2033]/g, '"')          // " "
      .replace(/[\u2013\u2014\u2015\u2212]/g, '-')          // – — ― −
      .replace(/\u2026/g, '...')                            // …
      .replace(/[\u00A0\u2007\u202F\u2009\u200A]/g, ' ')   // 各种不换行/细空格
      .replace(/[\uFF01-\uFF5E]/g, function (c) {           // 全角字符 → 半角
        return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
      })
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t\f\v]+/g, ' ')                          // 连续空格压成一个
      .trim();
  }

  /* 常见英文缩写，拆句时要保护它们内部的点不被当成句号。
     分组含义：
       · 头衔/月份等 —— 后面一定跟着名字或数字，绝不能在这里断句
       · e.g. / i.e. / etc. —— 本身就是缩写
       · a.m. / p.m. —— 时间，后面常接小写，容易被误判 */
  var ABBR = 'Mr|Mrs|Ms|Dr|St|Prof|vs|etc|Inc|Ltd|Co|Jr|Sr|' +
             'Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|' +
             'e\\.g|i\\.e|A\\.M|P\\.M|a\\.m|p\\.m';

  /**
   * 判断一句「以缩写结尾」的文本，其末尾的点是不是句号。
   * 用来做拆句后的合并判断：
   *   "…lives in the U.S." + "He earns…"   → 不该合并（U.S. 后面确实是新句子）
   *   "…at 9 A.M."        + "he left."     → 应该合并（A.M. 后面的点只是缩写的一部分）
   * 判断依据：缩写后面的下一句首字母是小写 → 说明这里本来不该断开。
   */
  var RE_ABBR_TAIL = /(?:^|[\s"'(])(?:[A-Za-z]\.){2,}$/;      // 如 U.S. / A.M.
  var RE_ABBR_TAIL2 = new RegExp('(?:^|[\\s"\'(])(?:' + ABBR + ')$');

  /**
   * 把一段文本拆成句子。
   * @param {string} text
   * @returns {string[]}
   */
  function splitSentences(text) {
    var t = normalize(text).replace(/\n+/g, ' ');
    var guards = [];
    function hide(m) { guards.push(m); return '\u0001' + (guards.length - 1) + '\u0001'; }
    function restore(s) {
      return s.replace(/\u0001(\d+)\u0001/g, function (m, i) { return guards[+i]; });
    }

    // ── 第 1 步：把「不该被拆开」的地方先藏起来 ──
    t = t.replace(/\b\d+\.\d+/g, hide);                             // 小数 3.5
    t = t.replace(new RegExp('\\b(?:' + ABBR + ')\\.', 'g'), hide); // 常见缩写整体隐藏
    t = t.replace(/\b[A-Za-z]\.(?=[A-Za-z]\.)/g, hide);            // 首字母缩写内部的点 U.S.
    t = t.replace(/\bhttps?:\/\/\S+/g, hide);                      // 网址

    // ── 第 2 步：按 . ! ? 切分并还原 ──
    var chunks = t.match(/[^.!?]+[.!?]*/g) || [];
    var out = [];
    chunks.forEach(function (chunk) {
      var s = restore(chunk).replace(/\s+/g, ' ').trim();
      if (!s || !/[A-Za-z0-9]/.test(s)) return;

      // ── 第 3 步：合并不该断开的句子 ──
      // 条件：上一句以缩写结尾，且本句以小写字母开头
      var prev = out[out.length - 1];
      if (prev && /^[a-z]/.test(s) &&
          (RE_ABBR_TAIL.test(prev) || RE_ABBR_TAIL2.test(prev))) {
        out[out.length - 1] = prev + ' ' + s;
        return;
      }
      out.push(s);
    });

    return out;
  }

  /**
   * 把一段文本拆成单词（去重、保留出现顺序）。
   * @param {string} text
   * @returns {string[]}
   */
  function splitWords(text) {
    var t = normalize(text);
    var words = t.match(/[A-Za-z][A-Za-z'\-]*/g) || [];
    var seen = {};
    var out = [];
    words.forEach(function (w) {
      // 过滤掉单字母的 "a" 之外的孤立标点残留；统一小写去重
      var key = w.toLowerCase();
      if (!seen[key]) { seen[key] = 1; out.push(w); }
    });
    return out;
  }

  /**
   * 把一段文本拆成段落。
   * @param {string} text
   * @returns {string[]}
   */
  function splitParagraphs(text) {
    var src = String(text || '').replace(/\r\n?/g, '\n');
    var parts = src.split(/\n\s*\n/);
    if (parts.length === 1) parts = src.split(/\n/);        // 没有空行就按单换行拆

    // 兜底：整段是一行长文时，按句子分组，每 3 句合成一个「段落」
    if (parts.length === 1) {
      var sents = splitSentences(src);
      parts = [];
      for (var i = 0; i < sents.length; i += 3) {
        parts.push(sents.slice(i, i + 3).join(' '));
      }
      if (parts.length === 1) return sents.filter(function (s) { return s.length > 0; });
    }

    return parts
      .map(function (s) { return normalize(s).replace(/\n+/g, ' ').trim(); })
      .filter(function (s) { return /[A-Za-z]/.test(s); });
  }

  /**
   * 统一入口：按指定单位拆分文本。
   * @param {string} text
   * @param {'word'|'sentence'|'paragraph'} unit
   * @returns {string[]}
   */
  function splitText(text, unit) {
    if (unit === 'word') return splitWords(text);
    if (unit === 'paragraph') return splitParagraphs(text);
    return splitSentences(text);
  }

  /* ------------------------------------------------------------------
     内容源注册表
     ------------------------------------------------------------------ */

  var Content = {

    /** 单位 -> 界面上的标签 key */
    UNIT_LABEL: { word: 'prompt.word', sentence: 'prompt.sentence', paragraph: 'prompt.paragraph' },

    /**
     * 列出所有可用的内置内容源。
     * 顺序 = 界面上按钮的顺序。
     *   cet4full / cet6full —— 官方大纲全量词库（由 tools/build-wordbook.mjs 生成）
     *   cet4 / cet6 / phrases / passages —— 手写的精选内容（方便照格式自己加）
     * @returns {Array}
     */
    allSources: function () {
      var list = [];
      var D = ET.DATA || {};
      ['cet4full', 'cet6full', 'cet4', 'cet6', 'phrases', 'passages'].forEach(function (k) {
        if (D[k]) list.push(D[k]);
      });
      (ET.SOURCES || []).forEach(function (s) { list.push(s); });
      return list;
    },

    /**
     * 按 id 找一个内容源。
     * @param {string} id
     * @returns {Object|null}
     */
    getSource: function (id) {
      var all = Content.allSources();
      for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
      return null;
    },

    /** 是否是「网络内容源」（内含多篇文本，需要选择具体篇目） */
    isWebSource: function (id) {
      var s = Content.getSource(id);
      return !!(s && s.texts && s.texts.length);
    },

    /**
     * 取某个网络内容源的所有篇目。
     * @param {string} id
     * @returns {Array}
     */
    webTexts: function (id) {
      var s = Content.getSource(id);
      return (s && s.texts) || [];
    },

    /** 归一化等工具函数，外部也能用 */
    normalize: normalize,
    splitText: splitText,

    /* 用户自定义内容：由 ui.js 在点击「开始练习」时写入 */
    _custom: null,

    /**
     * 设置自定义内容。
     * @param {{items:Array, label:string, unit:string, raw:string}} obj
     */
    setCustom: function (obj) { Content._custom = obj; },

    /** 读取自定义内容 */
    getCustom: function () { return Content._custom; },

    /**
     * 把粘贴的文本 + 中文释义行，解析成题目数组。
     * @param {string} text 英文原文
     * @param {'word'|'sentence'|'paragraph'} unit
     * @param {string} [zhText] 中文，按行对应
     * @returns {{items:Array<{en:string,zh:string}>, total:number}}
     */
    parseCustom: function (text, unit, zhText) {
      var en = splitText(text, unit);
      var zh = String(zhText || '')
        .replace(/\r\n?/g, '\n')
        .split('\n')
        .map(function (s) { return s.trim(); });
      // 中文行数不足时，多余的中文按「空」处理；行数多了则忽略
      var items = en.map(function (e, i) {
        return { en: e, zh: zh[i] || '', ipa: '' };
      });
      return { items: items, total: items.length };
    },

    /**
     * 尝试从网址加载纯文本。
     * ⚠️ 浏览器跨域（CORS）限制：只有对方服务器允许跨域时才会成功。
     * @param {string} url
     * @returns {Promise<string>}
     */
    fetchFromUrl: function (url) {
      return fetch(url, { mode: 'cors', credentials: 'omit' })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.text();
        })
        .then(function (raw) {
          // 如果是 HTML，就把标签去掉只留下文字
          if (/<html|<!doctype html/i.test(raw)) {
            var doc = new DOMParser().parseFromString(raw, 'text/html');
            doc.querySelectorAll('script,style,noscript,header,footer,nav').forEach(function (n) { n.remove(); });
            raw = (doc.body ? doc.body.innerText || doc.body.textContent : '') || '';
          }
          return normalize(raw);
        });
    },

    /**
     * 生成一轮练习的题目队列。
     * @param {string} sourceId 内容源 id；特殊值 'custom' 表示使用自定义内容
     * @param {Object} opts
     *        count    本组数量（数字或 'all'）
     *        unit     拆分单位（网络内容源用）
     *        shuffle  是否打乱（false = 按原顺序）
     *        textId   网络内容源选哪一篇
     *        from     顺序模式下的起始位置（用于「接着上次练」）
     * @returns {{items:Array, label:string, unit:string, textId:string, total:number,
     *            from:number, sequential:boolean}}
     */
    buildQueue: function (sourceId, opts) {
      opts = opts || {};
      var unit = opts.unit || 'word';
      var count = opts.count === 'all' ? Infinity : (parseInt(opts.count, 10) || 20);
      var pool = [];
      var label = '';
      var textId = '';

      if (sourceId === 'custom') {
        var c = Content.getCustom();
        if (!c || !c.items || !c.items.length) {
          return { items: [], label: 'Custom', unit: unit, textId: '', total: 0, from: 0, sequential: false };
        }
        pool = c.items.slice();
        unit = c.unit || unit;
        label = c.label || 'Custom';
      } else {
        var src = Content.getSource(sourceId);
        if (!src) return { items: [], label: '', unit: unit, textId: '', total: 0, from: 0, sequential: false };

        if (src.texts && src.texts.length) {
          // 网络内容源：先挑一篇文本，再把这篇文本按单位拆分
          var texts = src.texts;
          var idx = Math.floor(Math.random() * texts.length);   // 默认随机挑一篇
          if (opts.textId) {
            for (var i = 0; i < texts.length; i++) if (texts[i].id === opts.textId) idx = i;
          }
          var t = texts[idx];
          textId = t.id || String(idx);
          unit = opts.unit || src.unit || 'sentence';
          pool = splitText(t.body, unit).map(function (s) { return { en: s, zh: '', ipa: '' }; });
          label = (t.title && (t.title[ET.currentLang()] || t.title.zh)) || src.name.zh;
        } else {
          unit = src.unit || 'word';
          pool = (src.items || []).map(function (it) {
            // 词库条目格式：[英文, 中文释义, 音标(可能为空)]
            return Array.isArray(it)
              ? { en: it[0], zh: it[1], ipa: it[2] || '' }
              : { en: it.en, zh: it.zh || '', ipa: it.ipa || '' };
          });
          label = src.name[ET.currentLang()] || src.name.zh;
        }
      }

      var total = pool.length;
      var sequential = (opts.shuffle === false);

      // 顺序模式：从「上次练到的位置」开始，练到末尾自动绕回开头。
      // 全量词库有 4000+ 词，如果每轮都从头取 20 个，等于永远只练前 20 个。
      var from = 0;
      if (sequential && total > 0 && typeof opts.from === 'number' && opts.from > 0) {
        from = opts.from % total;
        pool = pool.slice(from).concat(pool.slice(0, from));
      }

      if (!sequential) pool = ET.shuffle(pool);
      if (isFinite(count) && pool.length > count) pool = pool.slice(0, count);

      return { items: pool, label: label, unit: unit, textId: textId, total: total, from: from, sequential: sequential };
    },

    /**
     * 判断题目集合里有多少条带中文释义（决定「看中文打英文」能不能用）。
     * @param {Array} items
     * @returns {number}
     */
    countWithZh: function (items) {
      return (items || []).filter(function (i) { return !!i.zh; }).length;
    },

    /**
     * 给内容源生成界面上的显示名。
     * @param {Object} src
     * @returns {string}
     */
    sourceName: function (src) {
      if (!src || !src.name) return '';
      return src.name[ET.currentLang()] || src.name.zh || '';
    }
  };

  ET.Content = Content;

})(window.ET);
