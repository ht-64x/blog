// 首页顶部动态视频壁纸：海报占位 + 进入视口才播放（省流量加速）
(function () {
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

    // 进入视口才真正开始加载和播放
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return
          io.disconnect()
          video.addEventListener('playing', function () {
            wrap.classList.add('loaded')
            video.classList.add('playing')
          }, { once: true })
          video.src = '/blog/images/banner/banner.mp4'
          video.load()
          var p = video.play()
          if (p && p.catch) p.catch(onFail)
        })
      }, { threshold: 0.15 })
      io.observe(wrap)
      // 视频源先不设置，海报帧先顶上
    } else {
      video.src = '/blog/images/banner/banner.mp4'
      var p = video.play()
      if (p && p.catch) p.catch(onFail)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()