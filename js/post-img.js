// 文章图片布局增强：圆角 + 居中限宽 + 点击放大
;(function () {
  // 注入 Fancybox 资源（CDN，懒加载一次）
  function inject() {
    if (document.getElementById('dsh-fancybox-css')) return
    var css = document.createElement('link')
    css.id = 'dsh-fancybox-css'
    css.rel = 'stylesheet'
    css.href = 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@5/dist/fancybox/fancybox.css'
    document.head.appendChild(css)

    var js = document.createElement('script')
    js.src = 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@5/dist/fancybox/fancybox.umd.js'
    js.onload = function () { bind() }
    document.head.appendChild(js)
  }

  function bind() {
    if (!window.Fancybox) return
    // 文章内所有图片绑定灯箱（排除表情小图）
    document.querySelectorAll('#article-container img:not(.no-lightbox)').forEach(function (img) {
      if (img.closest('a')) return
      var a = document.createElement('a')
      a.href = img.src
      a.setAttribute('data-fancybox', 'post')
      a.setAttribute('data-caption', img.alt || '')
      img.parentNode.insertBefore(a, img)
      a.appendChild(img)
    })
    Fancybox.bind('[data-fancybox="post"]', {})
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject)
  } else {
    inject()
  }
})()
