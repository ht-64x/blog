// 落花 + 鼠标四散花瓣特效（Canvas，性能友好）
;(function () {
  function init() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    var canvas = document.createElement('canvas')
    canvas.id = 'dsh-petals'
    document.body.appendChild(canvas)
    var ctx = canvas.getContext('2d')
    var W, H
    function resize() {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    var PETAL_COLORS = [
      'rgba(255,183,197,.85)',
      'rgba(255,218,225,.9)',
      'rgba(244,164,180,.8)',
      'rgba(255,228,235,.95)',
      'rgba(233,150,170,.75)'
    ]

    // ---- 落下的花瓣 ----
    var falling = []
    var FALLING_COUNT = 18
    function newPetal(startAnywhere) {
      return {
        x: Math.random() * W,
        y: startAnywhere ? Math.random() * H : -20,
        size: 5 + Math.random() * 8,
        speedY: 0.6 + Math.random() * 1.4,
        sway: Math.random() * 2 * Math.PI,
        swaySpeed: 0.008 + Math.random() * 0.02,
        swayAmp: 30 + Math.random() * 50,
        rot: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.03,
        color: PETAL_COLORS[(Math.random() * PETAL_COLORS.length) | 0],
        mouseBoostX: 0,
        mouseBoostY: 0
      }
    }
    for (var i = 0; i < FALLING_COUNT; i++) falling.push(newPetal(true))

    function drawPetal(p) {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      ctx.beginPath()
      // 花瓣形状：两段贝塞尔画出的椭圆瓣
      ctx.moveTo(0, -p.size)
      ctx.bezierCurveTo(p.size * 0.9, -p.size * 0.6, p.size * 0.9, p.size * 0.6, 0, p.size)
      ctx.bezierCurveTo(-p.size * 0.9, p.size * 0.6, -p.size * 0.9, -p.size * 0.6, 0, -p.size)
      ctx.fill()
      ctx.restore()
    }

    // ---- 鼠标四散的花瓣 ----
    var burst = []
    var mouse = { x: -9999, y: -9999, lastEmit: 0 }
    document.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX
      mouse.y = e.clientY
      var now = Date.now()
      if (now - mouse.lastEmit > 60 && burst.length < 60) {
        mouse.lastEmit = now
        var n = 2 + ((Math.random() * 2) | 0)
        for (var i = 0; i < n; i++) {
          var ang = Math.random() * 2 * Math.PI
          var sp = 1 + Math.random() * 2.5
          burst.push({
            x: mouse.x,
            y: mouse.y,
            vx: Math.cos(ang) * sp,
            vy: Math.sin(ang) * sp - 1,
            size: 3 + Math.random() * 5,
            life: 1,
            decay: 0.012 + Math.random() * 0.018,
            rot: Math.random() * Math.PI,
            rotSpeed: (Math.random() - 0.5) * 0.15,
            color: PETAL_COLORS[(Math.random() * PETAL_COLORS.length) | 0]
          })
        }
      }
    })

    function loop() {
      ctx.clearRect(0, 0, W, H)

      // 落花
      for (var i = 0; i < falling.length; i++) {
        var p = falling[i]
        p.sway += p.swaySpeed
        // 靠近鼠标的花瓣被推开
        var dx = p.x - mouse.x
        var dy = p.y - mouse.y
        var dist2 = dx * dx + dy * dy
        if (dist2 < 12000) {
          var d = Math.sqrt(dist2) || 1
          p.mouseBoostX += (dx / d) * 0.6
          p.mouseBoostY += (dy / d) * 0.6
        }
        p.mouseBoostX *= 0.92
        p.mouseBoostY *= 0.92
        p.x += Math.sin(p.sway) * 0.8 + p.mouseBoostX
        p.y += p.speedY + p.mouseBoostY
        p.rot += p.rotSpeed
        if (p.y > H + 30 || p.x < -40 || p.x > W + 40) falling[i] = newPetal(false)
        drawPetal(p)
      }

      // 鼠标四散花瓣
      for (var j = burst.length - 1; j >= 0; j--) {
        var b = burst[j]
        b.x += b.vx
        b.y += b.vy
        b.vy += 0.03 // 轻微重力
        b.vx *= 0.985
        b.rot += b.rotSpeed
        b.life -= b.decay
        if (b.life <= 0) {
          burst.splice(j, 1)
          continue
        }
        ctx.save()
        ctx.translate(b.x, b.y)
        ctx.rotate(b.rot)
        ctx.globalAlpha = b.life
        ctx.fillStyle = b.color
        ctx.beginPath()
        ctx.moveTo(0, -b.size)
        ctx.bezierCurveTo(b.size * 0.9, -b.size * 0.6, b.size * 0.9, b.size * 0.6, 0, b.size)
        ctx.bezierCurveTo(-b.size * 0.9, b.size * 0.6, -b.size * 0.9, -b.size * 0.6, 0, -b.size)
        ctx.fill()
        ctx.restore()
      }

      requestAnimationFrame(loop)
    }
    loop()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
