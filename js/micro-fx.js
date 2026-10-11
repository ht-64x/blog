// 导航图标 hover 弹跳 + 社交图标旋转（uiverse 风格微交互）
;(function () {
  function init() {
    // 导航菜单项 hover：图标弹跳
    document.querySelectorAll('#nav .menus_item a').forEach(function (a) {
      var icon = a.querySelector('i')
      if (!icon) return
      a.addEventListener('mouseenter', function () {
        if (!window.anime) return
        window.anime.animate(icon, {
          translateY: [0, -7, 0],
          scale: [1, 1.25, 1],
          duration: 500,
          ease: 'outBounce'
        })
      })
    })

    // 侧栏社交图标 hover：旋转 + 缩放
    document.querySelectorAll('.card-info-social-icons .social-icon i, .about-social a i').forEach(function (icon) {
      icon.closest('a, .social-icon').addEventListener('mouseenter', function () {
        if (!window.anime) return
        window.anime.animate(icon, {
          rotate: '1turn',
          scale: [1, 1.3, 1.15],
          duration: 650,
          ease: 'outBack'
        })
      })
    })

    // 文章封面 hover：图片轻微放大 + 亮度提升（CSS 做了，这里加 anime 的入场微弹）
    document.querySelectorAll('#recent-posts .recent-post-item .post_cover img').forEach(function (img) {
      img.closest('a').addEventListener('mouseenter', function () {
        if (!window.anime) return
        window.anime.animate(img, {
          scale: [1, 1.08],
          duration: 450,
          ease: 'outQuad'
        })
      })
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
