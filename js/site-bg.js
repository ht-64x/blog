// 全站背景图（半模糊）+ 首页视频壁纸兜底
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('dsh-bg')) return
    var bg = document.createElement('div')
    bg.id = 'dsh-bg'
    document.body.insertBefore(bg, document.body.firstChild)
  })
})()
