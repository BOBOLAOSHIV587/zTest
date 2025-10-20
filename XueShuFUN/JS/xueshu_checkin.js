/***********************************************
 xueshu_checkin_qx.js
 自动读取 XUESHU_COOKIE 并签到（Quantumult X）
 兼容性：QX 原生（$task.fetch）与其它环境回退
 Key: XUESHU_COOKIE
***********************************************/
const KEY = 'wordpress_63c6d91ecc476e0b2b0f7d9535c9cc65=bobolaoshi%7C1762106525%7CTPfhZDO7hhflvcOvfJdpbPJ6ktyFfEnB3MtkxyLkD1W%7C83c3ae863060169a4c186163e2216228329796292ce0294dc723ee77fb518'; // 若你用别的 key，请修改这里

// 读取 Cookie（QX 偏好 / Surge 持久化 兼容）
function readCookie() {
  try {
    if (typeof $prefs !== 'undefined' && typeof $prefs.valueForKey === 'function') {
      // QX: setValueForKey / valueForKey
      return $prefs.valueForKey(KEY) || $prefs.valueForKey(KEY);
    }
    if (typeof $persistentStore !== 'undefined' && typeof $persistentStore.read === 'function') {
      return $persistentStore.read(KEY);
    }
    if (typeof $storage !== 'undefined' && typeof $storage.getItem === 'function') {
      return $storage.getItem(KEY);
    }
  } catch (e) {}
  return null;
}

function notify(title, subtitle, message) {
  if (typeof $notify === 'function') $notify(title, subtitle, message);
  else console.log(title, subtitle, message);
}
function done(v){ if (typeof $done === 'function') $done(v); }

// 主逻辑
(async () => {
  const cookie = readCookie();
  if (!cookie) {
    notify('学术FUN 签到', '失败', '未检测到 Cookie（XUESHU_COOKIE）。请先登录并保存 Cookie）');
    return done();
  }

  const headers = {
    'Cookie': cookie,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Referer': 'https://xueshu.fun/',
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json, text/javascript, */*; q=0.01'
  };

  // 常见候选接口（按优先级）
  const candidates = [
    'https://xueshu.fun/user/checkin',
    'https://xueshu.fun/checkin',
    'https://xueshu.fun/api/checkin',
    'https://xueshu.fun/user/signin',
    'https://xueshu.fun/signin'
  ];

  for (const url of candidates) {
    try {
      // 先尝试 POST
      const resp = await fetchUrl('POST', url, headers);
      const body = resp && resp.body ? resp.body : '';
      if (await isSuccess(body)) return done();

      // 若 POST 无效，尝试 GET
      const resp2 = await fetchUrl('GET', url, headers);
      const body2 = resp2 && resp2.body ? resp2.body : '';
      if (await isSuccess(body2)) return done();
    } catch (e) {
      // 忽略错误，继续下一个候选
    }
  }

  // 全部候选失败
  notify('学术FUN 签到', '失败', '尝试了常见接口均未成功。如可，请抓取一次签到请求的 Response body 贴给我以便定制。');
  done();
})();

// 判断是否成功并通知（解析 JSON 或文本）
async function isSuccess(body) {
  const text = (typeof body === 'string') ? body : JSON.stringify(body);
  if (!text || text.length === 0) return false;

  // 尝试解析 JSON
  try {
    const j = JSON.parse(text);
    // 常见成功判断： code===0 或 success===true 或 msg 包含 成功关键词
    const msgField = j.msg || j.message || '';
    if (j.code === 0 || j.code === '0' || j.success === true || j.success === 'true' || /success/i.test(j.status || '')) {
      const info = formatJsonInfo(j);
      notify('🎉 学术FUN 签到成功', '', info);
      return true;
    }
    if (msgField && /签到成功|已签到|success|OK/i.test(String(msgField))) {
      const info = formatJsonInfo(j);
      notify('🎉 学术FUN 签到成功', '', info);
      return true;
    }
    // 若 JSON 包含关键词也可视为成功（保险判断）
    if (JSON.stringify(j).match(/签到成功|已签到|获得|积分|连续/)) {
      const info = formatJsonInfo(j);
      notify('🎉 学术FUN 签到（可能）', '', info);
      return true;
    }
  } catch(e) {
    // 非 JSON，尝试文本解析
  }

  // 文本匹配成功关键词
  if (/签到成功|已签到|今日已签到|获得奖励|success|签到完成/i.test(text)) {
    const info = parseTextInfo(text);
    notify('🎉 学术FUN 签到成功', '', info);
    return true;
  }
  return false;
}

// 从 JSON 提取信息（积分/连续/累计/消息）
function formatJsonInfo(j) {
  const parts = [];
  if (j.msg) parts.push(String(j.msg));
  if (j.message) parts.push(String(j.message));
  const d = j.data || j.result || j;
  if (d && typeof d === 'object') {
    if (d.point || d.points || d.score) parts.push('积分: ' + (d.point || d.points || d.score));
    if (d.days || d.continue || d.continuous) parts.push('连续签到: ' + (d.days || d.continue || d.continuous) + ' 天');
    if (d.total || d.total_days) parts.push('累计签到: ' + (d.total || d.total_days));
    // 若 data 中有自说明字段（例如 reward），尝试显示
    if (d.reward) parts.push('奖励: ' + String(d.reward));
  }
  if (!parts.length) parts.push(String(JSON.stringify(j)).slice(0,150));
  return parts.join('\n');
}

// 从 HTML/纯文本中提取关键信息
function parseTextInfo(text) {
  const clean = text.replace(/<[^>]*>/g, '\n');
  const parts = [];
  if (/签到成功|已签到|success/i.test(clean)) parts.push('✅ 签到成功');
  const p = clean.match(/积分[:：]?\s*([+-]?\d+)/);
  const c = clean.match(/连续.{0,4}(\d+)\s*天/);
  const t = clean.match(/累计.{0,4}(\d+)\s*天/);
  if (p) parts.push('积分: ' + p[1]);
  if (c) parts.push('连续签到: ' + c[1] + ' 天');
  if (t) parts.push('累计签到: ' + t[1] + ' 天');
  if (!parts.length) parts.push(clean.slice(0,150));
  return parts.join('\n');
}

// 通用 fetch（QX: $task.fetch；回退：$httpClient）
function fetchUrl(method, url, headers) {
  return new Promise((resolve, reject) => {
    // QX
    if (typeof $task !== 'undefined' && $task.fetch) {
      $task.fetch({ method, url, headers }).then(resp => {
        resolve({ status: resp.status || resp.statusCode, body: resp.body, headers: resp.headers });
      }).catch(err => reject(err));
      return;
    }
    // Surge / Loon 回退（$httpClient）
    if (typeof $httpClient !== 'undefined') {
      const cb = (err, resp, body) => {
        if (err) return reject(err);
        resolve({ status: resp && (resp.status || resp.statusCode || 0), body: body, headers: resp && resp.headers });
      };
      if (method === 'POST') $httpClient.post({ url, headers }, cb);
      else $httpClient.get({ url, headers }, cb);
      return;
    }
    // 不支持环境
    reject(new Error('unsupported runtime'));
  });
}
