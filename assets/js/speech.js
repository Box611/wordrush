/* =====================================================================
   speech.js —— 发音模块（在线词典发音 + 浏览器语音降级）
   ---------------------------------------------------------------------
   为什么需要「降级」：
     在线接口依赖第三方服务器，可能会限流、改地址、或者被网络环境挡住。
     一旦失败，就自动改用浏览器内置的 SpeechSynthesis（语音合成），
     虽然音质一般，但保证「永远能出声」，不会卡住练习。

   四个发音源（详见下方 PROVIDERS 的逐个说明）：
     ① 有道词典   —— 快（实测 111ms），音质接近真人，自动链路的首选
     ② 百度翻译   —— 备用
     ③ Free Dictionary API —— 真人录音，但实测约 20 秒，只作为手动选项
     ④ 浏览器语音 —— 兜底，永远可用

   调用示例：
     ET.Speech.speak('hello')                      // 按设置自动选择发音源
     ET.Speech.speak('hello', { force: 'browser' })// 强制用浏览器语音
     ET.Speech.cancel()                            // 打断当前播放

   【小白提示】如果你发现某个接口失效了，可以在下面 PROVIDERS 里
   把它的 enabled 改成 false，或者自行替换 url 拼接规则。
   ===================================================================== */

(function (ET) {
  'use strict';

  var currentAudio = null;        // 正在播放的 Audio 对象
  var voices = [];                // 浏览器可用语音列表（异步加载）
  var lastProvider = '';          // 上一次实际使用的发音源，用于提示用户

  /* ---------------- 在线发音接口 ---------------- */

  var PROVIDERS = {
    /**
     * 有道词典发音接口。
     * type=1 英音，type=2 美音。
     * 这是目前最稳定、最常用的公开接口，直接给 <audio> 用不需要跨域许可。
     */
    youdao: {
      label: 'youdao',
      enabled: true,
      /** 最长可读字符数，太长的段落它念不出来 */
      maxLen: 180,
      build: function (text, opts) {
        var type = (opts && opts.accent) === 'uk' ? 1 : 2;
        return 'https://dict.youdao.com/dictvoice?audio=' +
               encodeURIComponent(text) + '&type=' + type;
      }
    },

    /**
     * 百度翻译 TTS 接口（备用）。
     * 稳定性略差于有道，作为第二顺位。
     */
    baidu: {
      label: 'baidu',
      enabled: true,
      maxLen: 180,
      build: function (text) {
        return 'https://tts.baidu.com/text2audio?tex=' +
               encodeURIComponent(text) +
               '&cuid=wordrush&lan=en&ctp=1&pdt=301&vol=9&rate=32&per=0';
      }
    },

    /**
     * Free Dictionary API（dictionaryapi.dev）—— 真人录音。
     * ------------------------------------------------------------------
     * ⚠️ 实测说明（写在代码里，免得以后有人想不通为什么不默认用它）：
     *    本机网络下它的响应时间稳定在 **约 20 秒**，而有道只要 111 毫秒。
     *    差距接近 200 倍，因此它**不在自动链路里**，只能手动选。
     *    如果换到网络更好的环境，它可能只要几百毫秒 —— 那时可以把它
     *    挪到 auto 链路的前面。
     * 另一个限制：只适合单个单词，整句会查不到。
     * ------------------------------------------------------------------
     */
    dictionaryapi: {
      label: 'dictionaryapi',
      enabled: true,
      maxLen: 40,          // 只查单词，不查句子
      timeoutMs: 6000,     // 查词超时就放弃，别让用户干等
      /** 它分两步：先查 JSON 拿到音频地址，再播放。所以用 resolve 而不是 build。 */
      resolve: function (text) {
        var url = 'https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(text);
        var ctl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        var timer = null;
        if (ctl) timer = setTimeout(function () { ctl.abort(); }, PROVIDERS.dictionaryapi.timeoutMs);

        return fetch(url, ctl ? { signal: ctl.signal } : {})
          .then(function (res) {
            if (!res.ok) throw new Error('http ' + res.status);
            return res.json();
          })
          .then(function (list) {
            var found = '';
            (Array.isArray(list) ? list : []).forEach(function (entry) {
              (entry && entry.phonetics || []).forEach(function (p) {
                if (!found && p && p.audio && /^https?:\/\//.test(p.audio)) found = p.audio;
              });
            });
            if (!found) throw new Error('no-audio');
            return found;
          })
          .then(function (u) { if (timer) clearTimeout(timer); return u; })
          .catch(function (e) { if (timer) clearTimeout(timer); throw e; });
      }
    },

    /** 浏览器自带语音合成，永远可用（只要浏览器支持） */
    browser: {
      label: 'browser',
      enabled: true,
      build: null
    }
  };

  /* 已解析出的在线音频地址缓存：单词 → url。
     避免同一个词反复请求（这个接口本来就慢，缓存收益很明显）。 */
  var resolveCache = {};

  /* ---------------- 浏览器语音合成 ---------------- */

  function loadVoices() {
    if (!('speechSynthesis' in window)) return;
    try {
      voices = window.speechSynthesis.getVoices() || [];
    } catch (e) { voices = []; }
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    loadVoices();
    // Chrome 的语音列表是异步加载的，第一次拿可能是空的
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  /**
   * 从可用语音里挑一个英语发音人。
   * @param {'us'|'uk'} accent
   * @returns {SpeechSynthesisVoice|null}
   */
  function pickVoice(accent) {
    if (!voices.length) loadVoices();
    var want = accent === 'uk' ? /en[-_]GB/i : /en[-_]US/i;
    var v = voices.filter(function (x) { return want.test(x.lang); })[0];
    if (!v) v = voices.filter(function (x) { return /^en/i.test(x.lang); })[0];
    return v || null;
  }

  /**
   * 用浏览器语音合成朗读。
   * @param {string} text
   * @param {Object} opts {accent, rate}
   * @returns {Promise<void>}
   */
  function browserSpeak(text, opts) {
    return new Promise(function (resolve, reject) {
      if (!('speechSynthesis' in window)) {
        reject(new Error('speech-synthesis-unsupported'));
        return;
      }
      try { window.speechSynthesis.cancel(); } catch (e) { /* 忽略 */ }

      var u = new SpeechSynthesisUtterance(String(text));
      var accent = (opts && opts.accent) || 'us';
      u.lang = accent === 'uk' ? 'en-GB' : 'en-US';
      u.rate = (opts && opts.rate) || 1;
      u.pitch = 1;
      u.volume = 1;
      var v = pickVoice(accent);
      if (v) u.voice = v;

      // 某些浏览器 onend 不一定触发，加一个兜底定时器防止 Promise 永远挂着
      var settled = false;
      var estMs = Math.min(20000, 900 + String(text).length * 95);
      var timer = setTimeout(function () {
        if (!settled) { settled = true; resolve(); }
      }, estMs);

      u.onend = function () { if (!settled) { settled = true; clearTimeout(timer); resolve(); } };
      u.onerror = function (e) {
        if (!settled) { settled = true; clearTimeout(timer); reject(e || new Error('tts-error')); }
      };

      window.speechSynthesis.speak(u);
    });
  }

  /* ---------------- 在线音频播放 ---------------- */

  /**
   * 播放一个音频地址。
   * 判断「成功」的依据是真正开始播放（onplaying / play() resolve），
   * 而不是简单看有没有发请求 —— 否则接口返回错误页也会被当成成功。
   * @param {string} url
   * @param {number} [timeoutMs]
   * @returns {Promise<HTMLAudioElement>}
   */
  function playUrl(url, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var audio = new Audio();
      var settled = false;
      var timer = null;

      function finish(fn, arg) {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        audio.onerror = audio.onplaying = audio.oncanplaythrough = null;
        fn(arg);
      }

      audio.onerror = function () { finish(reject, new Error('audio-error')); };
      audio.onplaying = function () { finish(resolve, audio); };

      timer = setTimeout(function () {
        try { audio.pause(); audio.src = ''; } catch (e) { /* 忽略 */ }
        finish(reject, new Error('audio-timeout'));
      }, timeoutMs || 3200);

      audio.preload = 'auto';
      audio.crossOrigin = null;      // 不主动要跨域许可，否则很多接口会被拒
      audio.src = url;

      var p = audio.play();
      if (p && typeof p.then === 'function') {
        p.then(function () { finish(resolve, audio); })
         .catch(function (err) { finish(reject, err); });
      }
    });
  }

  /* ---------------- 对外接口 ---------------- */

  var Speech = {

    /** 上一次实际使用的发音源（'youdao' | 'baidu' | 'browser'） */
    lastProvider: function () { return lastProvider; },

    /** 浏览器是否支持语音合成 */
    browserSupported: function () { return 'speechSynthesis' in window; },

    /**
     * 播放一段英文的发音。
     * @param {string} text 要朗读的英文
     * @param {Object} [opts] { force:'youdao'|'baidu'|'browser', accent:'us'|'uk', rate:number }
     * @returns {Promise<string>} 解析为实际使用的发音源名称
     */
    speak: function (text, opts) {
      opts = opts || {};
      var s = (text || '').trim();
      if (!s) return Promise.resolve('');

      var setting = opts.force || ET.Store.get('voiceProvider') || 'auto';
      var accent = opts.accent || ET.Store.get('accent') || 'us';
      var rate = opts.rate || ET.Store.get('speechRate') || 1;

      // 组装尝试顺序
      var order;
      if (setting === 'browser') {
        order = ['browser'];
      } else if (setting === 'auto') {
        order = ['youdao', 'baidu', 'browser'];
      } else {
        order = [setting, 'browser'];   // 指定了在线接口也要保留浏览器兜底
      }

      Speech.cancel();

      // 依次尝试，任何一个成功就返回
      var i = 0;
      function attempt() {
        if (i >= order.length) return Promise.reject(new Error('all-providers-failed'));
        var name = order[i++];
        var p = PROVIDERS[name];
        if (!p || !p.enabled) return attempt();

        // 浏览器语音
        if (name === 'browser') {
          if (!Speech.browserSupported()) return attempt();
          return browserSpeak(s, { accent: accent, rate: rate })
            .then(function () { lastProvider = 'browser'; return 'browser'; })
            .catch(function () { return attempt(); });
        }

        // 太长的文本在线接口读不了，直接跳过
        if (p.maxLen && s.length > p.maxLen) return attempt();

        // 需要先「解析」出音频地址的接口（如 dictionaryapi）
        if (typeof p.resolve === 'function') {
          var cacheKey = name + '|' + s.toLowerCase();
          if (resolveCache[cacheKey]) {
            return playUrl(resolveCache[cacheKey])
              .then(function (audio) { currentAudio = audio; lastProvider = name; return name; })
              .catch(function () { delete resolveCache[cacheKey]; return attempt(); });
          }
          return p.resolve(s)
            .then(function (audioUrl) {
              resolveCache[cacheKey] = audioUrl;
              return playUrl(audioUrl, p.timeoutMs);
            })
            .then(function (audio) { currentAudio = audio; lastProvider = name; return name; })
            .catch(function () { return attempt(); });
        }

        return playUrl(p.build(s, { accent: accent }))
          .then(function (audio) {
            currentAudio = audio;
            lastProvider = name;
            return name;
          })
          .catch(function () { return attempt(); });
      }

      return attempt();
    },

    /**
     * 打断当前播放（在线音频和浏览器语音都停）。
     */
    cancel: function () {
      if (currentAudio) {
        try { currentAudio.pause(); currentAudio.src = ''; } catch (e) { /* 忽略 */ }
        currentAudio = null;
      }
      if (Speech.browserSupported()) {
        try { window.speechSynthesis.cancel(); } catch (e) { /* 忽略 */ }
      }
    },

    /** 供调试或「测试发音」按钮使用：按名称直接测某个源 */
    test: function (provider, text) {
      return Speech.speak(text || 'Hello, this is a test.', { force: provider });
    }
  };

  ET.Speech = Speech;

})(window.ET);
