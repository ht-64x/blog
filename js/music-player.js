// 内嵌式音乐播放器：固定在左下视图内、常驻展开、带进度条
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('dsh-music')) return

    // ====== 歌单配置：把 url 换成你自己的音频文件或外链 ======
    var playlist = [
      {
        name: '众神眷恋的幻想乡 (手风琴版)',
        artist: '枫琴Sakuya',
        url: '/blog/music/bilibili@BV1L3411T7Ef@【手风琴改编】众神眷恋的幻想乡@枫琴Sakuya.mp3',
        lrc: ''  // 同目录放 .lrc 文件后填路径
      }
    ]

    var idx = 0
    var player = document.createElement('div')
    player.id = 'dsh-music'
    player.innerHTML =
      '<div class="dsh-music-header">' +
      '<i class="fas fa-compact-disc dsh-music-disc"></i>' +
      '<div class="dsh-music-info"><span class="dsh-music-name"></span><span class="dsh-music-artist"></span></div>' +
      '</div>' +
      '<div class="dsh-music-progress"><div class="dsh-music-bar"><div class="dsh-music-bar-fill"></div></div>' +
      '<div class="dsh-music-time"><span class="t-cur">00:00</span><span class="t-total">00:00</span></div></div>' +
      '<div class="dsh-music-lyric"></div>' +
      '<div class="dsh-music-controls">' +
      '<button class="dsh-music-prev" title="上一首"><i class="fas fa-step-backward"></i></button>' +
      '<button class="dsh-music-play" title="播放/暂停"><i class="fas fa-play"></i></button>' +
      '<button class="dsh-music-next" title="下一首"><i class="fas fa-step-forward"></i></button>' +
      '</div>'
    /* 挂到 body。首页三列布局下，three-col.js 会把它挪进左列；
       其它页面则保持左下角浮层（position:fixed 由 _music.styl 决定）。 */
    document.body.appendChild(player)

    var audio = new Audio()
    audio.preload = 'none'
    var playBtn = player.querySelector('.dsh-music-play')
    var nameEl = player.querySelector('.dsh-music-name')
    var artistEl = player.querySelector('.dsh-music-artist')
    var fill = player.querySelector('.dsh-music-bar-fill')
    var curEl = player.querySelector('.t-cur')
    var totalEl = player.querySelector('.t-total')
    var bar = player.querySelector('.dsh-music-bar')

    function fmt(s) {
      if (!isFinite(s)) return '00:00'
      var m = Math.floor(s / 60), sec = Math.floor(s % 60)
      return (m < 10 ? '0' + m : m) + ':' + (sec < 10 ? '0' + sec : sec)
    }

    function load(i, autoplay) {
      idx = (i + playlist.length) % playlist.length
      var t = playlist[idx]
      audio.src = t.url
      nameEl.textContent = t.name
      artistEl.textContent = t.artist
      loadLrc(t)
      if (autoplay) play()
    }

    // ---- LRC 歌词：playlist 条目加 lrc 字段即可自动加载同步 ----
    var lyricEl = player.querySelector('.dsh-music-lyric')
    var lrcLines = []   // [{ t: 秒, text: 歌词 }]
    function parseLrc(text) {
      var out = []
      text.split(/\r?\n/).forEach(function (line) {
        var m = line.match(/\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/g)
        if (!m) return
        var content = line.replace(/\[[^\]]*\]/g, '').trim()
        m.forEach(function (tag) {
          var mm = tag.match(/\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/)
          var sec = parseInt(mm[1]) * 60 + parseInt(mm[2]) + (mm[3] ? parseInt(mm[3].padEnd(3, '0')) / 1000 : 0)
          if (content) out.push({ t: sec, text: content })
        })
      })
      return out.sort(function (a, b) { return a.t - b.t })
    }
    function loadLrc(track) {
      lrcLines = []
      lyricEl.textContent = ''
      if (!track.lrc) return
      fetch(track.lrc).then(function (r) { return r.ok ? r.text() : '' }).then(function (txt) {
        if (!txt) return
        lrcLines = parseLrc(txt)
      }).catch(function () {})
    }
    audio.addEventListener('timeupdate', function () {
      // 歌词同步：二分位置更新当前行
      if (!lrcLines.length || !lyricEl) return
      var cur = audio.currentTime, line = ''
      for (var i = 0; i < lrcLines.length; i++) {
        if (lrcLines[i].t <= cur) line = lrcLines[i].text
      }
      if (line && lyricEl.textContent !== line) {
        lyricEl.textContent = line
        lyricEl.classList.remove('dsh-lyric-pop')
        void lyricEl.offsetWidth
        lyricEl.classList.add('dsh-lyric-pop')
      }
    })

    function play() {
      audio.play().then(function () {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>'
        player.classList.add('playing')
      }).catch(function () {
        nameEl.textContent = '播放失败，请检查音频链接'
      })
    }

    function pause() {
      audio.pause()
      playBtn.innerHTML = '<i class="fas fa-play"></i>'
      player.classList.remove('playing')
    }

    playBtn.addEventListener('click', function () {
      if (!audio.src) return load(0, true)
      audio.paused ? play() : pause()
    })
    player.querySelector('.dsh-music-prev').addEventListener('click', function () { load(idx - 1, !audio.paused) })
    player.querySelector('.dsh-music-next').addEventListener('click', function () { load(idx + 1, !audio.paused) })

    audio.addEventListener('timeupdate', function () {
      if (!audio.duration) return
      fill.style.width = (audio.currentTime / audio.duration * 100) + '%'
      curEl.textContent = fmt(audio.currentTime)
    })
    audio.addEventListener('loadedmetadata', function () {
      totalEl.textContent = fmt(audio.duration)
    })
    audio.addEventListener('ended', function () { load(idx + 1, true) })
    audio.addEventListener('play', function () {
      playBtn.innerHTML = '<i class="fas fa-pause"></i>'
      player.classList.add('playing')
    })
    audio.addEventListener('pause', function () {
      playBtn.innerHTML = '<i class="fas fa-play"></i>'
      player.classList.remove('playing')
    })

    bar.addEventListener('click', function (e) {
      if (!audio.duration) return
      var rect = bar.getBoundingClientRect()
      audio.currentTime = (e.clientX - rect.left) / rect.width * audio.duration
    })

    load(0, false)
  })
})()