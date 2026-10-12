// 来访足迹 + 倒计时卡 + 阅读进度条（互不依赖，可独立删除）
;(function () {
  // ============ 2. 来访足迹（localStorage 记录连续/累计来访） ============
  function visitTrack() {
    var aside = document.getElementById('aside-content')
    if (!aside) return
    var sticky = aside.querySelector('.sticky_layout')
    var mount = sticky || aside

    var card = document.createElement('div')
    card.className = 'card-widget dsh-visit-card'
    card.innerHTML =
      '<div class="dsh-clock-headline"><i class="fas fa-fire"></i> 来访足迹</div>' +
      '<div class="dsh-visit-num"><span class="n-streak">1</span> 天 <span class="n-badge">🔥</span></div>' +
      '<div class="dsh-visit-sub">累计来访 <span class="n-total">1</span> 次 · 欢迎常来</div>'
    mount.insertBefore(card, mount.firstChild)

    // 计算
    var today = new Date()
    var key = function (d) {
      return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
    }
    var todayKey = key(today)
    var yesterday = new Date(today.getTime() - 86400000)
    var yesterdayKey = key(yesterday)

    var data = {}
    try { data = JSON.parse(localStorage.getItem('dsh-visit') || '{}') } catch (e) {}
    var streak = data.streak || 0
    var total = data.total || 0
    var last = data.last || ''

    if (last === todayKey) {
      // 今天已经来过，数据不变
    } else if (last === yesterdayKey) {
      streak += 1
      total += 1
    } else {
      streak = 1
      total += 1
    }
    data = { streak: streak, total: total, last: todayKey }
    try { localStorage.setItem('dsh-visit', JSON.stringify(data)) } catch (e) {}

    card.querySelector('.n-streak').textContent = streak
    card.querySelector('.n-total').textContent = total
    var sub = card.querySelector('.dsh-visit-sub')
    if (streak >= 7) sub.textContent = '连续 ' + streak + ' 天 · 老熟人了！'
    else if (streak >= 3) sub.textContent = '连续 ' + streak + ' 天 · 越来越熟了'
    else sub.textContent = '累计来访 ' + total + ' 次 · 欢迎常来'
  }

  // ============ 4. 倒计时卡（配置在 DSH_COUNTDOWN，日期可加多个） ============
  var DSH_COUNTDOWN = [
    { name: '寒假', date: '2027-01-18' },
    { name: '除夕', date: '2027-02-05' }
    // ← 加倒计时照上面格式添加一行
  ]
  function countdownCard() {
    var aside = document.getElementById('aside-content')
    if (!aside) return
    var sticky = aside.querySelector('.sticky_layout')
    var mount = sticky || aside
    if (!DSH_COUNTDOWN.length) return

    var card = document.createElement('div')
    card.className = 'card-widget dsh-countdown-card'
    var inner = '<div class="dsh-clock-headline"><i class="fas fa-hourglass-half"></i> 倒计时</div>'
    var today = new Date(); today.setHours(0, 0, 0, 0)
    var items = DSH_COUNTDOWN.map(function (cd) {
      var target = new Date(cd.date + 'T00:00:00')
      var days = Math.ceil((target - today) / 86400000)
      var label = days > 0 ? days + ' 天' : days === 0 ? '就是今天！' : '已过去 ' + (-days) + ' 天'
      return '<div class="dsh-cd-item"><span class="dsh-cd-name">' + cd.name + '</span><span class="dsh-cd-days">' + label + '</span></div>'
    }).join('')
    card.innerHTML = inner + items
    mount.insertBefore(card, mount.firstChild)
  }

  // ============ 5. 阅读进度条（文章页顶部） ============
  function readProgress() {
    if (!document.getElementById('article-container')) return
    var bar = document.createElement('div')
    bar.id = 'dsh-read-progress'
    document.body.appendChild(bar)
    var fill = document.createElement('div')
    fill.className = 'dsh-read-fill'
    bar.appendChild(fill)

    function update() {
      var el = document.getElementById('article-container')
      if (!el) return
      var rect = el.getBoundingClientRect()
      var total = rect.height - window.innerHeight
      var passed = Math.min(Math.max(-rect.top, 0), total)
      var pct = total > 0 ? (passed / total) * 100 : 0
      fill.style.width = pct + '%'
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      visitTrack(); countdownCard(); readProgress()
    })
  } else {
    visitTrack(); countdownCard(); readProgress()
  }
})()
