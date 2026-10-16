/* ==========================================================================
   统一灯箱配置（Fancybox 5）

   为什么单独抽一个文件：
     本站有 4 处图片需要点击放大，原本各自写了一套 Fancybox 配置：
       1. 文章配图      post-img.js
       2. 相册-生活照    photo-wall.js
       3. 相册-画廊      gallery/wallpaper/index.md 内联脚本
       4. 首页胶片带     photo-wall.js
     结果配置各不相同（有的连中文都没有），改一个地方要改四处。
     现在统一到这里：window.DSH_LIGHTBOX 提供配置和绑定方法，
     各处只要调用 DSH_LIGHTBOX.bind(选择器) 即可。

   用法：
     window.DSH_LIGHTBOX.bind('[data-fancybox="xxx"]')
     window.DSH_LIGHTBOX.ensure()          // 只确保 Fancybox 已加载
   ========================================================================== */
(function () {
  'use strict';

  /* 资源地址：优先本地，CDN 兜底。
     为什么改成本地托管：
       原来只用 jsdelivr CDN，实测遇到过 ERR_CONNECTION_RESET —— 一旦 CDN 抽风，
       全站（文章图 / 生活照 / 画廊 / 胶片带）的图片放大就全部失效。
       本地文件走自己的域名，稳定得多，也少了跨站请求。
     本地路径：/blog/js/vendor/fancybox.umd.js 和 /blog/css/vendor/fancybox.css */
  var LOCAL_JS = '/blog/js/vendor/fancybox.umd.js';
  var LOCAL_CSS = '/blog/css/vendor/fancybox.css';
  var CDN = 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@5/dist/fancybox/';
  var CSS_ID = 'dsh-fancybox-css';
  var JS_ID = 'dsh-fancybox-js';
  var loadedCallbacks = [];

  /* Fancybox 5 的中文字典。
     key 必须和 Fancybox.defaults.l10n 里的一致 ——
     写错不会报错，只是静默显示英文（实测踩过这个坑）。
     下面是从 window.Fancybox.defaults.l10n 实际读出来的 key。 */
  var L10N = {
    CLOSE: '关闭',
    NEXT: '下一张',
    PREV: '上一张',
    MODAL: '用 ← → 浏览，Esc 关闭',
    ERROR: '内容加载失败，请稍后再试',
    IMAGE_ERROR: '图片加载失败',
    ELEMENT_NOT_FOUND: '找不到内容',
    AJAX_NOT_FOUND: '请求失败',
    AJAX_FORBIDDEN: '没有权限',
    IFRAME_ERROR: '页面加载失败',
    ZOOMIN: '放大',
    ZOOMOUT: '缩小',
    TOGGLEZOOM: '切换缩放',
    TOGGLE1TO1: '原始大小',
    ITERATEZOOM: '切换缩放模式',
    ROTATECCW: '向左旋转',
    ROTATECW: '向右旋转',
    FLIPX: '水平翻转',
    FLIPY: '垂直翻转',
    FITX: '适应宽度',
    FITY: '适应高度',
    RESET: '重置',
    TOGGLEFS: '全屏',
    TOGGLE_FULLSCREEN: '全屏',
    TOGGLE_THUMBS: '缩略图',
    TOGGLE_SLIDESHOW: '幻灯片',
    DOWNLOAD: '下载',
    PANUP: '向上平移',
    PANDOWN: '向下平移',
    PANLEFT: '向左平移',
    PANRIGHT: '向右平移'
  };

  /* 统一配置。
     注意 Toolbar.display 必须用对象形式 {left,middle,right}；
     实测数组形式会让按钮全部消失。 */
  var OPTIONS = {
    Carousel: {
      infinite: true,        // 循环浏览：最后一张点下一张回到第一张
      transition: 'slide',
      preload: 2
    },
    Keyboard: {
      Escape: 'close',
      ArrowLeft: 'prev',
      ArrowRight: 'next',
      Delete: null,
      Backspace: null,
      PageUp: 'next',
      PageDown: 'prev'
    },
    Images: { Panzoom: { touch: true } },
    Toolbar: {
      display: {
        left: ['counter'],
        middle: [],
        right: ['zoom', 'fullscreen', 'thumbs', 'close']
      }
    },
    Thumbs: {
      type: 'classic',
      showOnStart: false,
      hideOnClose: true
    },
    l10n: L10N,
    hideScrollbar: false,
    // 打开时提示一次操作方式
    on: {
      ready: function () { hint.show(); setTimeout(hint.place, 60); },
      'Carousel.change': function () { setTimeout(hint.place, 260); },
      close: function () { hint.hide(); }
    }
  };

  /* ---------------- 操作提示条 ---------------- */
  var hint = (function () {
    var el = null, timer = null, shown = false;

    /* 判定「真正的触摸设备」。
       不能只用 'ontouchstart' in window —— 很多桌面 Chromium
       （含无头模式、带触摸屏的笔记本）也会报告支持触摸，
       导致电脑上错误提示"左右滑动"。 */
    function isTouch() {
      try {
        return window.matchMedia('(pointer: coarse)').matches &&
               window.matchMedia('(hover: none)').matches;
      } catch (e) {
        return ('ontouchstart' in window) && window.innerWidth < 820;
      }
    }

    function show() {
      if (shown) return;
      shown = true;
      el = document.createElement('div');
      el.className = 'dsh-lb-hint';
      el.innerHTML = isTouch()
        ? '<i class="fas fa-arrows-alt-h"></i>左右滑动切换 · 双指缩放 · 下拉关闭'
        : '<i class="fas fa-arrows-alt-h"></i>点两侧箭头或用 <kbd>←</kbd> <kbd>→</kbd> 切换 · <kbd>Esc</kbd> 关闭 · 滚轮缩放';
      document.body.appendChild(el);
      requestAnimationFrame(function () { el.classList.add('on'); });
      timer = setTimeout(hide, 5200);
    }

    function hide() {
      if (timer) { clearTimeout(timer); timer = null; }
      if (!el) return;
      var node = el;
      el = null;
      node.classList.remove('on');
      setTimeout(function () {
        if (node.parentNode) node.parentNode.removeChild(node);
      }, 400);
    }

    /* 把提示条挪到图片下方，别压住图片。
       超宽图（如 800x146 截图）在灯箱里只占中间一条，
       固定底部会和图片区域重叠。 */
    function place() {
      if (!el) return;
      var img = document.querySelector('.fancybox__container .fancybox__slide.is-selected img');
      if (!img) { el.style.bottom = '26px'; return; }
      var r = img.getBoundingClientRect();
      var spaceBelow = window.innerHeight - r.bottom;
      el.style.bottom = (spaceBelow > 70 ? Math.max(20, spaceBelow - 56) : 26) + 'px';
    }

    return { show: show, hide: hide, place: place };
  })();

  /* ---------------- 依赖加载 ---------------- */
  function fire() {
    loadedCallbacks.splice(0).forEach(function (f) {
      try { f(); } catch (e) {
        if (window.console) console.warn('[lightbox] 回调出错:', e);
      }
    });
  }

  function ensure(cb) {
    if (cb) loadedCallbacks.push(cb);

    var hasJs = !!document.getElementById(JS_ID);
    var hasCss = !!document.getElementById(CSS_ID);

    if (!hasCss) {
      var css = document.createElement('link');
      css.id = CSS_ID;
      css.rel = 'stylesheet';
      // 本地优先；本地 404 时再退到 CDN
      css.href = LOCAL_CSS;
      css.onerror = function () {
        if (window.console) console.warn('[lightbox] 本地 CSS 缺失，回退 CDN');
        css.href = CDN + 'fancybox.css';
      };
      document.head.appendChild(css);
    }

    if (!hasJs) {
      var js = document.createElement('script');
      js.id = JS_ID;
      js.src = LOCAL_JS;
      js.onload = fire;
      js.onerror = function () {
        // 本地文件缺失（例如没同步 vendor 目录）→ 退回 CDN，功能不中断
        if (window.console) console.warn('[lightbox] 本地 Fancybox 缺失，回退 CDN');
        var fallback = document.createElement('script');
        fallback.src = CDN + 'fancybox.umd.js';
        fallback.onload = fire;
        fallback.onerror = function () {
          if (window.console) console.warn('[lightbox] Fancybox 加载失败，图片放大不可用');
        };
        document.head.appendChild(fallback);
      };
      document.head.appendChild(js);
    } else if (window.Fancybox) {
      // 已加载完成
      setTimeout(fire, 0);
    }
    return hasJs;
  }

  /* ---------------- 绑定 ---------------- */
  function bind(selector, extra) {
    function doBind() {
      if (!window.Fancybox) return;
      var opts = OPTIONS;
      if (extra) {
        // 浅合并，extra 里的同名 key 覆盖默认
        opts = {};
        Object.keys(OPTIONS).forEach(function (k) { opts[k] = OPTIONS[k]; });
        Object.keys(extra).forEach(function (k) { opts[k] = extra[k]; });
      }
      try {
        window.Fancybox.bind(selector, opts);
      } catch (e) {
        if (window.console) console.warn('[lightbox] 绑定失败:', selector, e);
      }
    }

    if (window.Fancybox) doBind();
    else ensure(doBind);
  }

  /* ---------------- 对外接口 ---------------- */
  window.DSH_LIGHTBOX = {
    ensure: ensure,
    bind: bind,
    options: OPTIONS,
    l10n: L10N,
    CDN: CDN
  };
})();
