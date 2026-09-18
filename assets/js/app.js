/* =====================================================================
   app.js —— 启动入口
   ---------------------------------------------------------------------
   它是最后一个被加载的脚本，只做三件事：
     1. 初始化本地数据仓库（读设置）
     2. 初始化界面（画出来 + 绑事件）
     3. 兜底捕获运行时报错，避免小白用户看到一个「白屏」却不知道原因

   【小白提示】如果网站打不开、或者某个按钮没反应，
   按 F12 打开控制台，看有没有红色的报错信息，
   报错通常会指明是哪个文件第几行出了问题。
   ===================================================================== */

(function (ET) {
  'use strict';

  function boot() {
    try {
      // 第一步：读取本地数据（设置 / 成绩 / 打卡 / 徽章）
      ET.Store.init();

      // 第二步：把界面画出来并接上所有交互
      ET.UI.init();
    } catch (err) {
      console.error('[app] 初始化失败：', err);
      showFatal(err);
    }
  }

  /**
   * 初始化失败时，在页面上给出一条人能看懂的错误提示，
   * 而不是让用户面对一片空白。
   */
  function showFatal(err) {
    var box = document.createElement('div');
    box.style.cssText =
      'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;' +
      'justify-content:center;padding:24px;background:#f5f6fa;' +
      'font-family:system-ui,-apple-system,"Microsoft YaHei",sans-serif;';
    box.innerHTML =
      '<div style="max-width:560px;background:#fff;border:1px solid #e4e7ee;' +
      'border-radius:14px;padding:26px;box-shadow:0 10px 40px rgba(16,24,40,.12)">' +
        '<h2 style="margin:0 0 10px;font-size:18px;color:#1b2030">页面启动失败 😢</h2>' +
        '<p style="margin:0 0 12px;color:#545c72;line-height:1.7;font-size:14px">' +
          '请把下面的信息截图给开发者，或者按 F12 打开控制台查看完整报错：</p>' +
        '<pre style="margin:0;padding:12px;background:#f8f9fc;border:1px solid #e4e7ee;' +
        'border-radius:8px;font-size:12px;overflow:auto;color:#e5484d;white-space:pre-wrap">' +
        String(err && (err.stack || err.message) || err).replace(/[<>&]/g, function (c) {
          return { '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c];
        }) +
        '</pre>' +
      '</div>';
    document.body.appendChild(box);
  }

  // 运行期未捕获的错误也记下来，方便排查（不影响用户使用）
  window.addEventListener('error', function (e) {
    console.error('[app] 运行时报错：', e.message, e.filename + ':' + e.lineno);
  });

  // DOM 就绪后启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(window.ET);
