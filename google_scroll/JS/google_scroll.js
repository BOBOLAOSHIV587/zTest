// ==UserScript==
// @name         Google 搜索自动翻页 (iOS Safari)
// @namespace    https://github.com/autopager/google
// @version      1.3.0
// @description  Google 搜索结果自动加载下一页，支持 iOS Safari / Surge / QuantumultX / Loon
// @author       AutoPager
// @match        *://www.google.com/search*
// @match        *://www.google.com.hk/search*
// @match        *://www.google.co.jp/search*
// @grant        none
// @run-at       document-end
// ==/UserScript==

/**
 * ============================================================
 * Google 搜索自动翻页脚本
 * 
 * 平台支持：
 *   - iOS Safari (UserScript via Userscripts App / Scriptable)
 *   - Surge (使用 [Script] 规则注入)
 *   - QuantumultX (使用 rewrite_local 注入)
 *   - Loon (使用 [Script] 规则注入)
 *
 * 功能特性：
 *   - 滚动到底部自动加载下一页
 *   - 优雅的加载动画指示器
 *   - 防抖节流，避免重复请求
 *   - 自动过滤重复结果
 *   - 页码徽标标记每页来源
 *   - 最大加载页数限制（默认10页）
 * ============================================================
 */

;(function () {
  'use strict';

  // ══════════════════════════════════════════════════════════
  // 配置项
  // ══════════════════════════════════════════════════════════
  const CONFIG = {
    maxPages: 10,             // 最多自动加载页数
    scrollThreshold: 400,     // 距底部多少 px 时触发加载（px）
    debounceDelay: 300,       // 滚动防抖延迟（ms）
    retryDelay: 2000,         // 请求失败重试延迟（ms）
    maxRetries: 3,            // 最大重试次数
    indicatorColor: '#4285F4',// 加载指示器颜色（Google 蓝）
    pageTagColor: '#EA4335',  // 页码标签颜色
  };

  // ══════════════════════════════════════════════════════════
  // 状态管理
  // ══════════════════════════════════════════════════════════
  const State = {
    loading: false,
    currentPage: 1,
    nextPageUrl: null,
    done: false,
    retryCount: 0,
    seenUrls: new Set(),
  };

  // ══════════════════════════════════════════════════════════
  // CSS 样式注入
  // ══════════════════════════════════════════════════════════
  function injectStyles() {
    const css = `
      /* ── 加载指示器 ── */
      #ap-loader {
        display: none;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 24px 16px;
        margin: 8px 0;
        font-family: 'Google Sans', Roboto, Arial, sans-serif;
        font-size: 14px;
        color: #5f6368;
      }
      #ap-loader.active { display: flex; }
      .ap-spinner {
        width: 22px; height: 22px;
        border: 3px solid #e8eaed;
        border-top-color: ${CONFIG.indicatorColor};
        border-radius: 50%;
        animation: ap-spin 0.8s linear infinite;
        flex-shrink: 0;
      }
      @keyframes ap-spin {
        to { transform: rotate(360deg); }
      }

      /* ── 页码分隔线 ── */
      .ap-page-divider {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 20px 0 12px;
        padding: 0 4px;
        font-family: 'Google Sans', Roboto, Arial, sans-serif;
      }
      .ap-page-divider::before,
      .ap-page-divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: #e8eaed;
      }
      .ap-page-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: ${CONFIG.pageTagColor};
        color: #fff;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.5px;
        padding: 3px 10px;
        border-radius: 12px;
        white-space: nowrap;
        flex-shrink: 0;
      }

      /* ── 全部加载完毕提示 ── */
      #ap-done {
        display: none;
        justify-content: center;
        align-items: center;
        gap: 8px;
        padding: 28px 16px;
        font-family: 'Google Sans', Roboto, Arial, sans-serif;
        font-size: 13px;
        color: #9aa0a6;
      }
      #ap-done.active { display: flex; }
      #ap-done svg { flex-shrink: 0; }

      /* ── 结果淡入动画 ── */
      .ap-result-enter {
        animation: ap-fadein 0.35s ease both;
      }
      @keyframes ap-fadein {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `;
    const style = document.createElement('style');
    style.id = 'ap-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ══════════════════════════════════════════════════════════
  // UI 元素创建
  // ══════════════════════════════════════════════════════════
  function createLoader() {
    const el = document.createElement('div');
    el.id = 'ap-loader';
    el.innerHTML = `
      <div class="ap-spinner"></div>
      <span>正在加载更多结果…</span>
    `;
    return el;
  }

  function createDoneNotice() {
    const el = document.createElement('div');
    el.id = 'ap-done';
    el.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="9,12 12,15 15,9"/>
      </svg>
      <span>已加载全部结果</span>
    `;
    return el;
  }

  function createPageDivider(pageNum) {
    const el = document.createElement('div');
    el.className = 'ap-page-divider';
    el.innerHTML = `<span class="ap-page-badge">第 ${pageNum} 页</span>`;
    return el;
  }

  // ══════════════════════════════════════════════════════════
  // 工具函数
  // ══════════════════════════════════════════════════════════

  /** 防抖 */
  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /** 获取结果容器（兼容多种 Google 布局） */
  function getResultsContainer() {
    return (
      document.getElementById('search') ||
      document.getElementById('rso') ||
      document.querySelector('.srp-start') ||
      document.querySelector('[data-async-context]')
    );
  }

  /** 查找"下一页"链接 */
  function findNextPageUrl(doc) {
    // 标准下一页按钮
    const nextLink =
      doc.querySelector('#pnnext') ||
      doc.querySelector('a[aria-label="下一页"]') ||
      doc.querySelector('a[aria-label="Next"]') ||
      doc.querySelector('td.b a#pnnext') ||
      doc.querySelector('a.fl[href*="start="]');

    if (nextLink && nextLink.href) {
      return nextLink.href;
    }
    return null;
  }

  /** 提取单条结果的唯一标识（防重复） */
  function getResultKey(el) {
    const link = el.querySelector('a[href]');
    return link ? link.href : el.textContent.slice(0, 80);
  }

  // ══════════════════════════════════════════════════════════
  // 核心：加载下一页
  // ══════════════════════════════════════════════════════════
  async function loadNextPage() {
    if (State.loading || State.done || !State.nextPageUrl) return;
    if (State.currentPage >= CONFIG.maxPages) {
      markDone('已达到最大加载页数');
      return;
    }

    State.loading = true;
    showLoader(true);

    try {
      const res = await fetch(State.nextPageUrl, {
        credentials: 'include',
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': navigator.language || 'zh-CN,zh;q=0.9',
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // 更新下一页 URL
      const nextUrl = findNextPageUrl(doc);
      State.nextPageUrl = nextUrl;

      // 提取新结果
      const newResults = extractResults(doc);
      if (newResults.length === 0) {
        markDone('没有更多结果了');
        return;
      }

      // 追加到页面
      appendResults(newResults, State.currentPage + 1);
      State.currentPage += 1;
      State.retryCount = 0;

      if (!nextUrl) {
        markDone('已加载全部结果');
      }
    } catch (err) {
      console.warn('[AutoPager] 加载失败:', err);
      State.retryCount += 1;
      if (State.retryCount <= CONFIG.maxRetries) {
        console.log(`[AutoPager] ${CONFIG.retryDelay / 1000}s 后重试 (${State.retryCount}/${CONFIG.maxRetries})`);
        setTimeout(() => {
          State.loading = false;
          loadNextPage();
        }, CONFIG.retryDelay);
        return;
      } else {
        markDone('加载出错，请手动翻页');
      }
    } finally {
      if (!State.done) showLoader(false);
      State.loading = false;
    }
  }

  /** 从解析后的文档中提取搜索结果节点列表 */
  function extractResults(doc) {
    const selectors = [
      '#rso > div',
      '#search .g',
      '.srp-start .g',
      'div[data-hveid]',
    ];

    let nodes = [];
    for (const sel of selectors) {
      nodes = [...doc.querySelectorAll(sel)];
      if (nodes.length > 0) break;
    }

    // 过滤重复
    return nodes.filter(node => {
      const key = getResultKey(node);
      if (State.seenUrls.has(key)) return false;
      State.seenUrls.add(key);
      return true;
    });
  }

  /** 将新结果节点追加到当前页面 */
  function appendResults(nodes, pageNum) {
    const container = getResultsContainer();
    if (!container) return;

    // 插入页码分隔线
    const divider = createPageDivider(pageNum);
    container.appendChild(divider);

    // 追加每条结果（带淡入动画）
    nodes.forEach((node, i) => {
      const clone = document.importNode(node, true);
      clone.classList.add('ap-result-enter');
      clone.style.animationDelay = `${i * 30}ms`;
      // 修复内部相对链接
      fixRelativeLinks(clone);
      container.appendChild(clone);
    });

    // 确保 loader 和 done 在最末尾
    const loaderEl = document.getElementById('ap-loader');
    const doneEl = document.getElementById('ap-done');
    if (loaderEl) container.appendChild(loaderEl);
    if (doneEl) container.appendChild(doneEl);
  }

  /** 修复克隆节点中的相对路径链接 */
  function fixRelativeLinks(root) {
    const base = new URL(State.nextPageUrl || location.href);
    root.querySelectorAll('a[href]').forEach(a => {
      try {
        a.href = new URL(a.getAttribute('href'), base).href;
      } catch (_) {}
    });
  }

  // ══════════════════════════════════════════════════════════
  // UI 状态控制
  // ══════════════════════════════════════════════════════════
  function showLoader(show) {
    const el = document.getElementById('ap-loader');
    if (!el) return;
    el.classList.toggle('active', show);
  }

  function markDone(reason) {
    State.done = true;
    showLoader(false);
    const el = document.getElementById('ap-done');
    if (!el) return;
    const span = el.querySelector('span');
    if (span) span.textContent = reason;
    el.classList.add('active');
    console.log('[AutoPager] 完成:', reason);
  }

  // ══════════════════════════════════════════════════════════
  // 滚动监听
  // ══════════════════════════════════════════════════════════
  function onScroll() {
    if (State.loading || State.done) return;
    const scrollBottom = document.documentElement.scrollHeight
      - window.scrollY
      - window.innerHeight;
    if (scrollBottom <= CONFIG.scrollThreshold) {
      loadNextPage();
    }
  }

  // ══════════════════════════════════════════════════════════
  // 初始化
  // ══════════════════════════════════════════════════════════
  function init() {
    // 确认是搜索结果页
    if (!location.search.includes('q=')) return;

    // 记录当前页已有结果，防重复
    const existingResults = document.querySelectorAll('#rso > div, #search .g');
    existingResults.forEach(el => State.seenUrls.add(getResultKey(el)));

    // 获取第一个"下一页"链接
    State.nextPageUrl = findNextPageUrl(document);
    if (!State.nextPageUrl) {
      console.log('[AutoPager] 未找到下一页链接，可能已是最后一页。');
      return;
    }

    console.log('[AutoPager] 初始化成功，下一页:', State.nextPageUrl);

    // 注入样式
    injectStyles();

    // 创建 UI 元素并追加到结果容器
    const container = getResultsContainer();
    if (container) {
      container.appendChild(createLoader());
      container.appendChild(createDoneNotice());
    }

    // 隐藏原有翻页导航条（可选，注释掉则保留）
    const pager = document.getElementById('botstuff');
    if (pager) pager.style.display = 'none';

    // 绑定滚动事件（防抖）
    window.addEventListener('scroll', debounce(onScroll, CONFIG.debounceDelay), { passive: true });

    // 初次检查（页面内容不足时直接触发）
    setTimeout(onScroll, 800);
  }

  // DOM 就绪后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
