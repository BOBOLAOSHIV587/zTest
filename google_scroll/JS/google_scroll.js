/**
 * Google 搜索自动翻页 — HTTP Response 注入版
 * 适配：Surge / QuantumultX / Loon
 *
 * 原理：代理拦截 Google 搜索结果的 HTML 响应，
 *       将自动翻页逻辑以 <script> 标签形式注入到 </body> 之前，
 *       浏览器加载页面时自动执行注入的脚本。
 *
 * 平台变量说明：
 *   Surge / QX / Loon → $response.body / $done({body})
 *   三平台 API 完全一致，同一份脚本通用
 */

// ─── 要注入进浏览器页面的自动翻页逻辑 ────────────────────────────────────────
const CLIENT_SCRIPT = `
(function () {
  'use strict';

  var CONFIG = {
    maxPages: 10,
    scrollThreshold: 300,
    debounceDelay: 250,
    retryDelay: 2000,
    maxRetries: 3,
  };

  var State = {
    loading: false,
    currentPage: 1,
    nextPageUrl: null,
    done: false,
    retryCount: 0,
    seenKeys: [],
  };

  function debounce(fn, ms) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  function seenAdd(k) { State.seenKeys.push(k); }
  function seenHas(k) { return State.seenKeys.indexOf(k) !== -1; }

  function getKey(el) {
    var a = el.querySelector('a[href]');
    if (a) {
      try {
        var u = new URL(a.href);
        return u.searchParams.get('q') || u.href;
      } catch (e) { return a.href; }
    }
    return el.textContent.trim().slice(0, 60);
  }

  function getContainer() {
    return document.getElementById('rso') ||
           document.getElementById('search') ||
           document.querySelector('[data-async-context]');
  }

  function findNext(doc) {
    var el = doc.getElementById('pnnext') ||
             doc.querySelector('a[aria-label="Next"]') ||
             doc.querySelector('a[aria-label="下一页"]') ||
             doc.querySelector('a[aria-label="次のページ"]');
    if (el && el.href) return el.href;
    var links = doc.querySelectorAll('#botstuff a[href*="start="]');
    if (links.length) return links[links.length - 1].href;
    return null;
  }

  function extractNodes(doc) {
    var candidates = [];
    var sels = ['#rso > div', '#rso .g', 'div[data-hveid][data-ved]'];
    for (var i = 0; i < sels.length; i++) {
      candidates = Array.prototype.slice.call(doc.querySelectorAll(sels[i]));
      candidates = candidates.filter(function (n) { return n.textContent.trim().length > 20; });
      if (candidates.length >= 3) break;
    }
    return candidates.filter(function (n) {
      var k = getKey(n);
      if (seenHas(k)) return false;
      seenAdd(k); return true;
    });
  }

  function fixLinks(root, base) {
    root.querySelectorAll('a[href]').forEach(function (a) {
      try { a.href = new URL(a.getAttribute('href'), base).href; } catch (e) {}
    });
  }

  function injectStyles() {
    if (document.getElementById('ap-style')) return;
    var s = document.createElement('style');
    s.id = 'ap-style';
    s.textContent =
      '#ap-bar{display:flex;align-items:center;justify-content:center;gap:10px;' +
      'padding:20px 16px;font:14px/1 "Google Sans",Roboto,Arial,sans-serif;color:#5f6368}' +
      '#ap-bar.hidden{display:none}' +
      '.ap-spin{width:20px;height:20px;border:3px solid #e8eaed;' +
      'border-top-color:#4285F4;border-radius:50%;animation:ap-r .7s linear infinite}' +
      '@keyframes ap-r{to{transform:rotate(360deg)}}' +
      '.ap-div{display:flex;align-items:center;gap:10px;margin:16px 0 8px;' +
      'font:600 11px/1 "Google Sans",Roboto,Arial,sans-serif}' +
      '.ap-div::before,.ap-div::after{content:"";flex:1;height:1px;background:#e8eaed}' +
      '.ap-badge{background:#EA4335;color:#fff;padding:3px 10px;border-radius:12px;white-space:nowrap}' +
      '.ap-in{animation:ap-f .3s ease both}' +
      '@keyframes ap-f{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}';
    document.head.appendChild(s);
  }

  var barEl = null;
  function getBar() {
    if (!barEl) {
      barEl = document.createElement('div');
      barEl.id = 'ap-bar';
      barEl.classList.add('hidden');
      var c = getContainer();
      if (c) c.appendChild(barEl);
    }
    return barEl;
  }

  function setBar(show, doneText) {
    var b = getBar();
    if (show) {
      b.innerHTML = '<div class="ap-spin"></div><span>加载更多结果\u2026</span>';
      b.classList.remove('hidden');
    } else if (doneText) {
      b.innerHTML = '<span style="color:#9aa0a6">\u2713 ' + doneText + '</span>';
      b.classList.remove('hidden');
    } else {
      b.classList.add('hidden');
    }
  }

  function insertDivider(container, pageNum) {
    var d = document.createElement('div');
    d.className = 'ap-div';
    d.innerHTML = '<span class="ap-badge">\u7b2c ' + pageNum + ' \u9875</span>';
    container.insertBefore(d, getBar());
  }

  function loadNext() {
    if (State.loading || State.done || !State.nextPageUrl) return;
    if (State.currentPage >= CONFIG.maxPages) {
      setBar(false, '\u5df2\u8fbe\u6700\u5927\u52a0\u8f7d\u9875\u6570');
      State.done = true; return;
    }

    State.loading = true;
    setBar(true);

    fetch(State.nextPageUrl, {
      credentials: 'include',
      headers: { 'Accept': 'text/html', 'Accept-Language': navigator.language || 'zh-CN' }
    })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    })
    .then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var nextUrl = findNext(doc);
      State.nextPageUrl = nextUrl;

      var nodes = extractNodes(doc);
      if (!nodes.length) { setBar(false, '\u6ca1\u6709\u66f4\u591a\u7ed3\u679c\u4e86'); State.done = true; return; }

      var container = getContainer();
      if (!container) return;

      var pageNum = State.currentPage + 1;
      insertDivider(container, pageNum);

      nodes.forEach(function (n, i) {
        var clone = document.importNode(n, true);
        clone.classList.add('ap-in');
        clone.style.animationDelay = (i * 25) + 'ms';
        fixLinks(clone, State.nextPageUrl || location.href);
        container.insertBefore(clone, getBar());
      });

      State.currentPage = pageNum;
      State.retryCount = 0;
      State.loading = false;
      setBar(false);

      if (!nextUrl) { setBar(false, '\u5df2\u52a0\u8f7d\u5168\u90e8\u7ed3\u679c'); State.done = true; }
    })
    .catch(function (err) {
      console.warn('[AP]', err);
      State.retryCount++;
      State.loading = false;
      if (State.retryCount <= CONFIG.maxRetries) {
        setTimeout(loadNext, CONFIG.retryDelay);
      } else {
        setBar(false, '\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u624b\u52a8\u7ffb\u9875');
        State.done = true;
      }
    });
  }

  function onScroll() {
    if (State.loading || State.done) return;
    var dist = document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
    if (dist <= CONFIG.scrollThreshold) loadNext();
  }

  function init() {
    if (!location.search.includes('q=')) return;

    var existing = document.querySelectorAll('#rso > div, #rso .g');
    Array.prototype.forEach.call(existing, function (n) { seenAdd(getKey(n)); });

    State.nextPageUrl = findNext(document);
    if (!State.nextPageUrl) { console.log('[AP] \u65e0\u4e0b\u4e00\u9875'); return; }

    console.log('[AP] \u521d\u59cb\u5316\u6210\u529f\uff0c\u4e0b\u4e00\u9875:', State.nextPageUrl);
    injectStyles();
    getBar();

    var bot = document.getElementById('botstuff');
    if (bot) bot.style.display = 'none';

    window.addEventListener('scroll', debounce(onScroll, CONFIG.debounceDelay), { passive: true });
    setTimeout(onScroll, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`;
// ─────────────────────────────────────────────────────────────────────────────

// ─── 代理层：修改 HTML 响应，插入 <script> 标签 ──────────────────────────────
var body = $response.body;

if (typeof body === 'string' && body.length > 0) {
  var tag = '<script id="ap-inject">' + CLIENT_SCRIPT + '<\/script>';

  if (body.indexOf('</body>') !== -1) {
    body = body.replace('</body>', tag + '</body>');
  } else if (body.indexOf('</html>') !== -1) {
    body = body.replace('</html>', tag + '</html>');
  } else {
    body = body + tag;
  }
}

$done({ body: body });
