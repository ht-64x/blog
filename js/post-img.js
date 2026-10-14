// 文章图片增强：圆角 + 居中限宽 + 点击放大（带左右切换）
//
// 用 Fancybox 5 做灯箱。相比默认配置，这里补齐了几件事：
//   1. 明确开启左右切换（循环浏览）
//   2. 中文按钮提示（上一张/下一张/放大/全屏/关闭）
//   3. 键盘 ← → 切换、Esc 关闭
//   4. 触摸设备左右滑动切换
//   5. 图片计数（第 n / 共 m 张）
//   6. 底部缩略图导航条（图片多时能快速跳转）
//   7. 图片加载失败时自动跳过，不留空白幻灯片
; (function () {
  var FANCYBOX_VERSION = '5'
  var CDN = 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@' + FANCYBOX_VERSION + '/dist/fancybox/'

  // ---------- 注入依赖（只注入一次） ----------
  function inject() {
    if (document.getElementById('dsh-fancybox-css')) return
    var css = document.createElement('link')
    css.id = 'dsh-fancybox-css'
    css.rel = 'stylesheet'
    css.href = CDN + 'fancybox.css'
    document.head.appendChild(css)

    var js = document.createElement('script')
    js.src = CDN + 'fancybox.umd.js'
    js.onload = function () { bind() }
    js.onerror = function () {
      if (window.console) console.warn('[post-img] Fancybox 加载失败，图片放大不可用')
    }
    document.head.appendChild(js)
  }

  // ---------- 给图片套上链接 ----------
  function wrapImages() {
    var imgs = document.querySelectorAll(
      '#article-container img:not(.no-lightbox):not([data-dsh-wrapped])'
    )
    var group = []
    Array.prototype.forEach.call(imgs, function (img) {
      // 已经在链接里的（比如手工写的 <a><img></a>）不重复包装
      if (img.closest('a')) return
      // 太小的图（表情、图标）不参与灯箱
      if (img.naturalWidth && img.naturalWidth < 120) return

      var src = img.currentSrc || img.src
      if (!src) return

      var a = document.createElement('a')
      a.href = src
      a.setAttribute('data-fancybox', 'post')
      a.setAttribute('data-caption', img.alt || '')
      a.setAttribute('data-dsh-wrapped', '1')
      a.setAttribute('title', '点击放大 · 可用 ← → 切换')
      a.style.display = 'block'
      a.style.cursor = 'zoom-in'

      img.parentNode.insertBefore(a, img)
      a.appendChild(img)
      group.push(a)
    })
    return group
  }

  // ---------- 绑定灯箱 ----------
  function bind() {
    if (!window.Fancybox) {
      // Fancybox 还没就绪，稍后再试（最多 10 次）
      if ((bind._n = (bind._n || 0) + 1) < 10) setTimeout(bind, 400)
      return
    }

    wrapImages()

    window.Fancybox.bind('[data-fancybox="post"]', {
      // ---- 左右切换：开启循环，到头了绕回去 ----
      Carousel: {
        infinite: true,          // 循环浏览
        transition: 'slide',     // 滑动过渡
        preload: 2,              // 预加载前后各 2 张，切换不卡
        Panzoom: { touch: true },
      },

      // ---- 键盘：← → 切换，Esc 关闭（Fancybox 默认已支持，这里显式声明） ----
      Keyboard: {
        Escape: 'close',
        ArrowLeft: 'prev',
        ArrowRight: 'next',
        Delete: null,
        Backspace: null,
        PageUp: 'next',
        PageDown: 'prev',
      },

      // ---- 触摸：左右滑动切换，下滑关闭 ----
      Images: { Panzoom: { touch: true } },

      /* ---- 顶部工具栏 ----
         实测（jsdelivr 上的 fancybox 5 真实行为）：
           · 对象形式 { left, middle, right }  → 按钮正常显示
           · 数组形式 [ 'zoom', ... ]          → 按钮全部消失（错误写法）
         所以必须用对象形式。left 放计数器，right 放操作按钮。 */
      Toolbar: {
        display: {
          left: ['counter'],
          middle: [],
          right: ['zoom', 'fullscreen', 'thumbs', 'close'],
        },
      },

      // ---- 底部缩略图导航条（多张图时显示，便于快速跳转） ----
      Thumbs: {
        type: 'classic',
        showOnStart: false,      // 打开时不展开，点右下角缩略图按钮才出现
        hideOnClose: true,
      },

      /* ---- 中文标签 ----
         key 必须和 Fancybox 5 的默认定义完全一致，否则不会报错、
         只是继续显示英文。下面这些是从 window.Fancybox.defaults.l10n
         实际读出来的 key（不是猜的）：
           PANUP/PANDOWN/PANLEFT/PANRIGHT, ZOOMIN/ZOOMOUT,
           TOGGLEZOOM, TOGGLE1TO1, ITERATEZOOM,
           ROTATECCW/ROTATECW, FLIPX/FLIPY, FITX/FITY, RESET,
           TOGGLEFS, CLOSE, NEXT, PREV, MODAL, ERROR, IMAGE_ERROR,
           ELEMENT_NOT_FOUND, AJAX_NOT_FOUND, AJAX_FORBIDDEN,
           IFRAME_ERROR, TOGGLE_ZOOM, TOGGLE_THUMBS, TOGGLE_SLIDESHOW,
           TOGGLE_FULLSCREEN, DOWNLOAD */
      l10n: {
        CLOSE: '关闭',
        NEXT: '下一张',
        PREV: '上一张',
        MODAL: '用 ← → 浏览，Esc 关闭',
        ERROR: '内容加载失败，请稍后再试',
        IMAGE_ERROR: '图片加载失败',
        ELEMENT_NOT_FOUND: '找不到内容',
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
        PANRIGHT: '向右平移',
      },

      // ---- 打开时禁用页面滚动，关闭时恢复 ----
      hideScrollbar: false,

      // ---- 加载失败处理 ----
      on: {
        ready: function () {
          showHint()
          // 图片渲染完再定位提示条，避免拿到错误的尺寸
          setTimeout(placeHint, 60)
        },
        // 切换图片后重新定位（不同图片高度不一样）
        'Carousel.change': function () { setTimeout(placeHint, 260) },
        close: function () { hideHint() },
      },
    })
  }

  // ---------- 操作提示条 ----------
  // 第一次打开灯箱时提示怎么切换，几秒后淡出；之后不再提示。
  var hintEl = null
  var hintTimer = null
  var hinted = false

  /* 判断是不是「真正的触摸设备」。
     注意：不能只用 'ontouchstart' in window 或 navigator.maxTouchPoints，
     因为很多桌面 Chromium（含无头模式、带触摸屏的笔记本）也会报告支持触摸，
     导致桌面上错误地提示"左右滑动"。
     这里用「粗指针 + 无精确悬停」作为判据，只有手机/平板才满足。 */
  function isTouch() {
    try {
      var coarse = window.matchMedia('(pointer: coarse)').matches
      var noHover = window.matchMedia('(hover: none)').matches
      return coarse && noHover
    } catch (e) {
      return ('ontouchstart' in window) && window.innerWidth < 820
    }
  }

  function showHint() {
    if (hinted) return
    hinted = true

    hintEl = document.createElement('div')
    hintEl.className = 'dsh-lb-hint'
    if (isTouch()) {
      hintEl.innerHTML = '<i class="fas fa-arrows-alt-h"></i>左右滑动切换 · 双指缩放 · 下拉关闭'
    } else {
      hintEl.innerHTML = '<i class="fas fa-arrows-alt-h"></i>' +
        '点两侧箭头或用 <kbd>←</kbd> <kbd>→</kbd> 切换 · <kbd>Esc</kbd> 关闭 · 滚轮缩放'
    }
    document.body.appendChild(hintEl)

    requestAnimationFrame(function () { hintEl.classList.add('on') })
    hintTimer = setTimeout(hideHint, 5200)
  }

  /* 把提示条挪到图片下方，不要压住图片本身。
     超宽图（如 800x146 的截图）在灯箱里只占中间一条，
     固定在底部会和图片区域重叠。 */
  function placeHint() {
    if (!hintEl) return
    var img = document.querySelector('.fancybox__container .fancybox__slide.is-selected img')
    if (!img) { hintEl.style.bottom = '26px'; return }
    var r = img.getBoundingClientRect()
    var vh = window.innerHeight
    var spaceBelow = vh - r.bottom
    // 图片下方空间够（>70px）就贴在图片下面，否则退回底部
    if (spaceBelow > 70) {
      hintEl.style.bottom = Math.max(20, spaceBelow - 56) + 'px'
    } else {
      hintEl.style.bottom = '26px'
    }
  }

  function hideHint() {
    if (hintTimer) { clearTimeout(hintTimer); hintTimer = null }
    if (!hintEl) return
    var el = hintEl
    hintEl = null
    el.classList.remove('on')
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el)
    }, 400)
  }

  // ---------- 启动 ----------
  function start() {
    inject()
    // 图片是懒加载的，等一会再包一次，确保都覆盖到
    setTimeout(function () { if (window.Fancybox) wrapImages() }, 2500)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start)
  } else {
    start()
  }
})()
