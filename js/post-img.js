// 文章图片增强：圆角 + 居中限宽 + 点击放大
//
// 灯箱的具体配置统一在 /blog/js/lightbox.js 里（中文界面、左右切换、
// 缩略图导航、键盘 ← → 、触摸滑动）。本文件只负责：
//   1. 把正文里的 <img> 包装成可点击的链接
//   2. 调用统一灯箱绑定
//   3. 跳过太小的图（表情、图标）
;(function () {
  var GROUP = 'post'

  // ---------- 给图片套上链接 ----------
  function wrapImages() {
    var imgs = document.querySelectorAll(
      '#article-container img:not(.no-lightbox):not([data-dsh-wrapped])'
    )
    Array.prototype.forEach.call(imgs, function (img) {
      // 已经在链接里的（比如手工写的 <a><img></a>）不重复包装
      if (img.closest('a')) return
      // 太小的图（表情、图标）不参与灯箱
      if (img.naturalWidth && img.naturalWidth < 120) return

      var src = img.currentSrc || img.src
      if (!src) return

      var a = document.createElement('a')
      a.href = src
      a.setAttribute('data-fancybox', GROUP)
      a.setAttribute('data-caption', img.alt || '')
      a.setAttribute('data-dsh-wrapped', '1')
      a.setAttribute('title', '点击放大 · 可用 ← → 切换')
      a.style.display = 'block'
      a.style.cursor = 'zoom-in'

      img.parentNode.insertBefore(a, img)
      a.appendChild(img)
    })
  }

  // ---------- 绑定 ----------
  function bindLightbox() {
    if (window.DSH_LIGHTBOX && window.DSH_LIGHTBOX.bind) {
      window.DSH_LIGHTBOX.bind('[data-fancybox="' + GROUP + '"]')
      return
    }
    // 兜底：lightbox.js 未加载时，至少保证能放大（功能降级但不失效）
    if (window.Fancybox) {
      window.Fancybox.bind('[data-fancybox="' + GROUP + '"]', { hideScrollbar: false })
    }
  }

  // ---------- 启动 ----------
  function start() {
    wrapImages()
    bindLightbox()
    // 图片是懒加载的，过一会再包一次，确保都覆盖到
    setTimeout(wrapImages, 2500)
    setTimeout(wrapImages, 6000)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start)
  } else {
    start()
  }
})()
