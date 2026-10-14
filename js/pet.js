// 桌宠：蓝鲸娘（GIF 版）
// 行为：待机 -> 随机张望/等待 -> 偶尔挥手；可拖拽；点击有反应；双击隐藏
;(function () {
  var PET_DIR = '/blog/pet/'
  var GIF = {
    idle: 'big-blue-whale-idle.gif',
    waiting: 'big-blue-whale-waiting.gif',
    lookLeft: 'big-blue-whale-look-left-side.gif',
    lookRight: 'big-blue-whale-look-right-side.gif',
    waving: 'big-blue-whale-waving.gif',
    jumping: 'big-blue-whale-jumping.gif',
    running: 'big-blue-whale-running.gif',
    runningLeft: 'big-blue-whale-running-left.gif',
    runningRight: 'big-blue-whale-running-right.gif',
    review: 'big-blue-whale-review.gif',
    failed: 'big-blue-whale-failed.gif'
  }

  function init() {
    if (document.getElementById('dsh-pet')) return
    // 手机端也显示（缩小尺寸由 CSS 控制）

    var pet = document.createElement('div')
    pet.id = 'dsh-pet'
    pet.innerHTML =
      '<img class="dsh-pet-img" src="' + PET_DIR + GIF.idle + '" alt="pet" draggable="false">' +
      '<div class="dsh-pet-bubble">你好呀～</div>'
    document.body.appendChild(pet)

    var img = pet.querySelector('.dsh-pet-img')
    var bubble = pet.querySelector('.dsh-pet-bubble')
    var curGif = ''

    /* 切换 GIF 状态。
       这里刻意【不加】?t= 时间戳 —— 加了会让浏览器每次都重新下载，
       实测同一张 GIF 被下载 5 次（190KB）。
       GIF 只要 src 变了就会从头播放，不换 src 时用缓存即可。
       如果将来发现某张 GIF 没重新播放（浏览器缓存了动画进度），
       再对该张单独加时间戳。 */
    function play(name) {
      if (curGif === name) return
      curGif = name
      img.src = PET_DIR + GIF[name]
    }

    /* 空闲时预加载其它 GIF，避免切换时卡一下（不占首屏带宽） */
    function preload() {
      Object.keys(GIF).forEach(function (k) {
        if (k === 'idle') return
        var i = new Image()
        i.src = PET_DIR + GIF[k]
      })
    }
    if (document.readyState === 'complete') setTimeout(preload, 1500)
    else window.addEventListener('load', function () { setTimeout(preload, 1500) }, { once: true })

    var lines = [
      '咕噜咕噜～',
      '今天也要加油鸭！',
      '要点一首歌吗？',
      '陪我看会儿海吧～',
      '拖我可以把我拖到任何地方！'
    ]

    function say(text, duration) {
      bubble.textContent = text
      bubble.classList.add('show')
      setTimeout(function () { bubble.classList.remove('show') }, duration || 2200)
    }

    // ---- 行为循环：待机中随机小动作 ----
    var behaviorTimer = null
    function scheduleNext() {
      clearTimeout(behaviorTimer)
      behaviorTimer = setTimeout(function () {
        var r = Math.random()
        if (r < 0.35) {
          play('lookLeft')
          setTimeout(function () { backToIdle() }, 2600)
        } else if (r < 0.7) {
          play('lookRight')
          setTimeout(function () { backToIdle() }, 2600)
        } else if (r < 0.85) {
          play('waiting')
          setTimeout(function () { backToIdle() }, 3200)
        } else {
          play('waving')
          say(lines[(Math.random() * lines.length) | 0])
          setTimeout(function () { backToIdle() }, 2800)
        }
      }, 5000 + Math.random() * 6000)
    }
    function backToIdle() {
      play('idle')
      scheduleNext()
    }
    scheduleNext()

    // ---- 点击互动：跳一下 ----
    pet.addEventListener('click', function () {
      if (dragMoved) return
      clearTimeout(behaviorTimer)
      play('jumping')
      say(lines[(Math.random() * lines.length) | 0])
      setTimeout(function () { backToIdle() }, 2000)
    })

    // 拖拽结束瞬间抑制 click 误触发（拖拽松手后短时间内不再响应点击）

    // ---- 拖拽 ----
    var dragging = false, dragMoved = false, offsetX = 0, offsetY = 0
    pet.addEventListener('mousedown', function (e) {
      dragging = true
      dragMoved = false
      var rect = pet.getBoundingClientRect()
      offsetX = e.clientX - rect.left
      offsetY = e.clientY - rect.top
      e.preventDefault()
    })
    document.addEventListener('mousemove', function (e) {
      if (!dragging) return
      dragMoved = true
      play('running')
      pet.style.left = (e.clientX - offsetX) + 'px'
      pet.style.top = (e.clientY - offsetY) + 'px'
      pet.style.right = 'auto'
      pet.style.bottom = 'auto'
    })
    document.addEventListener('mouseup', function () {
      if (dragging && dragMoved) {
        play('idle')
        scheduleNext()
      }
      dragging = false
      // click 事件会随后触发，用 dragMoved 区分拖拽与点击
      setTimeout(function () { dragMoved = false }, 50)
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
