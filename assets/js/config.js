/* =====================================================================
   config.js —— 全局配置与默认值
   ---------------------------------------------------------------------
   【小白提示】这个文件是「总开关」。想改默认设置（比如默认主题、
   默认模式），改这个文件里的 DEFAULT_SETTINGS 即可。
   所有模块都挂在全局对象 window.ET 上，方便调试（浏览器控制台输入 ET 就能看到）。
   ===================================================================== */

window.ET = window.ET || {};

(function (ET) {
  'use strict';

  /* 版本号：以后发新版可以改这里，也方便用户反馈问题时确认版本 */
  ET.VERSION = '1.0.0';

  /* localStorage 的键名前缀，避免和同域名下其他网站的数据打架 */
  ET.STORAGE_PREFIX = 'etp:';

  /* 存储键名 */
  ET.KEYS = {
    settings:    'settings',      // 用户设置
    records:     'records',       // 每次练习的成绩记录
    daily:       'daily',         // 每日累计（用于打卡、每日目标）
    badges:      'badges',        // 已解锁的成就
    customTexts: 'customTexts',   // 用户自定义文本（保留最近若干份）
    progress:    'progress',      // 各内容源「练到第几条了」（顺序模式用）
    meta:        'meta'           // 其他杂项（首次使用时间等）
  };

  /* 应用常量 */
  ET.CONST = {
    MAX_RECORDS: 500,       // 最多保留多少条成绩记录（超出自动丢弃最旧的）
    MAX_CUSTOM: 20,         // 最多保留多少份自定义文本
    WPM_CHAR_UNIT: 5,       // 国际惯例：1 个「单词」按 5 个字符折算，用于算 WPM
    MISS_SCORE_PENALTY: 5,  // 打错一次扣多少分
    HIT_SCORE_BASE: 10,     // 打对一个字符的基础分
    ITEM_ADVANCE_DELAY: 260,// 自动进入下一题的延迟（毫秒），太快会看不清
    MASK_CHAR: '•'          // 「看中文打英文 / 听音打英文」模式下遮盖原文用的符号
  };

  /* 【核心配置】默认设置。清空浏览器数据后会回到这里的值。 */
  ET.DEFAULT_SETTINGS = {
    /* —— 外观 —— */
    theme: 'light',          // light | dark | study
    lang: 'zh',              // zh | en
    fontSize: 'md',          // sm | md | lg | xl

    /* —— 练习 —— */
    practiceMode: 'en2en',   // en2en 看英文打英文 | zh2en 看中文打英文 | listen 听音打英文
    errorMode: 'strict',     // strict 严格 | loose 宽松 | sentence 整句
    autoNext: true,          // 打对一题后是否自动跳到下一题
    sourceId: 'cet4full',    // 上次使用的内容源（默认用官方大纲全量词库）
    itemCount: 20,           // 每组题目数量
    shuffle: true,           // 是否打乱顺序；关掉 → 按顺序连续练习并记住进度
    showPhonetic: true,      // 「看英文打英文」模式下是否显示音标

    /* —— 发音 —— */
    voiceProvider: 'auto',   // auto | youdao | baidu | browser
    accent: 'us',            // us 美音 | uk 英音（有道词典接口支持）
    autoSpeak: true,         // 听音打英文模式：进入题目时自动播放（不播就没法做题）
    autoSpeakEn2en: true,    // 看英文打英文模式：打字前先自动读一遍（练发音记忆）
    speakOnFinish: false,    // 答对一题后自动朗读一次（用来加深记忆）
    speechRate: 1,           // 浏览器合成语音的语速（0.5 ~ 1.5）

    /* —— 趣味与激励（每一项都能单独关掉） —— */
    showWpm: true,
    showAcc: true,
    showCombo: true,
    showScore: true,
    showTime: true,
    showProgress: true,
    sound: true,             // 打字音效
    soundVolume: 0.4,
    dailyGoal: true,         // 每日目标
    dailyGoalMinutes: 10,    // 每日目标：练习多少分钟
    badges: true,            // 成就徽章
    streak: true,            // 连续打卡
    showPronounceButton: true,

    /* —— 其他 —— */
    strictSpaceTip: true     // 提示「空格」等易错点
  };

  /* 三项练习模式（界面上渲染分段控件用） */
  ET.PRACTICE_MODES = ['en2en', 'zh2en', 'listen'];

  /* 三种打错处理模式 */
  ET.ERROR_MODES = ['strict', 'loose', 'sentence'];

  /* 说话人/口音选项 */
  ET.ACCENTS = ['us', 'uk'];

  /* 主题列表（点顶部按钮时循环切换） */
  ET.THEMES = ['light', 'dark', 'study'];

  /**
   * 把「打错处理模式」翻译成人话，用于成绩记录里显示。
   * @param {string} k 模式 key
   * @returns {string}
   */
  ET.errorModeLabel = function (k) {
    return { strict: '严格模式', loose: '宽松模式', sentence: '整句模式' }[k] || k;
  };

  /**
   * 把「练习模式」翻译成人话。
   * @param {string} k
   * @returns {string}
   */
  ET.practiceModeLabel = function (k) {
    return { en2en: '看英文打英文', zh2en: '看中文打英文', listen: '听音打英文' }[k] || k;
  };

  /**
   * 简易工具：生成唯一 id（不依赖 crypto，兼容性更好）。
   * @returns {string}
   */
  ET.uid = function () {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  };

  /**
   * 简易工具：取今天的日期字符串 YYYY-MM-DD（本地时区）。
   * 打卡、每日目标会用到。
   * @param {Date} [d]
   * @returns {string}
   */
  ET.dayKey = function (d) {
    var dt = d ? new Date(d) : new Date();
    var m = String(dt.getMonth() + 1).padStart(2, '0');
    var day = String(dt.getDate()).padStart(2, '0');
    return dt.getFullYear() + '-' + m + '-' + day;
  };

  /**
   * 把秒数格式化成 m:ss。
   * @param {number} sec
   * @returns {string}
   */
  ET.fmtTime = function (sec) {
    var s = Math.max(0, Math.floor(sec || 0));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  };

  /**
   * 把数字限制在区间内。
   */
  ET.clamp = function (v, min, max) {
    return v < min ? min : (v > max ? max : v);
  };

  /**
   * 数组洗牌（Fisher–Yates 算法），不修改原数组。
   * @param {Array} arr
   * @returns {Array}
   */
  ET.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  /**
   * 转义 HTML，防止用户自定义文本里的 < > & 破坏页面结构。
   * @param {string} s
   * @returns {string}
   */
  ET.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

})(window.ET);
