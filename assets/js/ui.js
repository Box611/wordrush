/* =====================================================================
   ui.js —— 界面渲染与交互
   ---------------------------------------------------------------------
   这个文件负责「把数据画到页面上」和「把用户的点击接到引擎上」。
   它不含任何练习逻辑，逻辑都在 engine.js 里。

   阅读顺序建议：
     1. applyI18n()      —— 双语切换怎么实现的
     2. paintTarget()    —— 打字区那些红红绿绿的字符是怎么画出来的
     3. renderSettings() —— 设置面板是怎么「配」出来的
     4. bindEvents()     —— 所有按钮的点击都在这里
   ===================================================================== */

(function (ET) {
  'use strict';

  /* ---------------- DOM 引用缓存 ----------------
     一次性查好，避免每次打字都去 document 里找元素（性能考量）。 */
  var DOM = {};
  var T = null;                     // 当前 DOM 表

  /* 打字区渲染缓存 */
  var spans = [];                   // 每个字符对应的 <span>
  var lastLen = 0;                  // 上一次渲染时的已输入长度
  var lastMasked = null;            // 上一次渲染时的遮盖状态
  var needFullRepaint = true;       // 是否需要整块重绘（换题时用）

  /* 当前选中的内容源 */
  var currentSourceId = 'cet4';
  var currentTextId = '';

  /* 弹窗管理 */
  var modalStack = [];

  /* 自定义文本草稿 */
  var customDraft = { items: [], total: 0, unit: 'sentence', label: 'Custom' };

  /* 已经过校验、等待用户确认的备份数据（确认后才真正写入） */
  var pendingImport = null;

  function $(sel) { return document.querySelector(sel); }
  function el(id) { return document.getElementById(id); }

  /* =====================================================================
     一、多语言
     ===================================================================== */

  /**
   * 把页面上所有标了 data-i18n 的地方换成当前语言的文案。
   * 支持三种标记：
   *   data-i18n             → 文本内容
   *   data-i18n-title       → title 提示
   *   data-i18n-placeholder → placeholder 占位符
   */
  function applyI18n() {
    var lang = ET.currentLang();
    document.documentElement.lang = (lang === 'en') ? 'en' : 'zh-CN';
    document.title = ET.t('app.docTitle');

    document.querySelectorAll('[data-i18n]').forEach(function (node) {
      node.textContent = ET.t(node.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (node) {
      node.title = ET.t(node.getAttribute('data-i18n-title'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (node) {
      node.placeholder = ET.t(node.getAttribute('data-i18n-placeholder'));
    });
    if (DOM.btnLang) DOM.btnLang.textContent = (lang === 'en') ? '中' : 'EN';
  }

  /* =====================================================================
     二、轻提示 Toast
     ===================================================================== */

  /**
   * @param {string} msg
   * @param {'good'|'bad'|''} [type]
   */
  function toast(msg, type) {
    if (!DOM.toastWrap) return;
    var node = document.createElement('div');
    node.className = 'toast' + (type ? ' ' + type : '');
    node.textContent = msg;
    DOM.toastWrap.appendChild(node);
    setTimeout(function () {
      node.style.transition = 'opacity .3s, transform .3s';
      node.style.opacity = '0';
      node.style.transform = 'translateY(6px)';
      setTimeout(function () { node.remove(); }, 320);
    }, 2100);
  }

  /* =====================================================================
     三、弹窗
     ===================================================================== */

  function openModal(id) {
    var m = el(id);
    if (!m) return;
    m.hidden = false;
    if (modalStack.indexOf(id) < 0) modalStack.push(id);
  }

  function closeModal(id) {
    var m = el(id);
    if (!m || !m) return;
    m.hidden = true;
    modalStack = modalStack.filter(function (x) { return x !== id; });
  }

  function closeTopModal() {
    var id = modalStack[modalStack.length - 1];
    if (id) closeModal(id);
  }

  function isModalOpen() { return modalStack.length > 0; }

  /* =====================================================================
     四、打字区渲染（本文件最核心的部分）
     ===================================================================== */

  var ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
  function escChar(c) { return ESC_MAP[c] || c; }

  /**
   * 生成整块打字区的 HTML。
   * @param {Object} model 引擎给的渲染模型
   * @returns {string}
   */
  function targetHTML(model) {
    var out = [];
    for (var i = 0; i < model.chars.length; i++) {
      var d = model.chars[i];
      var cls = 'ch ' + d.cls + (i === model.caret ? ' cur' : '');
      out.push('<span class="' + cls + '">' + escChar(d.ch) + '</span>');
    }
    return out.join('');
  }

  /**
   * 把渲染模型画到页面上。
   *
   * 性能优化说明：一整段文章可能有 600 多个字符，
   * 如果每次按键都把 600 个 span 重建一遍，输入会有明显的卡顿。
   * 所以这里采用「差量更新」：
   *   · 换题时 → 整块重建（needFullRepaint）
   *   · 打字时 → 只更新「已输入长度」附近那几个字符的样式
   * @param {Object} model
   */
  function paintTarget(model) {
    if (!DOM.targetText) return;

    var itemKey = ET.Engine.getState().index + '|' + model.targetLen + '|' +
                  (ET.Engine.currentTarget() || '').slice(0, 30);

    // 四种情况必须「整块重绘」：
    //   1. 换题了（needFullRepaint）
    //   2. 题目文字变了（itemKey 变化）
    //   3. span 数量对不上（长度变了）
    //   4. 遮盖模式开关了（听音/看中文模式切换会让每个字符的显示都变）
    if (needFullRepaint || itemKey !== paintTarget.lastKey ||
        spans.length !== model.chars.length || lastMasked !== model.masked) {
      DOM.targetText.innerHTML = targetHTML(model);
      spans = Array.prototype.slice.call(DOM.targetText.children);
      paintTarget.lastKey = itemKey;
      lastLen = model.typedLen;
      lastMasked = model.masked;
      needFullRepaint = false;
      return;
    }

    // 差量更新：只需处理「旧光标」到「新光标」之间的一小段
    var from = Math.max(0, Math.min(lastLen, model.typedLen) - 1);
    var to = Math.max(lastLen, model.typedLen) + 1;
    for (var i = from; i < spans.length && i <= to; i++) {
      var d = model.chars[i];
      if (!d) break;
      var cls = 'ch ' + d.cls + (i === model.caret ? ' cur' : '');
      if (spans[i].className !== cls) spans[i].className = cls;
      if (spans[i].textContent !== d.ch) spans[i].textContent = d.ch;
    }
    lastLen = model.typedLen;
  }
  paintTarget.lastKey = '';

  /**
   * 渲染题目上方的提示区。
   * 三种模式显示的东西完全不同：
   *   看英文打英文 → 显示中文释义（辅助记忆）
   *   看中文打英文 → 只显示中文
   *   听音打英文   → 显示播放提示
   */
  function renderPrompt() {
    if (!DOM.promptArea) return;
    var mode = ET.Engine.practiceMode();
    var item = ET.Engine.currentItem();
    if (!item) { DOM.promptArea.innerHTML = ''; return; }

    var zh = item.zh || '';
    var html = '';

    if (mode === 'zh2en') {
      html = '<span class="prompt-tag">' + ET.esc(ET.t('prompt.zh')) + '</span>' +
             (zh ? '<span class="prompt-zh">' + ET.esc(zh) + '</span>'
                 : '<span class="prompt-zh" style="color:var(--muted)">' +
                   ET.esc(ET.t('note.noZhShort')) + '</span>');
    } else if (mode === 'listen') {
      html = '<span class="prompt-tag">' + ET.esc(ET.t('prompt.listen')) + '</span>' +
             '<span>' + ET.esc(ET.t('prompt.listenTip')) + '</span>';
    } else {
      // ── 看英文打英文：原文本来就摆在眼前，所以附带显示音标和中文释义，
      //    纯属辅助记忆，不会构成「泄题」。
      //    ⚠️ 反过来，「看中文打英文」和「听音打英文」绝对不能显示音标 ——
      //       音标基本等于把拼写念出来了，练习就没意义了。
      var bits = '';
      if (ET.Store.get('showPhonetic') && item.ipa) {
        bits += '<span class="prompt-ipa">/' + ET.esc(item.ipa) + '/</span>';
      }
      if (zh) {
        bits += '<span class="prompt-tag">' + ET.esc(ET.t('prompt.zh')) + '</span>' +
                '<span class="prompt-zh">' + ET.esc(zh) + '</span>';
      }
      html = bits;
    }
    DOM.promptArea.innerHTML = html;
  }

  /** 舞台下方的说明条 */
  function showStageNote(text) {
    if (!DOM.stageNote) return;
    DOM.stageNote.textContent = text;
    DOM.stageNote.hidden = false;
  }
  function hideStageNote() {
    if (DOM.stageNote) DOM.stageNote.hidden = true;
  }

  /**
   * 显示当前两种模式的说明文字。
   * 模式有 3 × 3 共九种组合，光看按钮名字新手很难判断该选哪个，
   * 所以这里直接用一句话把当前组合讲清楚。
   */
  function renderModeHint() {
    if (!DOM.modeHint) return;
    var pm = ET.Store.get('practiceMode');
    var em = ET.Store.get('errorMode');
    DOM.modeHint.textContent = ET.t('mode.' + pm + '.desc') + ' ' + ET.t('mode.' + em + '.desc');
  }

  /* =====================================================================
     五、底部统计与每日目标
     ===================================================================== */

  function fmtAcc(v) {
    var s = (Math.round(v * 10) / 10);
    return (s % 1 === 0 ? s.toFixed(0) : s.toFixed(1)) + '<em>%</em>';
  }

  function renderStats() {
    var st = ET.Engine.getState();
    var wpm = ET.Stats.wpm(st.correctChars, st.seconds);
    var acc = ET.Stats.accuracy(st.correctChars, st.typedChars);

    if (DOM.statWpm) DOM.statWpm.textContent = wpm;
    if (DOM.statAcc) DOM.statAcc.innerHTML = fmtAcc(acc);
    if (DOM.statCombo) DOM.statCombo.textContent = st.combo;
    if (DOM.statScore) DOM.statScore.textContent = st.score;
    if (DOM.statTime) DOM.statTime.textContent = ET.fmtTime(st.seconds);

    var pct = st.total ? Math.round((st.itemsDone / st.total) * 100) : 0;
    if (DOM.statProgressText) DOM.statProgressText.textContent = pct + '%';
    if (DOM.progressFill) DOM.progressFill.style.width = pct + '%';

    // 连击的视觉反馈
    var comboStat = document.querySelector('.stat[data-k="combo"]');
    if (comboStat) {
      comboStat.classList.toggle('is-hot', st.combo >= 20 && st.combo < 50);
      comboStat.classList.toggle('is-fire', st.combo >= 50);
    }

    // 题目计数
    if (DOM.itemCounter) {
      var cur = Math.min(st.index + 1, st.total);
      DOM.itemCounter.textContent = cur + ' / ' + st.total;
    }
  }

  function renderDaily() {
    if (!DOM.dailyBar) return;
    var show = !!ET.Store.get('dailyGoal');
    DOM.dailyBar.hidden = !show;
    if (!show) return;

    var dp = ET.Achievements.dailyProgress();
    var text = dp.done
      ? ET.t('daily.done')
      : ET.t('daily.text', { min: dp.minutes, goal: dp.goal, pct: dp.pct });

    var streak = ET.Store.get('streak') ? ET.Store.streak() : 0;
    if (streak > 0) text += ' · ' + ET.t('daily.streak', { n: streak });

    DOM.dailyText.textContent = text;
    DOM.dailyFill.style.width = dp.pct + '%';
  }

  /**
   * 根据设置，显示或隐藏底部的各项统计。
   * 「所有功能都要有开关」这条要求就靠这个函数实现。
   */
  function applyStatVisibility() {
    var map = {
      wpm: 'showWpm', acc: 'showAcc', combo: 'showCombo',
      score: 'showScore', time: 'showTime', progress: 'showProgress'
    };
    Object.keys(map).forEach(function (k) {
      var node = document.querySelector('.stat[data-k="' + k + '"]');
      if (node) node.classList.toggle('is-hidden', !ET.Store.get(map[k]));
    });
    if (DOM.btnSpeak) DOM.btnSpeak.style.visibility = ET.Store.get('showPronounceButton') ? '' : 'hidden';
    if (DOM.dailyBar) DOM.dailyBar.classList.toggle('is-hidden', !ET.Store.get('dailyGoal'));
    renderDaily();
  }

  /* =====================================================================
     六、内容源选择
     ===================================================================== */

  /** 内容源的一句话说明 + 实时条目数（鼠标悬停时显示） */
  function sourceTitle(src) {
    var lang = ET.currentLang();
    var desc = (src.desc && (src.desc[lang] || src.desc.zh)) || '';
    var n = '';
    if (src.texts) n = src.texts.length + (lang === 'en' ? ' articles' : ' 篇');
    else if (src.items) n = src.items.length + (lang === 'en' ? ' entries' : ' 条');
    var bits = [];
    if (desc) bits.push(desc + ' · ' + n);
    else if (n) bits.push(n);
    // 全量词库是外部数据，把出处一并写在提示里，方便核对来源
    if (src.source && src.source.repo) {
      bits.push((lang === 'en' ? 'Source: ' : '数据来源：') + src.source.repo + ' / ' + src.source.file);
    }
    return bits.join('\n');
  }

  function chipHTML(id, label, pressed, title) {
    return '<button type="button" class="chip" data-source="' + ET.esc(id) + '"' +
           (title ? ' title="' + ET.esc(title) + '"' : '') +
           (pressed ? ' aria-pressed="true"' : '') + '>' + ET.esc(label) + '</button>';
  }

  function renderSourceChips() {
    if (!DOM.sourceChips) return;
    var html = '';
    // 直接按 Content.allSources() 的顺序渲染 —— 单一数据来源，
    // 以后加词库只要在 content.js 里注册，界面会自动出现按钮。
    ET.Content.allSources().forEach(function (s) {
      html += chipHTML(s.id, ET.Content.sourceName(s), s.id === currentSourceId, sourceTitle(s));
    });
    if (ET.Store.customTexts().length) {
      html += chipHTML('__mine__', ET.t('source.mine'), currentSourceId === 'custom',
        ET.t('source.mine') + ' · ' + ET.Store.customTexts().length +
        (ET.currentLang() === 'en' ? ' saved' : ' 份已保存'));
    }
    DOM.sourceChips.innerHTML = html;
    renderTextPicker();
  }

  /**
   * 网络内容源有多篇文本，这里生成一个下拉让用户挑（默认随机）。
   */
  function renderTextPicker() {
    if (!DOM.textPickerWrap) return;
    if (!ET.Content.isWebSource(currentSourceId)) {
      DOM.textPickerWrap.hidden = true;
      return;
    }
    var lang = ET.currentLang();
    var texts = ET.Content.webTexts(currentSourceId);
    var html = '<option value="">' + ET.esc(ET.t('source.random')) + '</option>';
    texts.forEach(function (tx, i) {
      html += '<option value="' + ET.esc(tx.id || String(i)) + '">' +
              ET.esc((tx.title && (tx.title[lang] || tx.title.zh)) || ('#' + (i + 1))) +
              '</option>';
    });
    DOM.selText.innerHTML = html;
    DOM.selText.value = currentTextId;
    DOM.textPickerWrap.hidden = false;
  }

  /* =====================================================================
     七、开始一轮练习
     ===================================================================== */

  /**
   * 按当前设置生成题目并启动。
   */
  function startRound() {
    var count = parseInt(DOM.selCount ? DOM.selCount.value : '20', 10) || 20;
    var sequential = ET.Store.get('shuffle') === false;
    var opts = {
      count: count,
      shuffle: !sequential,
      textId: currentTextId,
      unit: null,
      // 顺序模式（关掉「打乱顺序」）时接着上次练，全量词库才不会永远只练前几条
      from: sequential ? ET.Store.getProgress(currentSourceId) : 0
    };

    if (currentSourceId === 'custom') {
      var c = ET.Content.getCustom();
      if (!c || !c.items.length) {
        toast(ET.t('toast.customEmpty'), 'bad');
        openCustomModal();
        return;
      }
      opts.unit = c.unit;
    }

    var q = ET.Content.buildQueue(currentSourceId, opts);
    if (!q.items.length) {
      toast(ET.t('toast.customEmpty'), 'bad');
      return;
    }
    applyQueue(q);
  }

  /**
   * 把题目队列交给引擎，并处理模式的可行性。
   * 例如：内容没有中文释义时，「看中文打英文」是没法做的，
   *       这里会自动降级到「看英文打英文」并给出说明。
   */
  function applyQueue(q) {
    var zhCount = ET.Content.countWithZh(q.items);
    var wantMode = ET.Store.get('practiceMode');
    var mode = wantMode;

    if (wantMode === 'zh2en' && zhCount === 0) {
      mode = 'en2en';
      ET.Store.update({ practiceMode: 'en2en' });
      showStageNote(ET.t('note.noZhMode'));
    } else {
      hideStageNote();
    }

    if (DOM.sourceLabel) DOM.sourceLabel.textContent = q.label;
    if (DOM.roundCounter) {
      DOM.roundCounter.hidden = false;
      DOM.roundCounter.textContent = q.items.length + ' × ' + overallUnitLabel(q.unit);
      // 顺序模式下额外显示「练到第几条 / 总共几条」，让长词库的进度看得见
      if (q.sequential && q.total > q.items.length) {
        var endIdx = Math.min(q.total, q.from + q.items.length);
        DOM.roundCounter.textContent += ' · ' + ET.t('progress.range', {
          a: q.from + 1, b: endIdx, n: q.total
        });
        // 记下一条的位置，下一轮从这里接着练
        ET.Store.setProgress(currentSourceId, endIdx % q.total);
      }
    }

    ET.Engine.configure({ practiceMode: mode, errorMode: ET.Store.get('errorMode') });
    ET.Engine.load(q.items, {
      label: q.label,
      unit: q.unit,
      sourceId: currentSourceId,
      textId: q.textId
    });

    syncSegment('segPracticeMode', mode);
    syncSegment('segErrorMode', ET.Store.get('errorMode'));

    renderPrompt();
    renderStats();
  }

  function overallUnitLabel(unit) {
    var key = ET.Content.UNIT_LABEL[unit] || 'prompt.sentence';
    return ET.t(key);
  }

  /**
   * 对当前题目播放发音。
   * @param {boolean} [silentWhenFail] 失败时是否静默提示
   *        （自动发音传 true，手动点播放按钮传 false）
   * @returns {Promise<boolean>} 是否成功发出声音
   */
  function speakCurrent(silentWhenFail) {
    var text = ET.Engine.currentTarget();
    if (!text) return Promise.resolve(false);
    return ET.Speech.speak(text).then(function (provider) {
      if (provider === 'browser' && !silentWhenFail && ET.Store.get('voiceProvider') !== 'browser') {
        toast(ET.t('toast.voiceFallback'), 'bad');
      }
      return true;
    }).catch(function () {
      if (!silentWhenFail) toast(ET.t('toast.noSpeech'), 'bad');
      return false;
    });
  }

  /* ------------------------------------------------------------------
     自动发音
     ------------------------------------------------------------------
     规则按模式区分，这一点很关键：

       · 听音打英文   —— 不自动读就完全没法做题，默认开启
       · 看英文打英文 —— 进入题目时先读一遍再开始打字，边打边记发音
                        （就是本次新增的「自发音」）
       · 看中文打英文 —— 绝对不读。这个模式的英文就是答案，
                        提前读出来等于把答案念给用户听，练习就白做了
     ------------------------------------------------------------------ */

  var pendingAutoSpeak = false;   // 自动发音被浏览器拦下时留下的「待补播」标记

  /** 按当前练习模式和设置，决定要不要自动发音 */
  function maybeAutoSpeak() {
    var mode = ET.Engine.practiceMode();
    var on = (mode === 'listen' && ET.Store.get('autoSpeak')) ||
             (mode === 'en2en' && ET.Store.get('autoSpeakEn2en'));
    if (!on) { pendingAutoSpeak = false; return; }

    speakCurrent(true).then(function (ok) {
      // 浏览器有「自动播放策略」：页面刚加载、用户还没点过任何东西时，
      // 音频会被拒绝。这里记下标记，等用户第一次点击页面时补播一次，
      // 否则第一题会莫名其妙没有声音。
      pendingAutoSpeak = !ok;
    });
  }

  /** 用户与页面产生交互后，补播上次被拦下的自动发音 */
  function retryPendingSpeak() {
    if (!pendingAutoSpeak) return;
    pendingAutoSpeak = false;
    speakCurrent(true);
  }

  /* =====================================================================
     八、分段控件（模式切换）
     ===================================================================== */

  function syncSegment(id, value) {
    var box = el(id);
    if (!box) return;
    box.querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-value') === value ? 'true' : 'false');
    });
  }

  function bindSegment(id, onPick) {
    var box = el(id);
    if (!box) return;
    box.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-value]');
      if (!btn) return;
      var value = btn.getAttribute('data-value');
      // 已经选中了就不用重复处理（否则每次点击都会重置当前进度）
      if (btn.getAttribute('aria-pressed') === 'true') return;
      // ⚠️ 必须先同步按钮的选中态，否则界面看不出模式已经切换了
      syncSegment(id, value);
      onPick(value);
    });
  }

  /* =====================================================================
     九、设置面板
     ===================================================================== */

  /**
   * 设置面板的「配置表」。
   * 加一项设置项只需要在这里加一行，界面会自动生成 —— 不用手写 HTML。
   * type: 'select' 下拉 | 'toggle' 开关 | 'range' 滑块
   */
  function settingsSchema() {
    return [
      {
        section: 'settings.sec.appearance',
        rows: [
          { type: 'select', key: 'theme', name: 'settings.theme', desc: 'settings.theme.desc',
            options: [['light', 'theme.light'], ['dark', 'theme.dark'], ['study', 'theme.study']] },
          { type: 'select', key: 'lang', name: 'settings.lang', desc: 'settings.lang.desc',
            options: [['zh', '中文'], ['en', 'English']] },
          { type: 'select', key: 'fontSize', name: 'settings.fontSize', desc: 'settings.fontSize.desc',
            options: [['sm', 'font.sm'], ['md', 'font.md'], ['lg', 'font.lg'], ['xl', 'font.xl']] }
        ]
      },
      {
        section: 'settings.sec.practice',
        rows: [
          { type: 'select', key: 'practiceMode', name: 'label.practiceMode', desc: null,
            options: [['en2en', 'mode.en2en'], ['zh2en', 'mode.zh2en'], ['listen', 'mode.listen']] },
          { type: 'select', key: 'errorMode', name: 'label.errorMode', desc: null,
            options: [['strict', 'mode.strict'], ['loose', 'mode.loose'], ['sentence', 'mode.sentence']] },
          { type: 'toggle', key: 'autoNext', name: 'settings.autoNext', desc: 'settings.autoNext.desc' },
          { type: 'toggle', key: 'shuffle', name: 'settings.shuffle', desc: 'settings.shuffle.desc' },
          { type: 'toggle', key: 'showPhonetic', name: 'settings.showPhonetic', desc: 'settings.showPhonetic.desc' }
        ]
      },
      {
        section: 'settings.sec.voice',
        rows: [
          { type: 'select', key: 'voiceProvider', name: 'settings.voiceProvider', desc: 'settings.voiceProvider.desc',
            options: [['auto', 'voice.auto'], ['youdao', 'voice.youdao'], ['baidu', 'voice.baidu'],
                      ['dictionaryapi', 'voice.dictionaryapi'], ['browser', 'voice.browser']] },
          { type: 'select', key: 'accent', name: 'settings.accent', desc: 'settings.accent.desc',
            options: [['us', 'accent.us'], ['uk', 'accent.uk']] },
          { type: 'toggle', key: 'autoSpeak', name: 'settings.autoSpeak', desc: 'settings.autoSpeak.desc' },
          { type: 'toggle', key: 'autoSpeakEn2en', name: 'settings.autoSpeakEn2en', desc: 'settings.autoSpeakEn2en.desc' },
          { type: 'toggle', key: 'speakOnFinish', name: 'settings.speakOnFinish', desc: 'settings.speakOnFinish.desc' },
          { type: 'toggle', key: 'showPronounceButton', name: 'settings.pronounceBtn', desc: 'settings.pronounceBtn.desc' },
          { type: 'range', key: 'speechRate', name: 'settings.speechRate', desc: 'settings.speechRate.desc',
            min: 0.5, max: 1.5, step: 0.1 }
        ]
      },
      {
        section: 'settings.sec.gamify',
        rows: [
          { type: 'toggle', key: 'showWpm', name: 'settings.g.wpm', desc: null },
          { type: 'toggle', key: 'showAcc', name: 'settings.g.acc', desc: null },
          { type: 'toggle', key: 'showCombo', name: 'settings.g.combo', desc: null },
          { type: 'toggle', key: 'showScore', name: 'settings.g.score', desc: null },
          { type: 'toggle', key: 'showTime', name: 'settings.g.time', desc: null },
          { type: 'toggle', key: 'showProgress', name: 'settings.g.progress', desc: null },
          { type: 'toggle', key: 'sound', name: 'settings.g.sound', desc: null },
          { type: 'range', key: 'soundVolume', name: 'settings.g.soundVolume', desc: null,
            min: 0, max: 1, step: 0.05 },
          { type: 'toggle', key: 'dailyGoal', name: 'settings.g.dailyGoal', desc: null },
          { type: 'range', key: 'dailyGoalMinutes', name: 'settings.g.dailyGoalMinutes', desc: null,
            min: 5, max: 60, step: 5, unit: 'min.suffix' },
          { type: 'toggle', key: 'badges', name: 'settings.g.badges', desc: 'settings.g.badges.desc' },
          { type: 'toggle', key: 'streak', name: 'settings.g.streak', desc: 'settings.g.streak.desc' }
        ]
      }
    ];
  }

  function renderSettings() {
    if (!DOM.settingsBody) return;
    var html = '';

    settingsSchema().forEach(function (grp) {
      html += '<div class="setting-section"><h3 data-i18n="' + grp.section + '"></h3>';
      grp.rows.forEach(function (row) {
        var val = ET.Store.get(row.key);
        html += '<div class="setting-row">' +
                  '<div class="setting-info">' +
                    '<span class="setting-name" data-i18n="' + row.name + '"></span>' +
                    (row.desc ? '<span class="setting-desc" data-i18n="' + row.desc + '"></span>' : '') +
                  '</div>';
        if (row.type === 'select') {
          html += '<select data-setting="' + row.key + '">';
          row.options.forEach(function (o) {
            html += '<option value="' + ET.esc(o[0]) + '"' + (String(val) === o[0] ? ' selected' : '') +
                    (o[1].indexOf('.') > -1 ? ' data-i18n="' + o[1] + '"' : '') + '>' +
                    (o[1].indexOf('.') > -1 ? '' : ET.esc(o[1])) + '</option>';
          });
          html += '</select>';
        } else if (row.type === 'toggle') {
          html += '<button type="button" class="switch" role="switch" aria-checked="' +
                  (val ? 'true' : 'false') + '" data-toggle="' + row.key + '"></button>';
        } else if (row.type === 'range') {
          html += '<span class="setting-range-wrap">' +
                    '<input type="range" data-range="' + row.key + '" min="' + row.min + '" max="' + row.max +
                    '" step="' + row.step + '" value="' + val + '">' +
                    '<span class="setting-desc" data-range-out="' + row.key + '">' +
                    ET.esc(val + (row.unit ? ' ' + ET.t(row.unit) : '')) + '</span>' +
                  '</span>';
        }
        html += '</div>';
      });
      html += '</div>';
    });

    // 数据区
    html += '<div class="setting-section"><h3 data-i18n="settings.sec.data"></h3>' +
            '<p class="modal-tip" data-i18n="data.tip"></p>' +
            '<div class="row">' +
              '<button class="btn" type="button" id="btnExport2"><svg class="ic"><use href="#icon-download"/></svg>' +
                '<span data-i18n="data.export"></span></button>' +
              '<button class="btn" type="button" id="btnImport2"><svg class="ic"><use href="#icon-upload"/></svg>' +
                '<span data-i18n="data.import"></span></button>' +
              '<button class="btn" type="button" id="btnResetSettings"><span data-i18n="btn.reset"></span></button>' +
              '<button class="btn" type="button" id="btnResetProgress"><span data-i18n="settings.resetProgress"></span></button>' +
              '<button class="btn danger" type="button" id="btnClearData2"><span data-i18n="data.clear"></span></button>' +
            '</div></div>';

    DOM.settingsBody.innerHTML = html;
    applyI18n();
  }

  /* =====================================================================
     十、自定义文本弹窗
     ===================================================================== */

  function openCustomModal() {
    openModal('customModal');
    renderCustomPreview();
  }

  /** 解析当前输入的文本，更新预览 */
  function renderCustomPreview() {
    if (!DOM.customText) return;
    var text = DOM.customText.value;
    var unit = DOM.customUnit.value;
    if (!text.trim()) {
      customDraft = { items: [], total: 0, unit: unit, label: 'Custom' };
      if (DOM.customPreview) DOM.customPreview.textContent = ET.t('custom.previewEmpty');
      return;
    }
    var parsed = ET.Content.parseCustom(text, unit, DOM.customZh ? DOM.customZh.value : '');
    var zhCount = ET.Content.countWithZh(parsed.items);
    customDraft = {
      items: parsed.items,
      total: parsed.total,
      unit: unit,
      label: ET.t('source.mine')
    };
    if (DOM.customPreview) {
      var head = ET.t('custom.preview', { n: parsed.total, m: zhCount });
      var sample = parsed.items.slice(0, 3).map(function (it, i) {
        return (i + 1) + '. ' + it.en.slice(0, 90) + (it.en.length > 90 ? '…' : '');
      });
      DOM.customPreview.textContent = head + '\n' + ET.t('custom.previewFirst') + '\n' + sample.join('\n');
    }
  }

  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var args = arguments, self = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(self, args); }, wait);
    };
  }

  /* =====================================================================
     十一、成绩记录弹窗
     ===================================================================== */

  function renderHistory() {
    var sum = ET.Store.summary();
    var records = ET.Store.records();

    if (DOM.historySummary) {
      var cells = [
        ['history.bestWpm', sum.bestWpm],
        ['history.avgWpm', sum.avgWpm],
        ['history.totalSessions', sum.sessions],
        ['history.totalChars', sum.totalChars],
        ['history.totalTime', ET.fmtTime(sum.totalSeconds)],
        ['history.streakDays', sum.streak]
      ];
      DOM.historySummary.innerHTML = cells.map(function (c) {
        return '<div class="result-cell"><div class="rc-value">' + ET.esc(String(c[1])) +
               '</div><div class="rc-label">' + ET.esc(ET.t(c[0])) + '</div></div>';
      }).join('');
    }

    var lang = ET.currentLang();
    if (DOM.historyTable) {
      var head = '<thead><tr>' +
        ['history.th.date', 'history.th.mode', 'history.th.errorMode', 'history.th.source',
         'history.th.wpm', 'history.th.acc', 'history.th.chars', 'history.th.duration', 'history.th.score']
        .map(function (k) { return '<th>' + ET.esc(ET.t(k)) + '</th>'; }).join('') +
        '</tr></thead>';
      var body = '';
      if (!records.length) {
        body = '<tbody><tr><td class="empty" colspan="9">' + ET.esc(ET.t('history.empty')) + '</td></tr></tbody>';
      } else {
        body = '<tbody>' + records.slice(0, 200).map(function (r) {
          var d = new Date(r.ts);
          var when = (d.getMonth() + 1) + '/' + d.getDate() + ' ' +
                     String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
          var modeLabel = { en2en: ET.t('mode.en2en.short'), zh2en: ET.t('mode.zh2en.short'), listen: ET.t('mode.listen.short') }[r.mode] || r.mode;
          var emLabel = { strict: ET.t('mode.strict'), loose: ET.t('mode.loose'), sentence: ET.t('mode.sentence') }[r.errorMode] || r.errorMode;
          return '<tr>' +
            '<td>' + when + '</td>' +
            '<td>' + ET.esc(modeLabel) + '</td>' +
            '<td>' + ET.esc(emLabel) + '</td>' +
            '<td>' + ET.esc((r.source || '').slice(0, 18)) + '</td>' +
            '<td>' + (r.wpm || 0) + '</td>' +
            '<td>' + (r.acc || 0) + '%</td>' +
            '<td>' + (r.chars || 0) + '</td>' +
            '<td>' + ET.fmtTime(r.seconds || 0) + '</td>' +
            '<td>' + (r.score || 0) + '</td>' +
          '</tr>';
        }).join('') + '</tbody>';
      }
      DOM.historyTable.innerHTML = head + body;
    }

    // 图表：等弹窗真正显示出来后再画（隐藏状态下 canvas 宽度为 0）
    requestAnimationFrame(function () {
      ET.Stats.drawChart(DOM.historyChart, records);
    });
  }

  /* =====================================================================
     十二、成就徽章弹窗
     ===================================================================== */

  function renderBadges() {
    if (!DOM.badgeGrid) return;
    var unlocked = ET.Store.badges();
    var lang = ET.currentLang();
    DOM.badgeGrid.innerHTML = ET.Achievements.all().map(function (b) {
      var ts = unlocked[b.id];
      var dateStr = '';
      if (ts) {
        var d = new Date(ts);
        dateStr = ET.t('badges.unlockedAt', {
          d: d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate()
        });
      }
      return '<div class="badge-card' + (ts ? ' is-unlocked' : '') + '">' +
               '<div class="badge-icon">' + b.icon + '</div>' +
               '<div class="badge-info">' +
                 '<div class="badge-name">' + ET.esc(ET.t(b.name)) + '</div>' +
                 '<div class="badge-desc">' + ET.esc(ET.t(b.desc)) + '</div>' +
                 (dateStr ? '<div class="badge-date">' + ET.esc(dateStr) + '</div>' : '') +
               '</div>' +
             '</div>';
    }).join('');
  }

  /* =====================================================================
     十三、本轮成绩弹窗
     ===================================================================== */

  function renderResult(record, freshBadges) {
    if (!DOM.resultBody) return;
    var grade = ET.Stats.grade(record.wpm, record.acc);
    var gradeText = ET.t('result.' + grade);

    var cells = [
      ['result.wpm', record.wpm],
      ['result.acc', record.acc + '%'],
      ['result.time', ET.fmtTime(record.seconds)],
      ['result.chars', record.chars],
      ['result.combo', record.maxCombo],
      ['result.score', record.score],
      ['result.items', record.items + ' / ' + record.itemsTotal]
    ];

    var html = '<div class="result-grid">' + cells.map(function (c) {
      return '<div class="result-cell"><div class="rc-value">' + ET.esc(String(c[1])) +
             '</div><div class="rc-label">' + ET.esc(ET.t(c[0])) + '</div></div>';
    }).join('') + '</div>';

    html += '<p class="result-note">' + ET.esc(gradeText) + '</p>';

    if (freshBadges && freshBadges.length) {
      html += '<div><p class="result-note">' + ET.esc(ET.t('result.newBadge')) + '</p>' +
              '<div class="new-badges">' +
              freshBadges.map(function (b) {
                return '<span class="nb">' + b.icon + ' ' + ET.esc(ET.t(b.name)) + '</span>';
              }).join('') + '</div></div>';
    }

    DOM.resultBody.innerHTML = html;
  }

  /* =====================================================================
     十四、样式与主题应用
     ===================================================================== */

  var THEME_ICON = { light: 'icon-sun', dark: 'icon-moon', study: 'icon-book' };

  function applyTheme() {
    var theme = ET.Store.get('theme');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-font', ET.Store.get('fontSize'));
    if (DOM.themeIcon) {
      DOM.themeIcon.innerHTML = '<use href="#' + (THEME_ICON[theme] || 'icon-sun') + '"/>';
    }
    // 主题色同步给浏览器地址栏（手机端体验）
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      var bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
      if (bg) meta.setAttribute('content', bg);
    }
  }

  /**
   * 设置发生变化后的统一入口。
   * 注意：这里只做「必要的重绘」，不重建整个设置面板，
   *      否则用户点开关的时候焦点会丢。
   */
  function applySettings(changed) {
    applyTheme();
    applyStatVisibility();

    var keys = changed ? Object.keys(changed) : [];
    if (keys.indexOf('lang') >= 0 || !changed) {
      applyI18n();
      renderSourceChips();
      renderPrompt();
    }
    renderModeHint();
    // 同步设置面板里的控件值（比如用顶栏按钮换主题后，面板里的下拉也要跟着变）
    if (DOM.settingsBody) {
      DOM.settingsBody.querySelectorAll('[data-setting]').forEach(function (s) {
        s.value = ET.Store.get(s.getAttribute('data-setting'));
      });
      DOM.settingsBody.querySelectorAll('[data-toggle]').forEach(function (s) {
        var k = s.getAttribute('data-toggle');
        s.setAttribute('aria-checked', ET.Store.get(k) ? 'true' : 'false');
      });
      DOM.settingsBody.querySelectorAll('[data-range]').forEach(function (s) {
        s.value = ET.Store.get(s.getAttribute('data-range'));
      });
    }
  }

  /* =====================================================================
     十五、数据导入导出
     ===================================================================== */

  function doExport() {
    var data = ET.Store.exportAll();
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var d = new Date();
    var stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') +
                String(d.getDate()).padStart(2, '0') + '-' +
                String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0');
    a.href = url;
    a.download = 'wordrush-backup-' + stamp + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    toast(ET.t('data.exported'), 'good');
  }

  /* 注意：导入备份的完整流程（体检 → 确认 → 写入）在第「十五之二」节，
     因为导入会覆盖数据，必须经过用户确认，逻辑比单纯的导出复杂得多。 */

  function doClear() {
    if (!window.confirm(ET.t('data.confirmClear'))) return;
    ET.Store.clearAll();
    ET.Store.init();
    ET.Store.resetSettings();
    applySettings();
    renderSourceChips();
    renderHistory();
    renderBadges();
    currentSourceId = 'cet4';
    currentTextId = '';
    renderSourceChips();
    startRound();
    toast(ET.t('data.cleared'), 'good');
  }

  /* =====================================================================
     十五之二、导入备份：先体检、再确认、最后才写入
     ===================================================================== */

  /**
   * 把「设置里的模式」同步到界面控件和引擎上。
   * 导入备份后设置可能整体变了，需要重新同步一次。
   */
  function syncModeControlsFromSettings() {
    var pm = ET.Store.get('practiceMode');
    var em = ET.Store.get('errorMode');
    syncSegment('segPracticeMode', pm);
    syncSegment('segErrorMode', em);
    ET.Engine.configure({ practiceMode: pm, errorMode: em });
    if (DOM.selCount) DOM.selCount.value = String(ET.Store.get('itemCount') || 20);
    renderPrompt();
    renderModeHint();
  }

  /** 把时间戳格式化成 2026/9/18 11:20 */
  function fmtDateTime(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate() + ' ' +
           String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  /**
   * 渲染导入确认弹窗的内容：文件里有什么 vs 本机现在有什么。
   * @param {Object} info ET.Store.inspectBackup 的结果
   */
  function renderImportConfirm(info) {
    if (!DOM.importBody) return;

    var cells = [
      ['import.cRecords', info.records],
      ['import.cDays', info.days],
      ['import.cBadges', info.badges],
      ['import.cCustom', info.customTexts]
    ];

    var html = '';

    var when = fmtDateTime(info.exportedAt);
    if (when) {
      html += '<p class="modal-tip">' +
              ET.esc(ET.t('import.exportedAt', { d: when }) +
                     (info.version ? '（v' + info.version + '）' : '')) + '</p>';
    }

    html += '<div class="setting-section"><h3>' + ET.esc(ET.t('import.fileHas')) + '</h3>' +
            '<div class="result-grid">' +
            cells.map(function (c) {
              return '<div class="result-cell"><div class="rc-value">' + ET.esc(String(c[1])) +
                     '</div><div class="rc-label">' + ET.esc(ET.t(c[0])) + '</div></div>';
            }).join('') + '</div></div>';

    html += '<p class="modal-tip">' + ET.esc(ET.t('import.machineHas', {
      r: ET.Store.records().length,
      d: Object.keys(ET.Store.daily()).length,
      b: Object.keys(ET.Store.badges()).length,
      c: ET.Store.customTexts().length
    })) + '</p>';

    html += '<p class="warn-note">' + ET.esc(ET.t('import.warn')) + '</p>';

    DOM.importBody.innerHTML = html;
  }

  /**
   * 读取并校验用户选中的备份文件。
   * 只有通过校验才会弹出确认框 —— 确认之前不写入任何数据。
   * @param {File} file
   */
  function doImport(file) {
    if (!file) return;
    var reader = new FileReader();

    reader.onload = function () {
      var raw = String(reader.result == null ? '' : reader.result).trim();

      if (!raw) { toast(ET.t('import.errEmpty'), 'bad'); return; }

      var data;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        toast(ET.t('import.errJson'), 'bad');
        return;
      }

      var info = ET.Store.inspectBackup(data);
      if (!info.ok) {
        // 分清「不是 JSON」和「是 JSON 但不是本项目的备份」，
        // 否则用户不知道该去检查什么
        toast(info.reason === 'wrong-app' ? ET.t('import.errWrongApp') : ET.t('import.errJson'), 'bad');
        return;
      }

      pendingImport = data;
      renderImportConfirm(info);
      openModal('importModal');
    };

    reader.onerror = function () { toast(ET.t('import.errRead'), 'bad'); };
    reader.readAsText(file);
  }

  /** 用户点了「确认导入」 */
  function confirmImport() {
    if (!pendingImport) return;
    var res = ET.Store.importAll(pendingImport);
    pendingImport = null;
    closeModal('importModal');

    if (!res.ok) { toast(ET.t('data.importFailed'), 'bad'); return; }

    // 数据变了 → 界面整体刷新一次
    applySettings();
    syncModeControlsFromSettings();
    renderSourceChips();
    renderBadges();
    renderDaily();
    renderStats();
    renderHistory();
    toast(ET.t('data.imported', { r: res.records, d: res.days }), 'good');
  }

  /* =====================================================================
     十六、一轮结束的处理
     ===================================================================== */

  function handleRoundEnd(record) {
    // 生成成绩记录
    var saved = ET.Store.addRecord(record);

    // 累计到「今天」
    ET.Store.addDaily({
      chars: record.chars || 0,
      seconds: record.seconds || 0,
      items: record.items || 0
    });

    // 成就判定
    var fresh = [];
    if (ET.Store.get('badges')) {
      fresh = ET.Achievements.evaluate(saved);
    }

    // 声音与提示
    if (record.chars > 0) {
      ET.Sounds.roundDone();
      if (fresh.length) setTimeout(function () { ET.Sounds.unlock(); }, 700);
    }

    var dp = ET.Achievements.dailyProgress();
    if (dp.done && record.chars > 0) {
      toast(ET.t('daily.goalReached'), 'good');
    }
    fresh.forEach(function (b) {
      setTimeout(function () { toast(ET.t('toast.newBadge', { v: ET.t(b.name) }), 'good'); }, 900);
    });

    renderResult(record, fresh);
    renderDaily();
    renderStats();
    openModal('resultModal');
  }

  /* =====================================================================
     十七、事件绑定
     ===================================================================== */

  function bindEvents() {

    /* ---------- 输入框：核心输入入口 ---------- */
    DOM.typeInput.addEventListener('input', function () {
      DOM.typeInput.value = ET.Engine.handleInput(DOM.typeInput.value);
    });

    DOM.typeInput.addEventListener('focus', function () {
      DOM.targetWrap.classList.add('is-focused');
      DOM.stageOverlay.hidden = true;
    });

    DOM.typeInput.addEventListener('blur', function () {
      DOM.targetWrap.classList.remove('is-focused');
      if (!ET.Engine.isFinished() && ET.Engine.currentTarget()) DOM.stageOverlay.hidden = false;
    });

    DOM.typeInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        if (ET.Engine.enter()) e.preventDefault();
        return;
      }
      if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        restartRound();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        restartRound();
        return;
      }
      // 听音模式：Ctrl+Space 再听一遍
      if (e.key === ' ' && e.ctrlKey) {
        e.preventDefault();
        speakCurrent(false);
      }
    });

    // 点击舞台任意位置都聚焦到输入框
    DOM.targetWrap.addEventListener('mousedown', function (e) {
      if (e.target === DOM.typeInput) return;
      e.preventDefault();
      DOM.typeInput.focus();
    });
    DOM.stageOverlay.addEventListener('click', function () {
      DOM.typeInput.focus();
    });

    /* ---------- 顶栏 ---------- */
    DOM.btnTheme.addEventListener('click', function () {
      var list = ET.THEMES;
      var cur = ET.Store.get('theme');
      var next = list[(list.indexOf(cur) + 1) % list.length];
      ET.Store.update({ theme: next });
      toast(ET.t('toast.themeChanged', { v: ET.t('theme.' + next) }));
    });

    DOM.btnLang.addEventListener('click', function () {
      var next = ET.currentLang() === 'zh' ? 'en' : 'zh';
      ET.Store.update({ lang: next });
      toast(ET.t('toast.langChanged'));
    });

    DOM.btnSettings.addEventListener('click', function () {
      renderSettings();
      openModal('settingsModal');
    });

    DOM.btnStats.addEventListener('click', function () {
      renderHistory();
      openModal('statsModal');
    });

    DOM.btnAchievements.addEventListener('click', function () {
      renderBadges();
      openModal('achievementsModal');
    });

    /* ---------- 模式切换 ---------- */
    bindSegment('segPracticeMode', function (v) {
      ET.Store.update({ practiceMode: v });
      ET.Engine.configure({ practiceMode: v });
      renderPrompt();
      // 切到「看英文打英文 / 听发音打英文」时立刻读一遍，让人马上知道这个模式会出声
      maybeAutoSpeak();
      var item = ET.Engine.currentItem();
      if (v === 'zh2en' && item && !item.zh) showStageNote(ET.t('note.noZhMode'));
      else hideStageNote();
    });

    bindSegment('segErrorMode', function (v) {
      ET.Store.update({ errorMode: v });
      ET.Engine.configure({ errorMode: v });
      hideSentenceFeedback();
      restartRound();
    });

    /* ---------- 内容源 ---------- */
    DOM.sourceChips.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-source]');
      if (!btn) return;
      var id = btn.getAttribute('data-source');

      if (id === '__mine__') {
        var recent = ET.Store.customTexts()[0];
        if (!recent) { openCustomModal(); return; }
        var parsed = ET.Content.parseCustom(recent.text, recent.unit || 'sentence', recent.zh || '');
        ET.Content.setCustom({
          items: parsed.items, unit: recent.unit || 'sentence',
          label: ET.t('source.mine')
        });
        currentSourceId = 'custom';
        currentTextId = '';
        renderSourceChips();
        startRound();
        return;
      }

      currentSourceId = id;
      currentTextId = '';
      renderSourceChips();
      startRound();
    });

    DOM.selCount.addEventListener('change', function () {
      ET.Store.update({ itemCount: parseInt(DOM.selCount.value, 10) || 20 });
      startRound();
    });

    DOM.selText.addEventListener('change', function () {
      currentTextId = DOM.selText.value;
      startRound();
    });

    DOM.btnCustom.addEventListener('click', openCustomModal);
    DOM.btnSkip.addEventListener('click', function () {
      ET.Engine.skip();
      ET.Speech.cancel();
      hideSentenceFeedback();
      toast(ET.t('toast.skipped'));
    });
    DOM.btnRestart.addEventListener('click', restartRound);
    DOM.btnSpeak.addEventListener('click', function () { speakCurrent(false); });

    /* ---------- 自动播放补播 ----------
       浏览器的自动播放策略会拦掉「页面加载后、用户还没点过任何东西」时的音频。
       用户在页面上的第一次点击（点空白、点内容源按钮、点输入框…）都算交互，
       这时把被拦下的那次自动发音补上，避免第一题没有声音。 */
    document.addEventListener('pointerdown', retryPendingSpeak, true);

    /* ---------- 自定义文本弹窗 ---------- */
    var debouncedPreview = debounce(renderCustomPreview, 220);
    DOM.customText.addEventListener('input', debouncedPreview);
    DOM.customZh.addEventListener('input', debouncedPreview);
    DOM.customUnit.addEventListener('change', renderCustomPreview);

    DOM.btnLoadUrl.addEventListener('click', function () {
      var url = (DOM.customUrl.value || '').trim();
      if (!url) return;
      DOM.btnLoadUrl.disabled = true;
      ET.Content.fetchFromUrl(url).then(function (text) {
        DOM.customText.value = text.slice(0, 20000);
        renderCustomPreview();
        toast(ET.t('toast.urlOk'), 'good');
      }).catch(function () {
        toast(ET.t('toast.urlFail'), 'bad');
      }).then(function () {
        DOM.btnLoadUrl.disabled = false;
      });
    });

    DOM.btnUseCustom.addEventListener('click', function () {
      renderCustomPreview();
      if (!customDraft.items.length) { toast(ET.t('toast.customEmpty'), 'bad'); return; }

      var pick = DOM.customCount.value;
      var items = customDraft.items.slice();
      if (pick !== 'all' && ET.Store.get('shuffle') !== false) items = ET.shuffle(items);
      if (pick !== 'all') items = items.slice(0, parseInt(pick, 10) || 20);

      ET.Content.setCustom({
        items: items,
        unit: customDraft.unit,
        label: ET.t('source.mine'),
        raw: DOM.customText.value
      });
      // 顺手存一份到本地，方便下次从「我的内容」一键调出
      ET.Store.saveCustom({
        text: DOM.customText.value,
        unit: customDraft.unit,
        zh: DOM.customZh.value
      });

      currentSourceId = 'custom';
      currentTextId = '';
      closeModal('customModal');
      renderSourceChips();
      startRound();
      toast(ET.t('toast.customLoaded', { n: items.length }), 'good');
    });

    /* ---------- 成绩弹窗里的数据操作 ---------- */
    DOM.btnExport.addEventListener('click', doExport);
    DOM.btnImport.addEventListener('click', function () { DOM.importFile.click(); });
    DOM.importFile.addEventListener('change', function () {
      var f = DOM.importFile.files && DOM.importFile.files[0];
      DOM.importFile.value = '';   // 先清空，保证连续选同一个文件也能触发 change
      if (f) doImport(f);
    });
    DOM.btnConfirmImport.addEventListener('click', confirmImport);
    DOM.btnClearData.addEventListener('click', doClear);

    DOM.btnResultAgain.addEventListener('click', function () {
      closeModal('resultModal');
      restartRound();
    });

    /* ---------- 设置面板内的动态元素（事件委托） ---------- */
    DOM.settingsBody.addEventListener('change', function (e) {
      var s = e.target.closest('[data-setting]');
      if (s) {
        var patch = {};
        patch[s.getAttribute('data-setting')] = s.value;
        ET.Store.update(patch);
        var key = s.getAttribute('data-setting');
        if (key === 'practiceMode') {
          ET.Engine.configure({ practiceMode: s.value });
          renderPrompt();
        } else if (key === 'errorMode') {
          ET.Engine.configure({ errorMode: s.value });
          restartRound();
        }
      }
      var r = e.target.closest('[data-range]');
      if (r) {
        var p2 = {};
        p2[r.getAttribute('data-range')] = parseFloat(r.value);
        ET.Store.update(p2);
      }
    });

    DOM.settingsBody.addEventListener('input', function (e) {
      var r = e.target.closest('[data-range]');
      if (!r) return;
      var key = r.getAttribute('data-range');
      var out = DOM.settingsBody.querySelector('[data-range-out="' + key + '"]');
      if (out) out.textContent = r.value + (key === 'dailyGoalMinutes' ? ' ' + ET.t('min.suffix') : '');
      var p = {};
      p[key] = parseFloat(r.value);
      ET.Store.update(p);
    });

    DOM.settingsBody.addEventListener('click', function (e) {
      var t = e.target.closest('[data-toggle]');
      if (t) {
        var key = t.getAttribute('data-toggle');
        var next = !ET.Store.get(key);
        var patch = {};
        patch[key] = next;
        ET.Store.update(patch);
        t.setAttribute('aria-checked', next ? 'true' : 'false');
        if (next && key === 'sound') ET.Sounds.test();
        // 这两项会直接改变当前这一轮的显示 / 取题方式，需要立刻生效
        if (key === 'shuffle') startRound();
        if (key === 'showPhonetic') renderPrompt();
        return;
      }
      if (e.target.closest('#btnExport2')) doExport();
      if (e.target.closest('#btnImport2')) DOM.importFile.click();
      if (e.target.closest('#btnClearData2')) doClear();
      if (e.target.closest('#btnResetProgress')) {
        ET.Store.resetProgress();
        toast(ET.t('settings.resetProgressDone'), 'good');
        startRound();
      }
      if (e.target.closest('#btnResetSettings')) {
        if (window.confirm(ET.t('settings.resetConfirm'))) {
          ET.Store.resetSettings();
          renderSettings();
          applySettings();
          toast(ET.t('toast.settingsReset'), 'good');
        }
      }
    });

    /* ---------- 弹窗通用：关闭按钮 / 点遮罩关闭 / Esc ---------- */
    document.addEventListener('click', function (e) {
      var closeBtn = e.target.closest('[data-close]');
      if (closeBtn) {
        closeModal(closeBtn.getAttribute('data-close'));
        return;
      }
      if (e.target.classList && e.target.classList.contains('modal-mask')) {
        closeModal(e.target.id);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isModalOpen()) {
        closeTopModal();
      }
    });

    /* ---------- 窗口尺寸变化时重画图表 ---------- */
    window.addEventListener('resize', debounce(function () {
      if (!el('statsModal').hidden) {
        ET.Stats.drawChart(DOM.historyChart, ET.Store.records());
      }
    }, 180));
  }

  /** 重新开始当前一轮（题目不变） */
  function restartRound() {
    ET.Speech.cancel();
    hideSentenceFeedback();
    ET.Engine.restart();     // restart 内部会 load，从而触发 item 事件 → 自动发音
  }

  function hideSentenceFeedback() {
    if (DOM.sentenceFeedback) {
      DOM.sentenceFeedback.hidden = true;
      DOM.sentenceFeedback.innerHTML = '';
    }
  }

  /* =====================================================================
     十八、引擎事件 → 界面更新
     ===================================================================== */

  function bindEngine() {
    ET.Engine.on('state', function (model) {
      paintTarget(model);
      renderStats();
    });

    ET.Engine.on('item', function () {
      needFullRepaint = true;
      hideSentenceFeedback();
      renderPrompt();
      // 如果当前条目没有中文释义，用中文模式时要给个说明
      var item = ET.Engine.currentItem();
      if (ET.Engine.practiceMode() === 'zh2en' && item && !item.zh) {
        showStageNote(ET.t('note.noZhMode'));
      } else if (ET.Engine.practiceMode() !== 'zh2en') {
        hideStageNote();
      }
      // 换题了 → 按当前模式和设置决定是否自动发音
      // （load / next / skip / restart 都会走到这里，所以只需在此一处处理）
      maybeAutoSpeak();
    });

    ET.Engine.on('tick', function () {
      renderStats();
    });

    ET.Engine.on('resetInput', function () {
      DOM.typeInput.value = '';
      // 注意：这里故意不改 lastLen。
      // 因为紧接着往往会有一次「换题重绘」，此时 lastLen 保持旧值
      // 才能让差量更新算对范围；提前清零反而会导致画面残留旧颜色。
    });

    ET.Engine.on('char', function (e) {
      if (!ET.Store.get('sound')) return;
      if (e.ok) {
        if (ET.Engine.currentTarget().charAt(e.pos) === ' ') ET.Sounds.space();
        else ET.Sounds.key();
      } else {
        ET.Sounds.error();
      }
    });

    ET.Engine.on('reject', function () {
      // 严格模式打错：抖一下 + 出错音
      DOM.targetWrap.classList.remove('is-error');
      void DOM.targetWrap.offsetWidth;     // 强制重排，让动画能重新播放
      DOM.targetWrap.classList.add('is-error');
      setTimeout(function () { DOM.targetWrap.classList.remove('is-error'); }, 340);
    });

    ET.Engine.on('itemDone', function (item) {
      ET.Sounds.itemDone();
      // 「答对后朗读」在两种能听到发音的模式下都生效
      // （看中文模式不朗读：会把答案念出来）
      var pm = ET.Engine.practiceMode();
      if (ET.Store.get('speakOnFinish') && (pm === 'listen' || pm === 'en2en')) speakCurrent(true);
      if (ET.Engine.errorMode() !== 'sentence' && ET.Store.get('autoNext') === false) {
        if (DOM.sentenceFeedback) {
          DOM.sentenceFeedback.hidden = false;
          DOM.sentenceFeedback.innerHTML =
            '<span class="fb-ok">✓</span> ' + ET.esc(ET.t('sentence.pressEnterToNext'));
        }
      }
    });

    ET.Engine.on('sentenceScored', function (res) {
      if (!DOM.sentenceFeedback) return;
      DOM.sentenceFeedback.hidden = false;
      var wrong = res.wrong.length;
      var head = wrong === 0
        ? '<span class="fb-ok">✓ ' + ET.esc(ET.t('sentence.perfect')) + '</span>'
        : '<span class="fb-bad">✗ ' + ET.esc(ET.t('sentence.wrongCount', { n: wrong })) + '</span>';
      var yours = '<span class="fb-yours">' + ET.esc(ET.t('sentence.yours')) + ' ' +
                  ET.esc(res.typed) + '</span>';
      DOM.sentenceFeedback.innerHTML = head + yours +
        '<div class="modal-tip" style="margin-top:6px">' + ET.esc(ET.t('sentence.pressEnterToNext')) + '</div>';
    });

    ET.Engine.on('roundEnd', handleRoundEnd);

    ET.Engine.on('empty', function () {
      toast(ET.t('toast.customEmpty'), 'bad');
    });
  }

  /* =====================================================================
     十九、初始化
     ===================================================================== */

  function cacheDom() {
    DOM = {
      /* 顶栏 */
      btnTheme: el('btnTheme'), themeIcon: el('themeIcon'), btnLang: el('btnLang'),
      btnSettings: el('btnSettings'), btnStats: el('btnStats'), btnAchievements: el('btnAchievements'),
      /* 内容源 */
      sourceChips: el('sourceChips'), selCount: el('selCount'), selText: el('selText'),
      btnCustom: el('btnCustom'),
      /* 舞台 */
      sourceLabel: el('sourceLabel'), itemCounter: el('itemCounter'), roundCounter: el('roundCounter'),
      btnSpeak: el('btnSpeak'), btnSkip: el('btnSkip'), btnRestart: el('btnRestart'),
      promptArea: el('promptArea'), targetWrap: el('targetWrap'), targetText: el('targetText'),
      typeInput: el('typeInput'), stageOverlay: el('stageOverlay'),
      sentenceFeedback: el('sentenceFeedback'), stageNote: el('stageNote'), modeHint: el('modeHint'),
      /* 统计 */
      statWpm: el('statWpm'), statAcc: el('statAcc'), statCombo: el('statCombo'),
      statScore: el('statScore'), statTime: el('statTime'),
      statProgressText: el('statProgressText'), progressFill: el('progressFill'),
      dailyBar: el('dailyBar'), dailyText: el('dailyText'), dailyFill: el('dailyFill'),
      /* 弹窗 */
      settingsBody: el('settingsBody'),
      customText: el('customText'), customZh: el('customZh'), customUnit: el('customUnit'),
      customCount: el('customCount'), customUrl: el('customUrl'), customPreview: el('customPreview'),
      btnLoadUrl: el('btnLoadUrl'), btnUseCustom: el('btnUseCustom'),
      resultBody: el('resultBody'), btnResultAgain: el('btnResultAgain'),
      historySummary: el('historySummary'), historyTable: el('historyTable'),
      historyChart: el('historyChart'), badgeGrid: el('badgeGrid'),
      /* 数据 */
      btnExport: el('btnExport'), btnImport: el('btnImport'), importFile: el('importFile'),
      btnClearData: el('btnClearData'),
      importBody: el('importBody'), btnConfirmImport: el('btnConfirmImport'),
      /* 提示 */
      toastWrap: el('toastWrap')
    };
  }

  var UI = {

    toast: toast,

    /** 初始化整个界面 */
    init: function () {
      cacheDom();

      // 顶栏与内容源的下拉/输入控件与设置同步
      DOM.selCount.value = String(ET.Store.get('itemCount') || 20);

      // 文本选择器的外壳（网络内容源才显示）
      var picker = document.createElement('label');
      picker.className = 'mini-field';
      picker.id = 'textPickerWrap';
      picker.hidden = true;
      picker.innerHTML = '<span data-i18n="label.source"></span>' +
                         '<select id="selText"></select>';
      var right = document.querySelector('.sourcebar-right');
      if (right) right.insertBefore(picker, right.firstChild);
      DOM.textPickerWrap = picker;
      DOM.selText = el('selText');

      applyTheme();
      applyI18n();
      applyStatVisibility();
      syncSegment('segPracticeMode', ET.Store.get('practiceMode'));
      syncSegment('segErrorMode', ET.Store.get('errorMode'));

      currentSourceId = ET.Store.get('sourceId') || 'cet4';
      if (!ET.Content.getSource(currentSourceId) && currentSourceId !== 'custom') currentSourceId = 'cet4';

      bindEvents();
      bindEngine();
      renderSourceChips();

      // 设置变化 → 局部刷新
      ET.Store.on('settings', function (patch) {
        applySettings(patch);
      });

      // 存储不可用（无痕模式）时提醒一次
      if (!ET.Store.isPersistent()) {
        setTimeout(function () {
          toast('浏览器禁用了本地存储，本次练习数据不会被保存（无痕模式常见）', 'bad');
        }, 1200);
      }

      // 首轮练习
      startRound();
      renderDaily();

      console.log('%c单词冲刺 WordRush v' + ET.VERSION + ' 已就绪',
        'color:#4f46e5;font-weight:bold', '\n在控制台输入 ET 可以查看所有模块');
    },

    startRound: startRound,
    renderStats: renderStats,
    renderDaily: renderDaily,
    applySettings: applySettings,
    openModal: openModal,
    closeModal: closeModal
  };

  ET.UI = UI;

})(window.ET);
