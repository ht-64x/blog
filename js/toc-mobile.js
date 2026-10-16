// 手机端目录（TOC）辅助：
// 目录展开时给 body 加 dsh-toc-open，让音乐播放器/桌宠等浮层暂时隐藏，
// 避免目录面板和浮层叠在一起看不清、点不准。
//
// 背景：实测手机上目录展开后是 310×686（屏宽 390），几乎占满屏幕；
// 而音乐播放器固定在底部、桌宠在右下，三者叠在一起很乱，
// 而且播放器原本 z-index:999 会把目录按钮整个盖住导致点不到。
// 现在 z-index 已经理顺（rightside 100 > 播放器 90 > 桌宠 80），
// 这个脚本负责"展开目录时把浮层收起来"这一步。
;(function () {
  function init() {
    var toc = document.getElementById('card-toc')
    if (!toc) return

    var body = document.body

    function sync() {
      // 目录只在窄屏是浮层，宽屏是侧栏常驻，不需要隐藏浮层
      var isMobile = window.matchMedia('(max-width: 900px)').matches
      var open = toc.classList.contains('open')
      body.classList.toggle('dsh-toc-open', isMobile && open)
    }

    // 监听 class 变化（主题是靠给 #card-toc 加/去 .open 来展开收起的）
    if (window.MutationObserver) {
      new MutationObserver(sync).observe(toc, {
        attributes: true,
        attributeFilter: ['class'],
      })
    }

    // 窗口尺寸变化时重新判断（宽窄切换）
    window.addEventListener('resize', sync)

    sync()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
