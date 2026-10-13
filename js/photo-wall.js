/* ==========================================================================
   照片墙 · 通用脚本

   用法：在页面上放一个带 data-pwall 的容器，脚本会自动往里渲染。

     <div data-pwall="masonry"  data-src="life"></div>              瀑布流
     <div data-pwall="polaroid" data-src="life" data-limit="8"></div> 拍立得
     <div data-pwall="marquee"  data-src="life,gallery"
          data-limit="16" data-shuffle></div>                        胶片带

   数据源：
     life    → images/life/manifest.json      （本地生活照）
     gallery → images/gallery/manifest.json   （wallhaven 壁纸）
     逗号分隔可混用，加 data-shuffle 每次刷新顺序都不同。

   照片上不显示任何文字。点击用主题的 Fancybox / mediumZoom 放大。
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- 站点根路径：脚本在 <root>/js/photo-wall.js ---------- */
  var SELF = document.currentScript ||
    (function () {
      var all = document.querySelectorAll('script[src*="photo-wall.js"]');
      return all[all.length - 1];
    })();
  var ROOT = SELF && SELF.src ? SELF.src.replace(/js\/photo-wall\.js.*$/, '') : '/';

  /* ---------- 数据源定义 ---------- */
  var SOURCES = {
    life: {
      manifest: ROOT + 'images/life/manifest.json',
      full: function (it) { return ROOT + 'images/life/' + it.file; },
      thumb: function (it) { return ROOT + 'images/life/s/' + it.file; }
    },
    gallery: {
      manifest: ROOT + 'images/gallery/manifest.json',
      /* 大图仍在 wallhaven 原站（点开才加载） */
      full: function (it) { return it.file; },
      /* 列表/滚动条一律用本地缩略图：外链并发会被限流拦掉 */
      thumb: function (it) { return ROOT + it.thumb; }
    }
  };

  var cache = {};   /* 同一次页面里多个照片墙共用同一份清单 */

  function loadSource(name) {
    if (cache[name]) return cache[name];
    var cfg = SOURCES[name];
    if (!cfg) return Promise.reject(new Error('未知数据源 ' + name));
    cache[name] = fetch(cfg.manifest, { cache: 'force-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error(cfg.manifest + ' → HTTP ' + r.status);
        return r.json();
      })
      .then(function (list) {
        return list.map(function (it, i) {
          return {
            full: cfg.full(it),
            thumb: cfg.thumb(it),
            ratio: it.ratio || (it.w && it.h ? it.w / it.h : 1.5),
            lqip: it.lqip || '',
            /* 编号取清单里的序号，与照片一一对应，不随洗牌变化 */
            no: i + 1
          };
        });
      });
    return cache[name];
  }

  /* ---------- 工具 ---------- */
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* 混合多个来源：各自洗牌后交错取，保证两边都有、且分布均匀。
     这样"每次刷新都不一样"，同时不会出现整条都是壁纸的情况。 */
  function mix(groups, total) {
    groups = groups.map(shuffle);
    var out = [];
    var i = 0;
    while (out.length < total) {
      var added = false;
      for (var g = 0; g < groups.length; g++) {
        if (i < groups[g].length && out.length < total) {
          out.push(groups[g][i]); added = true;
        }
      }
      if (!added) break;
      i++;
    }
    return out;
  }

  function skeleton(n, mode) {
    var box = document.createElement('div');
    box.className = 'pw-skeleton';
    box.setAttribute('aria-hidden', 'true');
    var count = mode === 'marquee' ? Math.min(n, 8) : Math.min(n, 8);
    for (var i = 0; i < count; i++) {
      var s = document.createElement('i');
      if (mode !== 'marquee') s.style.height = (140 + ((i * 71) % 130)) + 'px';
      box.appendChild(s);
    }
    return box;
  }

  function errorBox(err) {
    var p = document.createElement('p');
    p.className = 'pw-error';
    p.style.cssText = 'text-align:center;opacity:.6;font-size:.85em;padding:20px 0;margin:0';
    p.textContent = '照片墙加载失败（' + err.message + '）';
    return p;
  }

  /* ---------- 渲染 ---------- */
  function card(item, idx, mode) {
    var d = document.createElement('div');
    d.className = 'pw-item';
    if (mode === 'marquee' && item.ratio) {
      d.style.width = Math.round(116 * item.ratio) + 'px';
    }

    var a = document.createElement('a');
    a.className = 'pw-a';
    a.href = item.full;
    a.setAttribute('data-fancybox', 'pwall-' + mode);
    a.setAttribute('aria-label', '照片 ' + (idx + 1));

    var img = document.createElement('img');
    img.className = 'pw-img';
    img.alt = '';
    img.decoding = 'async';
    /* 胶片带在横向滚动，lazy 会被判成"永不进入视口"，必须 eager */
    img.loading = mode === 'marquee' ? 'eager' : 'lazy';
    if (item.ratio) {
      img.width = Math.round(item.ratio * 100);
      img.height = 100;
    }
    if (item.lqip) img.style.backgroundImage = 'url("' + item.lqip + '")';
    img.addEventListener('load', function () { img.classList.add('ok'); });
    img.addEventListener('error', function () { img.classList.add('ok'); });
    img.src = mode === 'marquee' ? item.thumb : item.full;

    a.appendChild(img);

    /* 拍立得：照片下方加编号，四角加护角花边。
       不写日期——这些照片没有可靠的拍摄时间（EXIF 为空，文件名是批量导出时间戳）。 */
    if (mode === 'polaroid') {
      var cap = document.createElement('span');
      cap.className = 'pw-no';
      cap.setAttribute('aria-hidden', 'true');
      cap.textContent = 'NO.' + (item.no < 10 ? '0' + item.no : item.no);
      a.appendChild(cap);

      ['tl', 'tr', 'bl', 'br'].forEach(function (pos) {
        var c = document.createElement('span');
        c.className = 'pw-corner ' + pos;
        c.setAttribute('aria-hidden', 'true');
        a.appendChild(c);
      });
    }

    d.appendChild(a);
    return d;
  }

  function reveal(scope) {
    var items = [].slice.call(scope.querySelectorAll('.pw-item'));
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (c) { c.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
    items.forEach(function (c, i) {
      c.style.transitionDelay = (Math.min(i, 14) * 45) + 'ms';
      io.observe(c);
    });
  }

  function build(mount, items) {
    var mode = mount.getAttribute('data-pwall');
    var grid = document.createElement('div');
    grid.className = 'pw-grid';

    if (mode === 'marquee') {
      var row = document.createElement('div');
      row.className = 'pw-row';
      /* 复制一份才能无缝循环（translateX -50%） */
      items.concat(items).forEach(function (it, i) { row.appendChild(card(it, i, mode)); });
      grid.appendChild(row);
    } else {
      items.forEach(function (it, i) { grid.appendChild(card(it, i, mode)); });
    }

    /* 只清掉本脚本生成的部分，保留作者写在容器里的标题栏 */
    ['.pw-grid', '.pw-skeleton', '.pw-foot', '.pw-error'].forEach(function (sel) {
      [].forEach.call(mount.querySelectorAll(sel), function (el) { el.remove(); });
    });
    mount.appendChild(grid);

    var foot = mount.getAttribute('data-foot');
    var to = mount.getAttribute('data-more');
    if (foot !== 'false' && to && mode !== 'marquee') {
      var wrap = document.createElement('div');
      wrap.className = 'pw-foot';
      var btn = document.createElement('a');
      btn.className = 'pw-btn';
      btn.href = to;
      btn.textContent = mount.getAttribute('data-more-text') || '查看全部照片';
      wrap.appendChild(btn);
      mount.appendChild(wrap);
    }

    reveal(mount);

    if (window.Fancybox && window.Fancybox.bind) {
      window.Fancybox.bind('[data-fancybox="pwall-' + mode + '"]', {
        hideScrollbar: false,
        Toolbar: { display: ['zoom', 'fullscreen', 'close'] }
      });
    } else if (window.mediumZoom) {
      window.mediumZoom('[data-pwall] .pw-img');
    }

    var cnt = mount.querySelector('.pw-count');
    if (cnt) cnt.textContent = items.length + ' 张';
  }

  function init(mount) {
    var mode = mount.getAttribute('data-pwall') || 'masonry';
    var srcs = (mount.getAttribute('data-src') || 'life').split(',').map(function (s) { return s.trim(); });
    var limit = parseInt(mount.getAttribute('data-limit'), 10) || 0;
    var doShuffle = mount.hasAttribute('data-shuffle');

    mount.appendChild(skeleton(limit || 8, mode));

    Promise.all(srcs.map(loadSource))
      .then(function (groups) {
        var items;
        if (groups.length > 1) {
          items = mix(groups, limit || 16);
        } else {
          items = groups[0];
          if (doShuffle) items = shuffle(items);
          if (limit > 0) items = items.slice(0, limit);
        }
        if (!items.length) throw new Error('清单为空');
        build(mount, items);
      })
      .catch(function (err) {
        mount.appendChild(errorBox(err));
        if (window.console) console.warn('[photo-wall]', err);
      });
  }

  function boot() {
    [].forEach.call(document.querySelectorAll('[data-pwall]'), init);
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', boot)
    : boot();
})();
