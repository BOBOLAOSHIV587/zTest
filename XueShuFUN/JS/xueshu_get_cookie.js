/****************************************
 xueshu_get_cookie.js
 拦截 xueshu.fun 的响应，提取 Set-Cookie 或 document.cookie，
 并保存为本地 key: XUESHU_COOKIE
 兼容：Quantumult X / Surge / Loon
****************************************/
(() => {
  const resp = typeof $response !== 'undefined' ? $response : {};
  const headers = resp.headers || {};
  const body = resp.body || '';

  // 从响应头取 Set-Cookie（可能有多项）
  let cookie = headers['Set-Cookie'] || headers['set-cookie'] || headers['set_cookie'] || '';
  if (Array.isArray(cookie)) cookie = cookie.join('; ');

  // 若头里没有，再从 body 中尝试解析 document.cookie / setCookie 等写法
  if (!cookie) {
    try {
      const m = String(body).match(/document\.cookie\s*=\s*["']([^"']+)["']/i)
             || String(body).match(/cookie\s*[:=]\s*["']([^"']+)["']/i)
             || String(body).match(/setCookie\(\s*["']([^"']+)["']\s*\)/i);
      if (m && m[1]) cookie = m[1];
    } catch (e) {}
  }

  if (!cookie || cookie.trim() === '') {
    // 未找到 cookie：直接返回原响应
    if (typeof $done === 'function') return $done({});
    else return;
  }

  cookie = String(cookie).trim();

  const KEY = 'XUESHU_COOKIE';
  // 存储到多种运行时支持的 key
  try {
    if (typeof $prefs !== 'undefined' && typeof $prefs.setValueForKey === 'function') {
      $prefs.setValueForKey(cookie, KEY);
    } else if (typeof $persistentStore !== 'undefined' && typeof $persistentStore.write === 'function') {
      $persistentStore.write(cookie, KEY);
    } else if (typeof $storage !== 'undefined' && typeof $storage.setItem === 'function') {
      $storage.setItem(KEY, cookie);
    } else if (typeof require === 'function') {
      // Node 环境降级写入 /tmp（可选）
      try {
        const fs = require('fs');
        fs.writeFileSync('/tmp/xueshu_cookie.txt', cookie, 'utf8');
      } catch (e) {}
    }
  } catch (e) {}

  // 通知（只显示第一段，防止超长）
  try {
    const short = cookie.split(';')[0];
    if (typeof $notify === 'function') $notify('学术FUN - Cookie 已保存', short, 'Key: ' + KEY);
    else console.log('学术FUN - Cookie 已保存 ->', short);
  } catch (e) {}

  // 返回原响应（不修改）
  if (typeof $done === 'function') $done({});
})();
