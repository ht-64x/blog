/* ==========================================================================
   不蒜子统计的本地预览保护

   背景（实测发现）：
   不蒜子按 Referer（来源域名）分别统计。同一个接口在不同来源下返回的数据是
   完全不同的池子：

     Referer: https://ht-64x.github.io/blog/  →  site_uv: 175      ← 你的真实数据
     Referer: http://127.0.0.1:PORT/blog/     →  site_uv: 8086094  ← 所有本地调试者混在一起
     Referer: http://localhost:4000/          →  site_uv: 57256481 ← 更大的一锅粥

   于是在本地 `hexo server` 或本地预览时，侧栏会显示"本站访客数 8086127"这种
   几百万的假数字。它极具迷惑性 —— 会让人以为博客真有那么多访问。

   本脚本：只在本地环境（localhost / 127.0.0.1 / 局域网 IP / file:）
   把这两个数字替换成明确标注。线上（真实域名）不做任何改动。

   实现要点：
   不蒜子脚本会反复写这两个元素（每次心跳都覆盖），所以不能只改一次 ——
   用 MutationObserver 一直盯着，发现又被写成数字就再改回来。
   同时本脚本必须在不蒜子之后执行，因此挂在 inject.bottom 的末尾。

   注意：纯 .js 文件，用块注释。
   ========================================================================== */
(function () {
  'use strict';

  function isLocalPreview() {
    var h = location.hostname;
    if (location.protocol === 'file:') return true;
    if (h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '0.0.0.0' || h === '') return true;
    if (/^192\.168\./.test(h)) return true;
    if (/^10\./.test(h)) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
    return false;
  }

  if (!isLocalPreview()) return;   /* 线上不动 */

  var IDS = ['busuanzi_value_site_uv', 'busuanzi_value_site_pv'];
  var TIP = '本地预览：不蒜子按来源域名统计，本地看到的是所有调试者共用的池子，不是本站真实数据';

  function fix(el) {
    if (!el) return false;
    var t = (el.textContent || '').trim();
    /* 只处理"纯数字"的填充结果（不蒜子填进来之后） */
    if (!/^\d+$/.test(t)) return false;
    el.setAttribute('data-dsh-local', '1');
    el.setAttribute('title', TIP);
    el.style.opacity = '.55';
    el.style.fontSize = '.92em';
    el.textContent = '本地预览';
    return true;
  }

  function scan() {
    IDS.forEach(function (id) { fix(document.getElementById(id)); });
  }

  function start() {
    scan();

    /* 一直盯着：不蒜子每次更新都会重新写数字，发现数字就再改回来 */
    if (window.MutationObserver) {
      IDS.forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        new MutationObserver(function () { fix(el); })
          .observe(el, { childList: true, characterData: true, subtree: true });
      });
    }

    /* 兜底轮询：覆盖 observer 建立之前/之后的边界情况 */
    var n = 0;
    var t = setInterval(function () {
      scan();
      if (++n >= 30) clearInterval(t);   /* 约 30 秒后停 */
    }, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  /* DOMContentLoaded 可能已经过了（脚本在底部），再延迟跑一次确保拿到元素 */
  setTimeout(start, 300);
  setTimeout(scan, 1500);
  setTimeout(scan, 4000);
})();
