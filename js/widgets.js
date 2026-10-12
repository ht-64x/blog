// 互动小组件：注入侧边栏（时钟卡、一言卡、互动按钮组）
;(function () {
  function init() {
    var aside = document.getElementById('aside-content')
    if (!aside || document.getElementById('dsh-widgets')) return

    var wrap = document.createElement('div')
    wrap.id = 'dsh-widgets'
    wrap.innerHTML =
      // ---- 时钟卡 ----
      '<div class="card-widget dsh-clock-card">' +
      '<div class="dsh-clock-headline"><i class="fas fa-clock"></i> 现在时间</div>' +
      '<div class="dsh-clock-time">--:--:--</div>' +
      '<div class="dsh-clock-date">----</div>' +
      '<div class="dsh-clock-lunar"></div>' +
      '</div>' +

      // ---- 一言卡（官方 API，免费） ----
      '<div class="card-widget dsh-quote-card">' +
      '<div class="dsh-clock-headline"><i class="fas fa-feather"></i> 每日一言</div>' +
      '<div class="dsh-quote-text">加载中…</div>' +
      '<button class="dsh-quote-refresh" title="换一句"><i class="fas fa-rotate"></i></button>' +
      '</div>' +

      // ---- 互动按钮组 ----
      '<div class="card-widget dsh-interactive-card">' +
      '<div class="dsh-clock-headline"><i class="fas fa-gamepad"></i> 玩一玩</div>' +
      '<div class="dsh-fun-grid">' +
      '<button class="dsh-fun-btn" data-fn="confetti" title="撒花"><i class="fas fa-champagne-glasses"></i><span>撒花</span></button>' +
      '<button class="dsh-fun-btn" data-fn="petal-storm" title="花瓣雨"><i class="fas fa-fan"></i><span>花瓣雨</span></button>' +
      '<button class="dsh-fun-btn" data-fn="pet-dance" title="让桌宠跳舞"><i class="fas fa-music"></i><span>桌宠舞</span></button>' +
      '<button class="dsh-fun-btn" data-fn="shake" title="抖动页面"><i class="fas fa-earthquake"></i><span>摇一摇</span></button>' +
      '</div>' +
      '</div>'


    // ---- 打赏入口（折叠：点击弹出收款码） ----
    var reward = document.createElement('div')
    reward.className = 'card-widget dsh-reward-card'
    reward.innerHTML =
      '<div class="dsh-reward-head" onclick="this.parentNode.classList.toggle(''open'')">' +
      '<i class="fas fa-mug-hot"></i><span>请寒塘喝一杯</span><i class="fas fa-angle-down dsh-reward-arrow"></i></div>' +
      '<div class="dsh-reward-body">' +
      '<img class="dsh-reward-qr" src="/blog/images/reward/alipay.jpg" alt="支付宝收款码" loading="lazy">' +
      '<div class="dsh-reward-tip">资源帮到你了？可以请我喝杯饮料 ☕</div></div>'
    var sticky = aside.querySelector('.sticky_layout')
    if (sticky) {
      sticky.appendChild(wrap)
      sticky.appendChild(reward)
    } else {
      aside.appendChild(wrap)
      aside.appendChild(reward)
    }

    // ============ 时钟 ============
    var timeEl = wrap.querySelector('.dsh-clock-time')
    var dateEl = wrap.querySelector('.dsh-clock-date')
    var week = ['日', '一', '二', '三', '四', '五', '六']
    function tick() {
      var d = new Date()
      timeEl.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
      dateEl.textContent = (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日 · 星期' + week[d.getDay()]
    }
    function pad(n) { return n < 10 ? '0' + n : n }
    tick()
    setInterval(tick, 1000)

    // ============ 一言 ============
    var quoteEl = wrap.querySelector('.dsh-quote-text')
    function loadQuote() {
      quoteEl.textContent = '加载中…'
      fetch('https://v1.hitokoto.cn/?encode=json&c=a&c=b&c=i')
        .then(function (r) { return r.json() })
        .then(function (data) {
          quoteEl.textContent = '「' + data.hitokoto + '」'
        })
        .catch(function () {
          quoteEl.textContent = '「今天也是元气满满的一天！」'
        })
    }
    loadQuote()
    wrap.querySelector('.dsh-quote-refresh').addEventListener('click', loadQuote)

    // ============ 互动按钮 ============
    wrap.querySelectorAll('.dsh-fun-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var fn = btn.getAttribute('data-fn')
        if (fn === 'confetti') confetti()
        else if (fn === 'petal-storm') petalStorm()
        else if (fn === 'pet-dance') petDance()
        else if (fn === 'shake') shakePage()
      })
    })

    // 撒花
    function confetti() {
      var colors = ['#ffb7c5', '#9fc3e8', '#ffe4a3', '#c5f0d0', '#e8c5f0']
      for (var i = 0; i < 36; i++) {
        ;(function (i) {
          setTimeout(function () {
            var el = document.createElement('span')
            el.className = 'dsh-confetti'
            el.style.left = (10 + Math.random() * 80) + 'vw'
            el.style.background = colors[i % colors.length]
            document.body.appendChild(el)
            var animeRef = window.anime
            if (animeRef) {
              animeRef.animate(el, {
                translateY: [-20, window.innerHeight + 40],
                translateX: function () { return (Math.random() - 0.5) * 160 },
                rotate: Math.random() * 720,
                duration: 2200 + Math.random() * 1200,
                ease: 'inQuad',
                onComplete: function () { el.remove() }
              })
            } else {
              setTimeout(function () { el.remove() }, 2500)
            }
          }, i * 45)
        })(i)
      }
    }

    // 花瓣雨（爆发一批落花）
    function petalStorm() {
      var colors = ['#ffb7c5', '#ffd8e1', '#f4a4b4', '#ffe4ea']
      for (var i = 0; i < 26; i++) {
        ;(function (i) {
          setTimeout(function () {
            var el = document.createElement('span')
            el.className = 'dsh-confetti dsh-petal-shape'
            el.style.left = (Math.random() * 100) + 'vw'
            el.style.background = colors[i % colors.length]
            document.body.appendChild(el)
            var animeRef = window.anime
            if (animeRef) {
              animeRef.animate(el, {
                translateY: [-30, window.innerHeight + 40],
                translateX: function () { return (Math.random() - 0.5) * 260 },
                rotate: Math.random() * 540,
                duration: 3000 + Math.random() * 1800,
                ease: 'inQuad',
                onComplete: function () { el.remove() }
              })
            } else {
              setTimeout(function () { el.remove() }, 3500)
            }
          }, i * 60)
        })(i)
      }
    }

    // 桌宠跳舞（触发桌宠挥手 + 弹跳）
    function petDance() {
      var pet = document.getElementById('dsh-pet')
      if (!pet) return
      var img = pet.querySelector('.dsh-pet-img')
      var petSrc = img.src
      // 挥手动画
      img.src = '/blog/pet/big-blue-whale-waving.gif?t=' + Date.now()
      if (window.anime) {
        window.anime.animate(pet, {
          translateY: [0, -18, 0, -12, 0],
          rotate: [0, -6, 6, -4, 0],
          duration: 1400,
          ease: 'inOutSine'
        })
      }
      setTimeout(function () { img.src = petSrc }, 1800)
    }

    // 抖动页面
    function shakePage() {
      var body = document.getElementById('body-wrap') || document.body
      if (window.anime) {
        window.anime.animate(body, {
          translateX: [0, -9, 8, -6, 5, -3, 0],
          duration: 520,
          ease: 'outQuad'
        })
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
