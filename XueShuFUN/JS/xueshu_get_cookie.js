/***************************************
  学术FUN Cookie 获取脚本
  支持：Quantumult X / Surge / Loon
  功能：拦截 https://xueshu.fun 响应，提取 Set-Cookie 或 document.cookie
  存储 Key：XUESHU_COOKIE
***************************************/
(() => {
  const resp = $response || {};
  const headers = resp.headers || {};
  const body = resp.body || '';

  let cookie = headers['Set-Cookie'] || headers['set-cookie'] || '';
  if (Array.isArray(cookie)) cookie = cookie.join('; ');
  if (!cookie) {
    const m = String(body).match(/document\.cookie\s*=\s*["']([^"']+)["']/i);
    if (m) cookie = m[1];
  }
  if (!cookie) return $done({});

  const KEY = 'XUESHU_COOKIE';
  try {
    if (typeof $prefs !== 'undefined') $prefs.setValueForKey(cookie, KEY);
    else if (typeof $persistentStore !== 'undefined') $persistentStore.write(cookie, KEY);
  } catch (e) {}

  if (typeof $notify !== 'undefined') {
    $notify('学术FUN', 'Cookie 已更新', cookie.split(';')[0]);
  }
  $done({});
})();
