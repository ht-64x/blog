// 桌宠：蓝鲸娘（GIF 版）
// 行为：待机 -> 随机张望/等待 -> 偶尔挥手；可拖拽；点击有反应；双击隐藏
;(function () {
  var PET_DIR = '/pet/'
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
    if (window.matchMedia('(max-width: 768px)').matches) return

    var pet = document.createElement('div')
    pet.id = 'dsh-pet'
    pet.innerHTML =
      '<img class="dsh-pet-img" src="' + PET_DIR + GIF.idle + '" alt="pet" draggable="false">' +
      '<div class="dsh-pet-bubble">你好呀～</div>'
    document.body.appendChild(pet)

    var img = pet.querySelector('.dsh-pet-img')
    var bubble = pet.querySelector('.dsh-pet-bubble')
    var curGif = ''

    function play(name) {
      if (curGif === name) return
      curGif = name
      // 加时间参数强制重新播放 GIF 动画
      img.src = PET_DIR + GIF[name] + '?t=' + Date.now()
    }

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
