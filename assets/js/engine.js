/* =====================================================================
   engine.js —— 打字练习引擎（本项目的心脏）
   ---------------------------------------------------------------------
   它负责三件事：
     1. 题目队列的推进（第几题、还剩几题、什么时候算一轮结束）
     2. 实时比对「你打的」和「应该打的」，产出每个字符的状态
     3. 统计速度 / 正确率 / 连击 / 得分

   ── 关于三种「打错处理」模式的实现差异 ──────────────────────────────
   严格模式 strict：
       每次输入都检查「你打的」是不是目标文本的前缀。
       不是 → 把输入回退到最后一个正确的字符，并震动提示。
       所以用户永远不可能打出错误字符，只能一直对下去。

   宽松模式 loose：
       照单全收，只在视觉上把错的字符标红。
       由于是按「位置」比对（第 3 个字符和第 3 个字符比），
       一旦漏打一个字母，后面会整体错位、连续标红。
       这时按「退格」删掉重打即可。这是同类网站的通行为，也是最直观的。

   整句模式 sentence：
       输入阶段完全不做判定，你可以随便打；
       按 Enter（或打满长度）后统一判卷，列出所有不同之处。
       再按一次 Enter 进入下一题。

   ── 计时口径 ──────────────────────────────────────────────────────
   计时从「第一次按键」开始，而不是题目出现的瞬间 ——
   否则你发呆 10 秒再打，速度会被冤枉地拉低。
   ===================================================================== */

(function (ET) {
  'use strict';

  /* ---------------- 内部状态 ---------------- */

  var state = {
    /* 题目 */
    items: [],
    index: 0,
    meta: { label: '', unit: 'word', sourceId: '', textId: '' },

    /* 模式 */
    practiceMode: 'en2en',
    errorMode: 'strict',

    /* 当前输入 */
    typed: '',
    locked: false,          // 答完一题后的短暂冻结，防止手快把字打到下一题
    scored: false,          // 整句模式：是否已经判过卷

    /* 计时 */
    started: false,
    startAt: 0,
    seconds: 0,
    timerId: null,

    /* 统计 */
    typedChars: 0,
    correctChars: 0,
    errors: 0,
    skipped: 0,
    combo: 0,
    maxCombo: 0,
    itemsDone: 0,
    roundStartAt: 0,

    /* 加成分 */
    score: 0,

    finished: false
  };

  var listeners = {};
  var advanceTimer = null;

  function on(type, fn) {
    (listeners[type] = listeners[type] || []).push(fn);
    return function off() {
      listeners[type] = (listeners[type] || []).filter(function (f) { return f !== fn; });
    };
  }

  function emit(type, payload) {
    (listeners[type] || []).forEach(function (fn) {
      try { fn(payload); } catch (e) { console.error('[engine] listener error', e); }
    });
  }

  /* ---------------- 工具 ---------------- */

  /** 当前题目的英文原文 */
  function target() {
    var it = state.items[state.index];
    return it ? it.en : '';
  }

  /** 当前题目的中文释义 */
  function targetZh() {
    var it = state.items[state.index];
    return it ? (it.zh || '') : '';
  }

  /** 当前题目对象 */
  function currentItem() {
    return state.items[state.index] || null;
  }

  /** 清空输入框内容（UI 侧） */
  function clearInput() {
    emit('resetInput');
  }

  /* ---------------- 计时 ---------------- */

  function startTimer() {
    if (state.started) return;
    state.started = true;
    state.startAt = Date.now();
    state.timerId = setInterval(function () {
      state.seconds = (Date.now() - state.startAt) / 1000;
      emit('tick', state.seconds);
    }, 250);
    emit('started');
  }

  function stopTimer() {
    if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
    if (state.started) state.seconds = (Date.now() - state.startAt) / 1000;
  }

  /* ---------------- 统计 ---------------- */

  /**
   * 记录一次「敲下去的字符」。
   * 注意：这是累加计数，退格不会把数字减回去 ——
   *      因为我们统计的是「你敲了多少次、对了多少次」，
   *      打错再退格并不会让那次错误消失。
   * @param {boolean} ok 这个字符是否正确
   * @param {number} pos 在目标文本中的位置
   */
  function registerChar(ok, pos) {
    state.typedChars++;
    if (ok) {
      state.correctChars++;
      state.combo++;
      if (state.combo > state.maxCombo) state.maxCombo = state.combo;
    } else {
      state.errors++;
      state.combo = 0;
    }
    state.score = ET.Stats.score(state.correctChars, state.errors, state.maxCombo);
    emit('char', { ok: ok, pos: pos });
  }

  /**
   * 处理输入变化，把新增字符计入统计。
   * @param {string} prev 旧输入
   * @param {string} next 新输入
   * @param {string} tgt  目标文本
   */
  function diffAndRegister(prev, next, tgt) {
    if (next.length > prev.length) {
      // 新增字符：只统计尾部新增的部分
      // （严格模式下我们已保证前面的前缀是对的，所以这里无需回溯）
      for (var i = prev.length; i < next.length; i++) {
        var c = next.charAt(i);
        var ok = i < tgt.length && c === tgt.charAt(i);
        registerChar(ok, i);
      }
    } else if (next.length < prev.length) {
      // 退格：把连击清零（小小的惩罚，鼓励一次打对）
      if (state.combo > 0) {
        state.combo = 0;
        state.score = ET.Stats.score(state.correctChars, state.errors, state.maxCombo);
      }
    }
  }

  /* ---------------- 输入处理 ---------------- */

  /**
   * ⚠️ 这是引擎最重要的入口，由 ui.js 在输入框的 input 事件里调用。
   * @param {string} rawValue 输入框里的原始值
   * @returns {string} 经过引擎校正后、真正应该显示在输入框里的值
   */
  function handleInput(rawValue) {
    var tgt = target();
    if (!tgt || state.finished) return '';

    var value = String(rawValue == null ? '' : rawValue)
      .replace(/[\r\n\t]+/g, ' ')          // 单行化：换行符当作空格
      .replace(/\s{2,}/g, ' ');            // 连续空格压成一个（防止误按连打空格）

    if (state.locked) return value.slice(0, state.typed.length); // 冻结期间只回退

    startTimer();

    if (state.errorMode === 'sentence') {
      // ── 整句模式：自由输入，只限制长度
      if (value.length > tgt.length) value = value.slice(0, tgt.length);
      diffAndRegister(state.typed, value, tgt);
      state.typed = value;
      emit('state', model());
      // 打满长度即自动判卷
      if (state.typed.length === tgt.length) scoreSentence();
      return value;
    }

    if (state.errorMode === 'strict') {
      // ── 严格模式：不允许出现错误字符
      var matchLen = 0;
      while (matchLen < value.length && matchLen < tgt.length &&
             value.charAt(matchLen) === tgt.charAt(matchLen)) {
        matchLen++;
      }
      if (matchLen < value.length) {
        // 有错误 → 拒绝这部分输入
        var rejected = value.slice(matchLen);
        for (var i = 0; i < rejected.length; i++) {
          registerChar(false, matchLen + i);     // 记一次错误（为了正确率统计）
        }
        emit('reject', { at: matchLen, chars: rejected });
        value = value.slice(0, matchLen);
      }
      if (value.length > tgt.length) value = value.slice(0, tgt.length);
      diffAndRegister(state.typed, value, tgt);
      state.typed = value;
      emit('state', model());
      if (state.typed.length === tgt.length) completeItem();
      return value;
    }

    // ── 宽松模式：照单全收，只在视觉上标红
    if (value.length > tgt.length) value = value.slice(0, tgt.length);
    diffAndRegister(state.typed, value, tgt);
    state.typed = value;
    emit('state', model());
    if (state.typed.length === tgt.length) completeItem();
    return value;
  }

  /**
   * 整句模式判卷。把每个字符的判定结果整理出来，交给 UI 展示。
   */
  function scoreSentence() {
    if (state.scored) return;
    state.scored = true;
    var tgt = target();
    var typed = state.typed;
    var wrong = [];
    var detail = [];
    for (var i = 0; i < tgt.length; i++) {
      var got = i < typed.length ? typed.charAt(i) : '';
      var want = tgt.charAt(i);
      var ok = got === want;
      if (!ok) wrong.push({ pos: i, want: want, got: got });
      detail.push(ok ? 'ok' : 'bad');
    }
    state.locked = true;
    emit('sentenceScored', { wrong: wrong, detail: detail, target: tgt, typed: typed });
    completeItem();
  }

  /* ---------------- 题目推进 ---------------- */

  /** 完成当前题目 */
  function completeItem() {
    if (state.locked && state.errorMode !== 'sentence') return;
    state.itemsDone++;
    state.locked = true;
    emit('itemDone', currentItem());
    clearInput();

    if (state.errorMode === 'sentence') {
      // 整句模式：一定要留时间让用户看清「哪里错了」，
      // 所以这里不会自动跳题，等用户按 Enter 再走。
      // （别担心会卡住，UI 上会提示「按 Enter 进入下一题」）
      return;
    }

    if (ET.Store.get('autoNext') !== false) {
      advanceTimer = setTimeout(function () { next(); }, ET.CONST.ITEM_ADVANCE_DELAY);
    }
  }

  /** 进入下一题 */
  function next() {
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    state.index++;
    state.typed = '';
    state.locked = false;
    state.scored = false;
    clearInput();

    if (state.index >= state.items.length) {
      emit('state', model());
      finishRound();
      return;
    }
    emit('item', currentItem());
    emit('state', model());
  }

  /** 跳过当前题（不计入正确答案，但会记一次「跳过」） */
  function skip() {
    if (state.finished) return;
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    state.skipped++;
    state.index++;
    state.typed = '';
    state.locked = false;
    state.scored = false;
    clearInput();
    if (state.index >= state.items.length) {
      emit('state', model());
      finishRound();
      return;
    }
    emit('item', currentItem());
    emit('state', model());
  }

  /** 结束一轮，产出成绩记录 */
  function finishRound() {
    if (state.finished) return;
    state.finished = true;
    stopTimer();

    var record = ET.Stats.buildRecord({
      practiceMode: state.practiceMode,
      errorMode: state.errorMode,
      sourceLabel: state.meta.label,
      itemsDone: state.itemsDone,
      itemsTotal: state.items.length,
      typedChars: state.typedChars,
      correctChars: state.correctChars,
      errors: state.errors,
      seconds: state.seconds,
      maxCombo: state.maxCombo
    });
    record.skipped = state.skipped;
    emit('roundEnd', record);
  }

  /** 中断当前一轮（切换到别的模式/内容时调用），不产出记录 */
  function abort() {
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    stopTimer();
    state.finished = true;
  }

  /* ---------------- 渲染模型 ---------------- */

  /**
   * 生成给 UI 渲染用的数据。
   * UI 只需要照着 chars 里的 class 去改颜色就行，不需要懂引擎逻辑。
   * @returns {Object}
   */
  function model() {
    var tgt = target();
    var typed = state.typed;
    var it = currentItem();
    // 掩码规则：
    //   听音模式 —— 永远遮盖英文，逼你靠听力拼写；
    //   看中文打英文 —— 有中文释义时才遮盖（没释义的条目就直接显示英文，
    //                  否则用户既看不到中文也看不到英文，完全没法做）。
    var masked = (state.practiceMode === 'listen') ||
                 (state.practiceMode === 'zh2en' && !!(it && it.zh));
    var chars = [];
    var maskChar = ET.CONST.MASK_CHAR || '•';

    for (var i = 0; i < tgt.length; i++) {
      var want = tgt.charAt(i);
      var cls = 'pending';
      var display = want;

      if (i < typed.length) {
        var got = typed.charAt(i);
        cls = got === want ? 'ok' : 'bad';
        // 掩码模式下，已经打出来的字符显示「你打的」，
        // 这样你能看到自己写了什么，但看不到正确答案。
        display = masked ? got : want;
        if (want === ' ') display = ' ';
      } else if (masked) {
        display = want === ' ' ? ' ' : maskChar;
      }

      chars.push({ ch: display, raw: want, cls: cls });
    }

    // 超长输入（理论上不会出现，兜底处理）
    var extra = typed.length > tgt.length ? typed.slice(tgt.length) : '';

    return {
      chars: chars,
      caret: Math.min(typed.length, tgt.length),
      masked: masked,
      typedLen: typed.length,
      targetLen: tgt.length,
      extra: extra,
      index: state.index,
      total: state.items.length,
      finished: state.finished
    };
  }

  /* ---------------- 对外接口 ---------------- */

  var Engine = {

    /** 订阅事件：state / tick / item / itemDone / char / reject / sentenceScored / roundEnd / started / resetInput */
    on: on,

    /** 当前状态（只读快照，调试用） */
    getState: function () {
      return {
        index: state.index, total: state.items.length,
        seconds: state.seconds, typedChars: state.typedChars,
        correctChars: state.correctChars, errors: state.errors,
        combo: state.combo, maxCombo: state.maxCombo,
        itemsDone: state.itemsDone, score: state.score,
        finished: state.finished, started: state.started,
        locked: state.locked
      };
    },

    /** 当前题目 / 中文 / 模式 */
    currentItem: currentItem,
    currentTarget: target,
    currentZh: targetZh,
    typed: function () { return state.typed; },
    isFinished: function () { return state.finished; },
    isLocked: function () { return state.locked; },
    practiceMode: function () { return state.practiceMode; },
    errorMode: function () { return state.errorMode; },
    meta: function () { return state.meta; },

    /**
     * 装载题目队列并开始一轮。
     * @param {Array<{en:string,zh:string}>} items
     * @param {Object} meta {label, unit, sourceId, textId}
     */
    load: function (items, meta) {
      Engine.abort();
      clearInput();
      state.items = items || [];
      state.index = 0;
      state.meta = meta || { label: '', unit: 'word', sourceId: '', textId: '' };
      state.typed = '';
      state.locked = false;
      state.scored = false;
      state.started = false;
      state.startAt = 0;
      state.seconds = 0;
      state.typedChars = 0;
      state.correctChars = 0;
      state.errors = 0;
      state.skipped = 0;
      state.combo = 0;
      state.maxCombo = 0;
      state.itemsDone = 0;
      state.score = 0;
      state.finished = false;
      state.roundStartAt = Date.now();

      if (!state.items.length) {
        emit('empty');
        return;
      }
      emit('item', currentItem());
      emit('state', model());
    },

    /** 重新开始当前这一轮（同样的题目顺序） */
    restart: function () {
      var items = state.items.slice();
      var meta = state.meta;
      Engine.load(items, meta);
    },

    /** 修改模式（练习模式 / 打错处理），会立即重绘 */
    configure: function (opts) {
      if (opts.practiceMode) state.practiceMode = opts.practiceMode;
      if (opts.errorMode) state.errorMode = opts.errorMode;
      state.scored = false;
      emit('state', model());
    },

    handleInput: handleInput,
    next: next,
    skip: skip,
    finishRound: finishRound,
    abort: abort,
    model: model,

    /**
     * 整句模式下按 Enter 的统一处理。
     * 第一次 Enter 判卷，第二次 Enter 进入下一题。
     * @returns {boolean} 是否消费了这个按键
     */
    enter: function () {
      if (state.errorMode !== 'sentence') {
        // 非整句模式：Enter 就当作「下一题」（如果当前已完成）
        if (state.locked) { next(); return true; }
        return false;
      }
      var tgt = target();
      if (!state.scored) {
        if (state.typed.length === 0) return false;
        startTimer();
        scoreSentence();
      } else {
        next();
      }
      return true;
    },

    /** 得分（供底部统计栏读取） */
    score: function () { return state.score; },
    seconds: function () { return state.seconds; },
    combo: function () { return state.combo; },
    stats: function () {
      return {
        typedChars: state.typedChars,
        correctChars: state.correctChars,
        errors: state.errors,
        maxCombo: state.maxCombo,
        skipped: state.skipped,
        itemsDone: state.itemsDone,
        itemsTotal: state.items.length,
        seconds: state.seconds
      };
    }
  };

  ET.Engine = Engine;

})(window.ET);
