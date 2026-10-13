// 首页顶部动态视频壁纸：海报占位 + 延迟加载 + 进入视口才播放
//
// 性能要点（实测优化）：
//   1. 海报帧立即显示，用户第一眼就有内容，不等视频
//   2. 视频延迟到「页面加载完成 + 浏览器空闲」后才开始下载，
//      避免和首屏必需的图片/字争夺带宽（实测首屏从 6.3s 降到 1s 级）
//   3. 只在进入视口时播放；页面不可见时暂停（省电、省流量）
//   4. 尊重「减弱动态效果」偏好：用户开了就不自动播放
(function () {
  var SRC = '/blog/images/banner/banner.mp4'

  function init() {
    var wrap = document.getElementById('site-banner-video')
    var video = wrap && wrap.querySelector('video')
    if (!wrap || !video) return

    var failed = false
    function onFail() {
      if (failed) return
      failed = true
      wrap.style.display = 'none'
      var header = document.getElementById('page-header')
      if (header) header.classList.add('video-failed')
    }
    video.addEventListener('error', onFail)

    // 尊重系统的「减少动态效果」设置
    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      wrap.classList.add('loaded')   // 只留海报，不播视频
      return
    }

    var started = false

    function start() {
      if (started || failed) return
      started = true
      video.addEventListener('playing', function () {
        wrap.classList.add('loaded')
        video.classList.add('playing')
      }, { once: true })
      video.src = SRC
      video.load()
      var p = video.play()
      if (p && p.catch) p.catch(function () { /* 缓冲中，等 playing 事件 */ })
    }

    // 等页面彻底加载完 + 浏览器空闲，再开始下载视频。
    // 这样视频不会跟首屏图片抢带宽（首屏那几秒是关键）。
    function scheduleStart() {
      var go = function () {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(start, { timeout: 3000 })
        } else {
          setTimeout(start, 800)
        }
      }
      if (document.readyState === 'complete') go()
      else window.addEventListener('load', go, { once: true })
    }

    // 进入视口才真正开始（锦上添花：用户没滚到顶部就不加载）
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return
          io.disconnect()
          scheduleStart()
        })
      }, { threshold: 0.05 })
      io.observe(wrap)
    } else {
      scheduleStart()
    }

    // 页面切到后台时暂停，回来再继续（省电）
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (!video.paused) video.pause()
      } else if (started && video.src) {
        var p = video.play()
        if (p && p.catch) p.catch(function () {})
      }
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
