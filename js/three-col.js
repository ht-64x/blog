/* ==========================================================================
   首页三列布局 · 卡片分配

   把 #aside-content 里的卡片按 COLUMNS 配置分到左右两列。

   为什么用 JS 搬 DOM，而不是纯 CSS 分列：
   CSS Grid 的行是共享的 —— 左列某张卡变高会把同一行的右列卡片一起撑开，
   列与列之间出现大片空白。用两个独立 flex 列容器各自竖排就没这问题，
   而且"哪张卡在哪一列"集中在一个数组里，改动一目了然。

   为了不破坏主题：搬卡片时把包装容器（.sticky_layout / #dsh-widgets）保留，
   只是让它们变空 —— 依赖这些容器的脚本仍能 querySelector 到。

   本函数是幂等的：可以反复调用，每次都会把"新出现的"卡片补进对应的列，
   这样异步注入的音乐播放器 / 一言 / 足迹 / 倒计时最终都能就位。

   只在首页（#content-inner.dsh-3col）执行，其它页面完全不碰。
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- 卡片归属配置 ----------
     调整卡片去哪一列、以及列内顺序，只改这里。
     数组顺序 = 该列从上到下的顺序（先写的在上面）。
     选择器先相对 #aside-content 找，找不到再全局找（音乐播放器挂在 body 下）。

     分配原则：左右两列高度尽量接近，且都接近中列（文章）的高度。 */
  var COLUMNS = {
    left: [
      '.card-info',                     // 头像 / 作者卡
      '#dsh-music',                     // 音乐播放器（紧跟在头像卡下面）
      '.dsh-clock-card',                // 现在时间
      '.dsh-visit-card',                // 来访足迹
      '.dsh-countdown-card'             // 倒计时
    ],
    right: [
      '.card-announcement',             // 公告
      '.dsh-quote-card',                // 每日一言
      '.dsh-reward-card',               // 赞助 / 打赏卡
      '.dsh-interactive-card',          // 玩一玩
      '.card-recent-post',              // 最新文章
      '.card-webinfo'                   // 网站信息
    ]
  };

  function find(root, sel) {
    return (root && root.querySelector(sel)) || document.querySelector(sel);
  }

  /* 把 el 按 slot 顺序放进 target。
     slot = 该卡片在 COLUMNS 数组里的下标，用来保证列内顺序与配置一致
     （不能简单 appendChild，否则"播放器放在头像下面"这种要求做不到）。 */
  function placeAt(el, target, slot) {
    if (!el || !target) return false;
    /* 目标位置：跳过已在列里的元素，找到第 slot 个之前插入 */
    var kids = Array.prototype.filter.call(target.children, function (k) { return k !== el; });
    var ref = kids[slot] || null;
    if (el.parentElement === target && el.nextElementSibling === ref) return false;
    target.insertBefore(el, ref);
    return true;
  }

  function build() {
    var inner = document.getElementById('content-inner');
    if (!inner || !inner.classList.contains('dsh-3col')) return;
    var aside = document.getElementById('aside-content');
    if (!aside) return;

    /* 给 body 打标记：音乐播放器靠它决定"常驻卡片"还是"左下角浮层" */
    document.body.classList.add('dsh-three-col');

    /* 1. 确保两个列容器存在。
          ⚠ 关键：列容器必须放在 #aside-content **内部**！
          主题的卡片样式大量写成 `#aside-content .card-widget` 这样的后代选择器，
          卡片一旦被搬到 #aside-content 外面，样式全部失效（实测"最新文章"卡片
          高度从 423px 暴涨到 4242px）。
          配合 CSS 里 #aside-content { display: contents }，
          列的盒子被抹掉，两个列容器就直接成为 #content-inner 网格的项。 */
    var colL = document.getElementById('dsh-col-left');
    var colR = document.getElementById('dsh-col-right');
    if (!colL) {
      colL = document.createElement('div');
      colL.id = 'dsh-col-left';
      aside.insertBefore(colL, aside.firstChild);
    }
    if (!colR) {
      colR = document.createElement('div');
      colR.id = 'dsh-col-right';
      aside.appendChild(colR);
    }

    /* 2. 按配置分配（每次调用都重新扫一遍，新卡片会被补进去）。
          slot 用数组下标，保证列内顺序与 COLUMNS 里写的一致。 */
    var placed = [];
    var assign = function (sels, target) {
      var slot = 0;
      sels.forEach(function (sel) {
        var el = find(aside, sel);
        if (!el || placed.indexOf(el) > -1) { slot++; return; }
        /* 只处理卡片本体，别把列容器自己搬进去 */
        if (el === colL || el === colR) { slot++; return; }
        placed.push(el);
        placeAt(el, target, slot);
        slot++;
      });
    };
    assign(COLUMNS.left, colL);
    assign(COLUMNS.right, colR);

    /* 3. 兜底：侧栏里剩下的孤儿卡片追加到右列末尾，保证不丢
          （.sticky_layout / #dsh-widgets 是包装容器，递归进去看） */
    var scan = function (parent) {
      Array.prototype.slice.call(parent.children).forEach(function (el) {
        if (el === colL || el === colR) return;
        var isWrapper = el.classList.contains('sticky_layout') || el.id === 'dsh-widgets';
        if (isWrapper) { scan(el); return; }
        if (placed.indexOf(el) > -1) return;
        placed.push(el);
        colR.appendChild(el);
      });
    };
    scan(aside);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }

  /* 有些卡片是异步注入的（音乐 / 一言 / 足迹 / 倒计时），补跑几次把它们收进来 */
  [150, 400, 800, 1500, 2500].forEach(function (t) { setTimeout(build, t); });
})();
