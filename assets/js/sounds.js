/* =====================================================================
   sounds.js —— 打字音效
   ---------------------------------------------------------------------
   实现方式：用浏览器的 Web Audio API「现场合成」声音，
   不加载任何 mp3 / wav 文件 —— 这样项目体积几乎为零，
   也不会有音效文件被墙或加载失败的问题。

   【小白提示】想换音色，改下面 tone() 里的 type（'sine' 正弦波、
   'triangle' 三角波、'square' 方波、'sawtooth' 锯齿波）和频率即可。
   ===================================================================== */

(function (ET) {
  'use strict';

  var ctx = null;         // AudioContext，首次出声时才创建（浏览器要求用户交互后才能创建）
  var master = null;      // 总音量节点
  var lastPlay = 0;       // 限流用：避免超高速连打时声音糊成一片

  /**
   * 懒加载音频上下文。
   * 浏览器策略：必须在用户点击之类的交互之后才能启动音频，所以放在第一次打字时创建。
   */
  function ensureCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  /** 如果上下文被挂起（手机端常见），尝试唤醒 */
  function resume() {
    if (ctx && ctx.state === 'suspended') {
      try { ctx.resume(); } catch (e) { /* 忽略 */ }
    }
  }

  /** 当前音量（0 表示关闭） */
  function volume() {
    if (!ET.Store.get('sound')) return 0;
    return ET.clamp(parseFloat(ET.Store.get('soundVolume')) || 0.4, 0, 1);
  }

  /**
   * 合成一个音。
   * @param {Object} o {freq, dur, type, gain, slideTo}
   */
  function tone(o) {
    var c = ensureCtx();
    if (!c) return;
    resume();

    var vol = volume();
    if (vol <= 0) return;

    // 限流：同一毫秒内不重复发声
    var now = c.currentTime;
    if (now - lastPlay < 0.012) return;
    lastPlay = now;

    var osc = c.createOscillator();
    var g = c.createGain();

    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.freq, now);
    if (o.slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, o.slideTo), now + o.dur);
    }

    // 快速衰减包络 —— 短促的「嗒」声就靠这个
    var peak = (o.gain == null ? 0.5 : o.gain) * vol * 0.35;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(peak, now + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, now + o.dur);

    osc.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + o.dur + 0.02);
  }

  /** 播放一串音符（用于完成、升级这类提示音） */
  function sequence(notes) {
    var c = ensureCtx();
    if (!c || volume() <= 0) return;
    resume();
    var t0 = c.currentTime + 0.01;
    notes.forEach(function (n, i) {
      var when = t0 + (n.delay || i * 0.09);
      var osc = c.createOscillator();
      var g = c.createGain();
      osc.type = n.type || 'triangle';
      osc.frequency.setValueAtTime(n.freq, when);
      var peak = (n.gain == null ? 0.5 : n.gain) * volume() * 0.3;
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(peak, when + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, when + (n.dur || 0.16));
      osc.connect(g);
      g.connect(master);
      osc.start(when);
      osc.stop(when + (n.dur || 0.16) + 0.03);
    });
  }

  /** 加一点随机，让连打的声音不呆板 */
  function jitter(base, range) {
    return base + (Math.random() - 0.5) * range;
  }

  var Sounds = {

    /** 打对一个字符 */
    key: function () {
      tone({ freq: jitter(1180, 120), dur: 0.035, type: 'triangle', gain: 0.45 });
    },

    /** 打错一个字符 */
    error: function () {
      tone({ freq: 170, dur: 0.13, type: 'sawtooth', gain: 0.5, slideTo: 110 });
    },

    /** 空格（音调略低，听起来有节奏感） */
    space: function () {
      tone({ freq: jitter(820, 80), dur: 0.04, type: 'triangle', gain: 0.4 });
    },

    /** 完成一题 */
    itemDone: function () {
      sequence([
        { freq: 784, dur: 0.10, gain: 0.45 },
        { freq: 1046, dur: 0.14, gain: 0.4, delay: 0.075 }
      ]);
    },

    /** 完成整轮 */
    roundDone: function () {
      sequence([
        { freq: 523, dur: 0.13, gain: 0.45 },
        { freq: 659, dur: 0.13, gain: 0.45, delay: 0.11 },
        { freq: 784, dur: 0.13, gain: 0.45, delay: 0.22 },
        { freq: 1046, dur: 0.30, gain: 0.5, delay: 0.33 }
      ]);
    },

    /** 解锁徽章 / 达成目标 */
    unlock: function () {
      sequence([
        { freq: 880, dur: 0.11, gain: 0.5, type: 'sine' },
        { freq: 1174, dur: 0.11, gain: 0.5, type: 'sine', delay: 0.10 },
        { freq: 1568, dur: 0.28, gain: 0.45, type: 'sine', delay: 0.20 }
      ]);
    },

    /** 连击达到里程碑 */
    combo: function () {
      tone({ freq: 1400, dur: 0.09, type: 'sine', gain: 0.5, slideTo: 1900 });
    },

    /** 手动测试（设置面板里的「试听」用） */
    test: function () {
      var saved = ET.Store.get('sound');
      if (!saved) ET.Store.update({ sound: true }, true);
      Sounds.roundDone();
      if (!saved) setTimeout(function () { ET.Store.update({ sound: false }, true); }, 600);
    }
  };

  ET.Sounds = Sounds;

})(window.ET);
