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

     分配原则：左右两列高度尽量接近，且都接近中列（文章）的高度。

     ⚠ 音乐播放器必须排第一位。
     实测：左列从 y≈732 开始、视口高 900，头像卡 h=376，
     播放器排在它后面就落到 y=1128 —— 首屏完全看不见，
     要往下滚才找得到，用户感觉就是"播放器偶尔失灵"。
     放第一位后 y≈732，首屏内可见可点。 */
  var COLUMNS = {
    left: [
      '#dsh-music',                     // 音乐播放器（首位，保证首屏可见）
      '.card-info',                     // 头像 / 作者卡
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

  /* 三列布局的生效断点（和 three-col.css 里的 @media 保持一致） */
  var MIN_WIDTH = 1100;

  /* 当前是否真的处于三列布局。
     为什么需要这个判断：
       CSS 里三列只在 ≥1100px 时生效，但 JS 之前是无条件把音乐播放器
       搬进左列的。结果在手机/窄屏首页，左列是堆叠在页面最底部的，
       播放器被一起带到 y=3763 的位置（实测），用户根本找不到，
       表现就是"音乐播放器偶尔失灵"——首页找不到，文章页却正常。
     所以：只有宽屏（三列真生效）才放进左列；窄屏保持 fixed 浮层。 */
  function isWide() {
    return window.innerWidth >= MIN_WIDTH;
  }

  function build() {
    var inner = document.getElementById('content-inner');
    if (!inner || !inner.classList.contains('dsh-3col')) return;
    var aside = document.getElementById('aside-content');
    if (!aside) return;

    /* body 标记同样只在宽屏加 —— 音乐播放器靠它决定
       "常驻卡片"（static，在左列里）还是"左下角浮层"（fixed） */
    document.body.classList.toggle('dsh-three-col', isWide());

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

    /* 2. 窄屏时把音乐播放器挪回 body。
          三列布局在窄屏不生效，左列会被堆到页面最底部，
          播放器留在里面就会跑到 y=3700 那种位置（用户找不到）。
          挪回 body 后，CSS 的 body:not(.dsh-three-col) 规则
          会让它变成左下角 fixed 浮层。 */
    if (!isWide()) {
      var music = document.getElementById('dsh-music');
      if (music && music.parentElement !== document.body) {
        document.body.appendChild(music);
      }
    }

    /* 3. 按配置分配（每次调用都重新扫一遍，新卡片会被补进去）。
          slot 用数组下标，保证列内顺序与 COLUMNS 里写的一致。 */
    var placed = [];
    var assign = function (sels, target) {
      var slot = 0;
      sels.forEach(function (sel) {
        var el = find(aside, sel);
        if (!el || placed.indexOf(el) > -1) { slot++; return; }
        /* 只处理卡片本体，别把列容器自己搬进去 */
        if (el === colL || el === colR) { slot++; return; }
        /* 窄屏时音乐播放器不进左列（它要走 fixed 浮层） */
        if (!isWide() && el.id === 'dsh-music') { slot++; return; }
        placed.push(el);
        placeAt(el, target, slot);
        slot++;
      });
    };
    assign(COLUMNS.left, colL);
    assign(COLUMNS.right, colR);

    /* 4. 兜底：侧栏里剩下的孤儿卡片追加到右列末尾，保证不丢
          （.sticky_layout / #dsh-widgets 是包装容器，递归进去看） */
    var scan = function (parent) {
      Array.prototype.slice.call(parent.children).forEach(function (el) {
        if (el === colL || el === colR) return;
        if (!isWide() && el.id === 'dsh-music') return;
        var isWrapper = el.classList.contains('sticky_layout') || el.id === 'dsh-widgets';
        if (isWrapper) { scan(el); return; }
        if (placed.indexOf(el) > -1) return;
        placed.push(el);
        colR.appendChild(el);
      });
    };
    scan(aside);
  }

  /* 窗口尺寸变化时重新计算：
     宽 → 窄 要把播放器挪出左列；窄 → 宽 再放回去。 */
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 200);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }

  /* 有些卡片是异步注入的（音乐 / 一言 / 足迹 / 倒计时），补跑几次把它们收进来 */
  [150, 400, 800, 1500, 2500].forEach(function (t) { setTimeout(build, t); });
})();
