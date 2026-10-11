// 首页顶部动态视频壁纸：立即显示 + 播放失败时兜底
(function () {
  function init() {
    var wrap = document.getElementById('site-banner-video')
    var video = wrap && wrap.querySelector('video')
    if (!wrap || !video) return

    // 立即解除透明状态，避免任何事件不触发时视频被隐藏
    wrap.classList.add('loaded')

    // 播放失败时的兜底：隐藏视频层，页头显示渐变背景
    var failed = false
    function onFail() {
      if (failed) return
      failed = true
      wrap.style.display = 'none'
      var header = document.getElementById('page-header')
      if (header) header.classList.add('video-failed')
    }
    video.addEventListener('error', onFail)
    // 8 秒内没开始播放也视为失败
    setTimeout(function () {
      if (video.paused && video.readyState < 3) onFail()
    }, 8000)

    var p = video.play()
    if (p && p.catch) p.catch(onFail)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
