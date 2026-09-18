/* =====================================================================
   store.js —— 本地数据仓库（设置 / 成绩 / 打卡 / 徽章 / 自定义文本）
   ---------------------------------------------------------------------
   【小白提示】
   · 所有数据都存在你自己浏览器的 localStorage 里，不上传服务器。
   · 想备份 / 换电脑：打开「成绩记录」弹窗，点「导出备份」。
   · localStorage 容量约 5MB，本项目只存文本和数字，够用很久。
   · 如果浏览器禁用了 localStorage（比如无痕模式），会自动退回「内存模式」，
     本次会话内一切正常，但关掉页面数据就没了，界面会给出提示。
   ===================================================================== */

(function (ET) {
  'use strict';

  var PREFIX = ET.STORAGE_PREFIX;
  var ls = null;          // 真正可用的 storage 对象
  var memory = {};        // 降级用的内存存储
  var listeners = {};     // 事件订阅表
  var cache = {};         // 读缓存，减少 JSON.parse 次数

  /* ---------------- 底层读写 ---------------- */

  function detectStorage() {
    try {
      var k = '__etp_test__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      ls = window.localStorage;
    } catch (e) {
      ls = null;   // 隐私模式 / 被策略禁用
    }
  }

  function rawGet(key) {
    var full = PREFIX + key;
    try {
      var s = ls ? ls.getItem(full) : memory[full];
      return s == null ? null : s;
    } catch (e) { return null; }
  }

  function rawSet(key, str) {
    var full = PREFIX + key;
    try {
      if (ls) ls.setItem(full, str);
      else memory[full] = str;
      return true;
    } catch (e) {
      // 可能是容量满了
      if (ET.UI && ET.UI.toast) ET.UI.toast('存储空间不足，数据未能保存', 'bad');
      return false;
    }
  }

  function read(key, fallback) {
    if (cache[key] !== undefined) return cache[key];
    var s = rawGet(key);
    var val;
    if (s == null) {
      val = fallback;
    } else {
      try { val = JSON.parse(s); } catch (e) { val = fallback; }
    }
    cache[key] = val;
    return val;
  }

  function write(key, val) {
    cache[key] = val;
    rawSet(key, JSON.stringify(val));
  }

  /* ---------------- 事件订阅 ---------------- */

  function emit(type, payload) {
    (listeners[type] || []).forEach(function (fn) {
      try { fn(payload); } catch (e) { console.error('[store] listener error', e); }
    });
  }

  /* ---------------- 对外 API ---------------- */

  var Store = {

    /** 初始化：检测存储可用性、写入首次使用时间 */
    init: function () {
      detectStorage();
      var meta = read(ET.KEYS.meta, null);
      if (!meta) {
        meta = { firstUse: Date.now(), version: ET.VERSION };
        write(ET.KEYS.meta, meta);
      }
      // 把默认设置补齐（版本升级后新增的设置项会自动获得默认值）
      Store.update({}, true);
      return Store;
    },

    /** 存储是否持久可用（false = 无痕模式下的内存降级） */
    isPersistent: function () { return !!ls; },

    /* ---------- 设置 ---------- */

    /**
     * 读取一个设置项。
     * @param {string} key
     * @returns {*}
     */
    get: function (key) {
      var s = Store.settings();
      return s[key] !== undefined ? s[key] : ET.DEFAULT_SETTINGS[key];
    },

    /** 读取完整设置对象（已与默认值合并） */
    settings: function () {
      if (!Store._settings) {
        var saved = read(ET.KEYS.settings, {});
        Store._settings = Object.assign({}, ET.DEFAULT_SETTINGS, saved || {});
      }
      return Store._settings;
    },

    /**
     * 修改设置（可以一次改多个）。
     * @param {Object} patch 例如 { theme: 'dark' }
     * @param {boolean} [silent] 为 true 时不触发事件（初始化用）
     */
    update: function (patch, silent) {
      var s = Store.settings();
      var changed = false;
      Object.keys(patch || {}).forEach(function (k) {
        if (s[k] !== patch[k]) { s[k] = patch[k]; changed = true; }
      });
      write(ET.KEYS.settings, s);
      if (changed && !silent) emit('settings', patch);
      return s;
    },

    /** 恢复默认设置 */
    resetSettings: function () {
      Store._settings = Object.assign({}, ET.DEFAULT_SETTINGS);
      write(ET.KEYS.settings, Store._settings);
      emit('settings', Store._settings);
    },

    /* ---------- 成绩记录 ---------- */

    /** 全部成绩（新的在前） */
    records: function () {
      var r = read(ET.KEYS.records, []);
      return Array.isArray(r) ? r : [];
    },

    /**
     * 追加一条成绩记录。
     * @param {Object} rec {wpm, acc, chars, seconds, score, maxCombo, mode, errorMode, source, items}
     */
    addRecord: function (rec) {
      var list = Store.records();
      rec.id = rec.id || ET.uid();
      rec.ts = rec.ts || Date.now();
      list.unshift(rec);
      if (list.length > ET.CONST.MAX_RECORDS) list = list.slice(0, ET.CONST.MAX_RECORDS);
      write(ET.KEYS.records, list);
      emit('records', list);
      return rec;
    },

    /**
     * 累计「今天」的练习量。用于每日目标与连续打卡。
     * @param {{chars:number, seconds:number, items:number}} delta
     */
    addDaily: function (delta) {
      var key = ET.dayKey();
      var d = read(ET.KEYS.daily, {});
      if (!d[key]) d[key] = { chars: 0, seconds: 0, items: 0, sessions: 0 };
      d[key].chars += delta.chars || 0;
      d[key].seconds += delta.seconds || 0;
      d[key].items += delta.items || 0;
      d[key].sessions += 1;
      write(ET.KEYS.daily, d);
      emit('daily', d);
      return d[key];
    },

    /** 全部每日数据 */
    daily: function () {
      var d = read(ET.KEYS.daily, {});
      return d && typeof d === 'object' ? d : {};
    },

    /** 今日数据（不存在则返回零值） */
    today: function () {
      return Store.daily()[ET.dayKey()] || { chars: 0, seconds: 0, items: 0, sessions: 0 };
    },

    /**
     * 计算连续打卡天数（从今天或昨天往前数）。
     * 规则：今天练过 → 从今天起往前数；今天没练但昨天练过 → 从昨天起往前数。
     * @returns {number}
     */
    streak: function () {
      var d = Store.daily();
      var cur = new Date();
      // 今天没练，则允许从昨天开始算（否则一过零点就清零，体验太差）
      if (!d[ET.dayKey(cur)]) {
        cur.setDate(cur.getDate() - 1);
        if (!d[ET.dayKey(cur)]) return 0;
      }
      var n = 0;
      while (d[ET.dayKey(cur)] && (d[ET.dayKey(cur)].sessions > 0 || d[ET.dayKey(cur)].chars > 0)) {
        n++;
        cur.setDate(cur.getDate() - 1);
      }
      return n;
    },

    /* ---------- 成就徽章 ---------- */

    /** 已解锁徽章：{ badgeId: 时间戳 } */
    badges: function () {
      var b = read(ET.KEYS.badges, {});
      return b && typeof b === 'object' ? b : {};
    },

    /**
     * 解锁一个徽章。
     * @param {string} id
     * @returns {boolean} 是否是「新解锁」（之前没有过）
     */
    unlockBadge: function (id) {
      var b = Store.badges();
      if (b[id]) return false;
      b[id] = Date.now();
      write(ET.KEYS.badges, b);
      emit('badges', b);
      return true;
    },

    /* ---------- 自定义文本 ---------- */

    /** 自定义文本库（最近使用的排前面） */
    customTexts: function () {
      var c = read(ET.KEYS.customTexts, []);
      return Array.isArray(c) ? c : [];
    },

    /**
     * 保存一份自定义文本，同类去重（按内容前 200 字比对）。
     * @param {{title:string, text:string, unit:string, zh:string}} item
     */
    saveCustom: function (item) {
      var list = Store.customTexts();
      var fingerprint = (item.text || '').slice(0, 200);
      list = list.filter(function (x) { return (x.text || '').slice(0, 200) !== fingerprint; });
      item.id = item.id || ET.uid();
      item.ts = Date.now();
      list.unshift(item);
      if (list.length > ET.CONST.MAX_CUSTOM) list = list.slice(0, ET.CONST.MAX_CUSTOM);
      write(ET.KEYS.customTexts, list);
      return item;
    },

    /** 删除一份自定义文本 */
    removeCustom: function (id) {
      var list = Store.customTexts().filter(function (x) { return x.id !== id; });
      write(ET.KEYS.customTexts, list);
      emit('custom', list);
      return list;
    },

    /* ---------- 顺序练习进度 ---------- */

    /**
     * 读出所有内容源的练习进度：{ 内容源id: 下一条的序号 }
     * 全量词库有 4000+ 词，靠这个做到「接着上次练」。
     */
    progress: function () {
      var p = read(ET.KEYS.progress, {});
      return (p && typeof p === 'object' && !Array.isArray(p)) ? p : {};
    },

    /** 某个内容源练到第几条了 */
    getProgress: function (id) {
      var n = parseInt(Store.progress()[id], 10);
      return (isFinite(n) && n > 0) ? n : 0;
    },

    /** 记录进度（传 0 或负数表示清除该项） */
    setProgress: function (id, n) {
      var p = Store.progress();
      if (n > 0) p[id] = n;
      else delete p[id];
      write(ET.KEYS.progress, p);
      return p;
    },

    /**
     * 重置进度。
     * @param {string} [id] 省略则重置全部内容源
     */
    resetProgress: function (id) {
      if (id) {
        var p = Store.progress();
        delete p[id];
        write(ET.KEYS.progress, p);
      } else {
        write(ET.KEYS.progress, {});
      }
      emit('progress', Store.progress());
      return Store.progress();
    },

    /* ---------- 备份：导出 / 导入 ---------- */

    /**
     * 备份文件的「项目标识」。
     * ⚠️ 这是文件格式的魔法字符串，不是显示名称 ——
     *    改它会让旧备份无法导入，所以新版仍然接受旧标识（见 LEGACY_APP_IDS）。
     */
    APP_ID: 'wordrush',
    /* 项目改名前叫 english-typing-practice。这个名单**不能跟着改名**，
       否则用户在那之前导出的备份就全废了。 */
    LEGACY_APP_IDS: ['english-typing-practice'],

    /**
     * 打包所有数据，用于导出 JSON。
     * @returns {Object}
     */
    exportAll: function () {
      return {
        app: Store.APP_ID,
        version: ET.VERSION,
        exportedAt: new Date().toISOString(),
        settings: Store.settings(),
        records: Store.records(),
        daily: Store.daily(),
        badges: Store.badges(),
        customTexts: Store.customTexts(),
        progress: Store.progress()
      };
    },

    /**
     * 「体检」一个备份文件 —— 只读，不写入任何东西。
     * 用途：在真正导入之前告诉用户「这个文件是谁导出的、里面有多少东西、格式对不对」，
     *       避免用户选错文件后一头雾水。
     * @param {*} data 已经 JSON.parse 过的对象
     * @returns {{ok:boolean, reason:string, exportedAt:string, version:string,
     *            records:number, days:number, badges:number, customTexts:number, hasSettings:boolean}}
     */
    inspectBackup: function (data) {
      var info = {
        ok: false,
        reason: '',
        exportedAt: '',
        version: '',
        records: 0,
        days: 0,
        badges: 0,
        customTexts: 0,
        hasSettings: false
      };

      if (data === null || data === undefined) { info.reason = 'empty'; return info; }
      if (typeof data !== 'object' || Array.isArray(data)) { info.reason = 'not-object'; return info; }
      // 靠这个标识判断「是不是本项目的备份」，否则随便一个 JSON 都会被吃进去。
      // 同时接受旧版标识（项目改名前叫 english-typing-practice），
      // 否则用户之前导出的备份就全废了。
      if (data.app !== Store.APP_ID && Store.LEGACY_APP_IDS.indexOf(data.app) < 0) {
        info.reason = 'wrong-app';
        return info;
      }

      info.ok = true;
      info.version = data.version || '';
      info.exportedAt = data.exportedAt || '';
      info.records = (Array.isArray(data.records)) ? data.records.length : 0;
      info.days = (data.daily && typeof data.daily === 'object') ? Object.keys(data.daily).length : 0;
      info.badges = (data.badges && typeof data.badges === 'object') ? Object.keys(data.badges).length : 0;
      info.customTexts = (Array.isArray(data.customTexts)) ? data.customTexts.length : 0;
      info.hasSettings = !!(data.settings && typeof data.settings === 'object');
      return info;
    },

    /**
     * 导入备份。会覆盖现有数据（文件里没带的项目则保持原样）。
     * @param {Object} data 导出的 JSON 对象
     * @returns {{ok:boolean, records:number, days:number}}
     */
    importAll: function (data) {
      var info = Store.inspectBackup(data);
      if (!info.ok) return { ok: false, records: 0, days: 0 };

      if (info.hasSettings) {
        Store._settings = Object.assign({}, ET.DEFAULT_SETTINGS, data.settings);
        write(ET.KEYS.settings, Store._settings);
      }

      if (Array.isArray(data.records)) {
        // 逐条过滤：只要「是对象且带合法时间戳」的记录。
        // 这样即使备份文件被人手工改坏了，也不会污染成绩列表导致图表和表格崩掉。
        var clean = data.records.filter(function (r) {
          return r && typeof r === 'object' && typeof r.ts === 'number' && isFinite(r.ts);
        });
        write(ET.KEYS.records, clean.slice(0, ET.CONST.MAX_RECORDS));
      }

      if (data.daily && typeof data.daily === 'object') write(ET.KEYS.daily, data.daily);
      if (data.badges && typeof data.badges === 'object') write(ET.KEYS.badges, data.badges);
      if (Array.isArray(data.customTexts)) {
        write(ET.KEYS.customTexts, data.customTexts.slice(0, ET.CONST.MAX_CUSTOM));
      }
      if (data.progress && typeof data.progress === 'object' && !Array.isArray(data.progress)) {
        write(ET.KEYS.progress, data.progress);
      }

      emit('settings', Store.settings());
      emit('records', Store.records());
      emit('progress', Store.progress());
      return { ok: true, records: info.records, days: info.days };
    },

    /** 清空本项目所有本地数据 */
    clearAll: function () {
      [ET.KEYS.settings, ET.KEYS.records, ET.KEYS.daily,
       ET.KEYS.badges, ET.KEYS.customTexts, ET.KEYS.progress, ET.KEYS.meta].forEach(function (k) {
        delete cache[k];
        try {
          if (ls) ls.removeItem(PREFIX + k);
          delete memory[PREFIX + k];
        } catch (e) { /* 忽略 */ }
      });
      Store._settings = null;
    },

    /* ---------- 统计汇总（成绩弹窗用） ---------- */

    /**
     * 汇总成绩数据。
     * @returns {Object} {sessions, totalChars, totalSeconds, bestWpm, avgWpm, streak, bestScore, bestAcc}
     */
    summary: function () {
      var list = Store.records();
      var s = {
        sessions: list.length, totalChars: 0, totalSeconds: 0,
        bestWpm: 0, avgWpm: 0, streak: Store.streak(),
        bestScore: 0, bestAcc: 0, wpmSum: 0
      };
      list.forEach(function (r) {
        s.totalChars += r.chars || 0;
        s.totalSeconds += r.seconds || 0;
        s.wpmSum += r.wpm || 0;
        if ((r.wpm || 0) > s.bestWpm) s.bestWpm = r.wpm || 0;
        if ((r.score || 0) > s.bestScore) s.bestScore = r.score || 0;
        if ((r.acc || 0) > s.bestAcc) s.bestAcc = r.acc || 0;
      });
      s.avgWpm = list.length ? Math.round(s.wpmSum / list.length) : 0;
      s.bestWpm = Math.round(s.bestWpm);
      return s;
    },

    /** 订阅事件：'settings' | 'records' | 'daily' | 'badges' | 'custom' */
    on: function (type, fn) {
      (listeners[type] = listeners[type] || []).push(fn);
      return function off() {
        listeners[type] = (listeners[type] || []).filter(function (f) { return f !== fn; });
      };
    }
  };

  ET.Store = Store;

})(window.ET);
