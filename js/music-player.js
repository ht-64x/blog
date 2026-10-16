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
      saveState()
      if (autoplay) play()
    }

    /* ---------------- 跨页面续播 ----------------
       问题：以前切到别的页面（或刷新），音乐就断了，得重新点一次。
       做法：用 sessionStorage 记住"上次在放哪首、播到第几秒"，
       新页面加载后如果之前是播放状态，就恢复播放并把进度拖回去。
       为什么用 sessionStorage 而不是 localStorage：
       标签页关掉后不该自动续播，sessionStorage 正好符合这个语义。 */
    var STORE_KEY = 'dsh-music-state'

    function saveState() {
      try {
        sessionStorage.setItem(STORE_KEY, JSON.stringify({
          idx: idx,
          time: audio.currentTime || 0,
          playing: !audio.paused && !audio.ended,
          ts: Date.now()
        }))
      } catch (e) { /* 隐私模式下可能不可用，忽略 */ }
    }

    function readState() {
      try {
        var raw = sessionStorage.getItem(STORE_KEY)
        if (!raw) return null
        var st = JSON.parse(raw)
        // 超过 30 分钟的旧状态不恢复，避免莫名其妙自动响
        if (!st || typeof st.idx !== 'number') return null
        if (Date.now() - (st.ts || 0) > 30 * 60 * 1000) return null
        return st
      } catch (e) { return null }
    }

    // 定时保存进度（timeupdate 太频繁，2 秒一次够用）
    setInterval(function () { if (!audio.paused) saveState() }, 2000)
    // 页面要走了，赶紧存一下
    window.addEventListener('pagehide', saveState)
    window.addEventListener('beforeunload', saveState)
    // 页面切到后台时也存
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) saveState()
    })

    function restore() {
      var st = readState()
      if (!st) { load(0, false); return }
      idx = (st.idx + playlist.length) % playlist.length
      var t = playlist[idx]
      nameEl.textContent = t.name
      artistEl.textContent = t.artist
      loadLrc(t)
      audio.src = t.url
      // 先把进度定位到上次的位置，再决定要不要自动播
      var seekTo = st.time || 0
      var onMeta = function () {
        audio.removeEventListener('loadedmetadata', onMeta)
        try { if (seekTo > 0 && seekTo < (audio.duration || 1e9)) audio.currentTime = seekTo } catch (e) {}
        if (st.playing) {
          // 浏览器可能拦截自动播放；失败就退化成"已就绪但暂停"
          audio.play().catch(function () {
            playBtn.innerHTML = '<i class="fas fa-play"></i>'
            player.classList.remove('playing')
          })
        } else {
          playBtn.innerHTML = '<i class="fas fa-play"></i>'
        }
      }
      audio.addEventListener('loadedmetadata', onMeta)
      audio.load()
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

    /* 进度条拖动（手机上点击不好定位，支持拖动更友好） */
    var dragging = false
    function seekFromEvent(e) {
      if (!audio.duration) return
      var rect = bar.getBoundingClientRect()
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
      var r = Math.min(1, Math.max(0, x / rect.width))
      audio.currentTime = r * audio.duration
    }
    bar.addEventListener('pointerdown', function (e) {
      dragging = true
      try { bar.setPointerCapture(e.pointerId) } catch (err) {}
      seekFromEvent(e)
    })
    bar.addEventListener('pointermove', function (e) { if (dragging) seekFromEvent(e) })
    bar.addEventListener('pointerup', function () { dragging = false })
    bar.addEventListener('pointercancel', function () { dragging = false })

    /* 启动：尝试恢复上次的播放状态（跨页面续播），没有就只加载不播 */
    restore()
  })
})()