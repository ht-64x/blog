// 前端互动增强（参考 React Bits / Aceternity UI / anime.js 官方示例的实现思路）
// 1. 卡片聚光灯（鼠标跟随径向高光）
// 2. 文章卡片 3D 倾斜
// 3. 点击冒花瓣心
// 4. 标题文字逐字入场
// 5. 滚动淡入
;(function () {
  function init() {
    // ============ 1. Aceternity 风格：卡片聚光灯 ============
    // 鼠标位置写入 CSS 变量，卡片上显示跟随的径向光晕
    document.querySelectorAll('#recent-posts .recent-post-item, #aside-content .card-widget').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect()
        card.style.setProperty('--spot-x', (e.clientX - rect.left) + 'px')
        card.style.setProperty('--spot-y', (e.clientY - rect.top) + 'px')
      })
    })

    // ============ 2. 文章卡片 3D 倾斜（React Bits hover 效果） ============
    var tiltCards = document.querySelectorAll('#recent-posts .recent-post-item')
    tiltCards.forEach(function (card) {
      var raf = null
      card.addEventListener('mousemove', function (e) {
        if (raf) return
        raf = requestAnimationFrame(function () {
          raf = null
          var rect = card.getBoundingClientRect()
          var px = (e.clientX - rect.left) / rect.width - 0.5
          var py = (e.clientY - rect.top) / rect.height - 0.5
          card.style.transform = 'perspective(900px) rotateX(' + (-py * 4) + 'deg) rotateY(' + (px * 5) + 'deg) translateY(-3px)'
        })
      })
      card.addEventListener('mouseleave', function () {
        card.style.transform = ''
      })
    })

    // ============ 3. 点击冒花瓣（增强版点击反馈） ============
    var CLICK_COLORS = ['#ffb7c5', '#ffd8e1', '#f4a4b4', '#ffe4ea', '#9fc3e8']
    document.addEventListener('click', function (e) {
      // 忽略输入框里的点击
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return
      for (var i = 0; i < 6; i++) {
        spawnClickPetal(e.clientX, e.clientY, CLICK_COLORS[i % CLICK_COLORS.length])
      }
    })

    function spawnClickPetal(x, y, color) {
      var el = document.createElement('span')
      el.className = 'dsh-click-petal'
      el.style.left = x + 'px'
      el.style.top = y + 'px'
      el.style.background = color
      document.body.appendChild(el)

      var ang = Math.random() * Math.PI * 2
      var dist = 30 + Math.random() * 50
      var dx = Math.cos(ang) * dist
      var dy = Math.sin(ang) * dist - 25

      // anime.js v4 全局名为 anime
      if (window.anime) {
        window.anime.animate(el, {
          translateX: dx,
          translateY: dy,
          rotate: (Math.random() - 0.5) * 260,
          scale: [1, 0.3],
          opacity: [1, 0],
          duration: 750,
          ease: 'outQuad',
          onComplete: function () { el.remove() }
        })
      } else {
        setTimeout(function () { el.remove() }, 700)
      }
    }

    // ============ 4. 首页标题逐字入场（React Bits SplitText 风格） ============
    var siteTitle = document.getElementById('site-title')
    if (siteTitle && window.anime) {
      var text = siteTitle.textContent
      siteTitle.innerHTML = text.split('').map(function (ch) {
        return '<span class="dsh-title-char" style="display:inline-block">' + (ch === ' ' ? '&nbsp;' : ch) + '</span>'
      }).join('')
      window.anime.animate('.dsh-title-char', {
        translateY: [40, 0],
        opacity: [0, 1],
        scale: [0.7, 1],
        duration: 700,
        delay: function (_, i) { return 80 + i * 70 },
        ease: 'outBack'
      })
    }

    // ============ 5. 卡片滚动淡入（一次性，性能友好） ============
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('dsh-revealed')
            if (window.anime) {
              window.anime.animate(entry.target, {
                translateY: [26, 0],
                opacity: [0, 1],
                duration: 620,
                ease: 'outCubic'
              })
            }
            io.unobserve(entry.target)
          }
        })
      }, { threshold: 0.08 })
      document.querySelectorAll('#recent-posts .recent-post-item, #aside-content .card-widget').forEach(function (el) {
        el.classList.add('dsh-reveal')
        io.observe(el)
      })
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
