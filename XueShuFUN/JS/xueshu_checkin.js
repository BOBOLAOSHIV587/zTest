/****************************************
 xueshu_checkin_autoread.js
 自动读取本地 XUESHU_COOKIE 并尝试签到，支持 QX/Surge/Loon
 解析并在签到成功时发送通知（显示积分/连续天数/原始消息）
****************************************/
const KEY = 'XUESHU_COOKIE';

// 读取 cookie（多运行时兼容）
function readCookie() {
  try {
    if (typeof $prefs !== 'undefined' && typeof $prefs.valueForKey === 'function') {
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

const cookie = readCookie();
if (!cookie || cookie.trim() === '') {
  notify('学术FUN 签到失败', '', '未找到 Cookie，请先登录网站以触发 Cookie 获取脚本');
  done();
}

// 常见候选签到接口（按优先级）
const CANDIDATES = [
  'https://xueshu.fun/user/checkin',
  'https://xueshu.fun/checkin',
  'https://xueshu.fun/api/checkin',
  'https://xueshu.fun/user/signin',
  'https://xueshu.fun/signin'
];

const headers = {
  'Cookie': cookie,
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  'Referer': 'https://xueshu.fun/',
  'X-Requested-With': 'XMLHttpRequest',
  'Accept': 'application/json, text/javascript, */*; q=0.01'
};

(async () => {
  for (const url of CANDIDATES) {
    try {
      const resp = await httpFetch('POST', url, headers);
      const body = (resp && resp.body) ? resp.body : '';
      // 若 HTTP 状态非 200 也查看 body（某些站点会重定向）
      if (!body || body.length === 0) {
        // 如果 POST 无返回，再尝试 GET
        const g = await httpFetch('GET', url, headers);
        if (g && g.body) {
          if (await checkSuccess(g.body)) { return; }
        }
        continue;
      }
      if (await checkSuccess(body)) return;
    } catch (e) {
      // ignore, 继续下一个候选
    }
  }
  notify('学术FUN 签到失败', '', '尝试了常见接口均未成功。请手动签到并把响应返回体发给我以便定制。');
  done();
})();

// 检查是否成功并通知（尝试解析 JSON 或文本）
async function checkSuccess(body) {
  const text = (typeof body === 'string') ? body : JSON.stringify(body);
  // 1) 尝试解析 JSON
  try {
    const j = JSON.parse(text);
    // 常见成功条件：code===0 或 success===true 等
    if (j && (j.code === 0 || j.code === '0' || j.success === true || j.success === 'true' || /success/i.test(j.status || ''))) {
      const info = formatInfoFromJson(j);
      notify('🎉 学术FUN 签到成功', '', info);
      return true;
    }
    // 有些站点在 message / msg 字段说明签到成功
    const msg = j.msg || j.message || '';
    if (msg && /签到成功|已签到|success|OK/i.test(String(msg))) {
      const info = formatInfoFromJson(j);
      notify('🎉 学术FUN 签到成功', '', info);
      return true;
    }
    // 如果 JSON 包含可识别的 data 字段内信息也视为成功（尝试查找关键词）
    if (JSON.stringify(j).match(/签到成功|已签到|获得|积分|连续/)) {
      const info = formatInfoFromJson(j);
      notify('🎉 学术FUN 签到（可能）', '', info);
      return true;
    }
  } catch (e) {
    // 不是 JSON，继续文本解析
  }

  // 2) 文本匹配常见成功关键词
  if (/签到成功|已签到|今日已签到|获得奖励|已领取|success|签到完成/i.test(text)) {
    const info = parseInfoFromText(text);
    notify('🎉 学术FUN 签到成功', '', info);
    return true;
  }
  return false;
}

// 从 JSON 中提取可读信息
function formatInfoFromJson(j) {
  let lines = [];
  if (j.msg) lines.push(String(j.msg));
  if (j.message) lines.push(String(j.message));
  // 优先检查 data 里常见字段
  const d = j.data || j.result || j;
  if (d) {
    if (d.point || d.points || d.score) lines.push('当前积分: ' + (d.point || d.points || d.score));
    if (d.days || d.continue || d.continuous) lines.push('连续签到: ' + (d.days || d.continue || d.continuous));
    if (d.total || d.total_days) lines.push('累计签到: ' + (d.total || d.total_days));
    // 若 data 为字符串或对象，加入其简短描述
    if (typeof d === 'string') lines.push(d.slice(0, 120));
    else if (typeof d === 'object' && !lines.length) lines.push(JSON.stringify(d).slice(0, 200));
  }
  if (!lines.length) lines.push(String(JSON.stringify(j)).slice(0, 200));
  return lines.join('\n');
}

// 从 HTML / 文本中提取积分/连续天数等
function parseInfoFromText(text) {
  const clean = text.replace(/<[^>]*>/g, '\n');
  const p = (clean.match(/积分[:：]?\s*([+-]?\d+)/) || clean.match(/获得[:：]?\s*([+-]?\d+)/));
  const c = clean.match(/连续.{0,4}(\d+)\s*天/);
  const t = clean.match(/累计.{0,4}(\d+)\s*天/);
  let lines = [];
  if (/签到成功|已签到|success/i.test(clean)) lines.push('✅ 签到成功');
  if (p) lines.push('积分: ' + p[1]);
  if (c) lines.push('连续签到: ' + c[1] + ' 天');
  if (t) lines.push('累计签到: ' + t[1] + ' 天');
  if (!lines.length) lines.push(clean.slice(0, 200));
  return lines.join('\n');
}

// 通用请求（兼容 QX / Surge / Loon）
function httpFetch(method, url, headers) {
  return new Promise((resolve, reject) => {
    // Quantumult X
    if (typeof $task !== 'undefined' && $task.fetch) {
      $task.fetch({ method, url, headers }).then(resp => {
        resolve({ status: resp.status || resp.statusCode, body: resp.body, headers: resp.headers });
      }).catch(err => reject(err));
      return;
    }
    // Surge / Loon
    if (typeof $httpClient !== 'undefined') {
      const cb = (err, resp, body) => {
        if (err) return reject(err);
        // resp.status 或 resp.statusCode 兼容
        resolve({ status: resp && (resp.status || resp.statusCode || 0), body: body, headers: resp && resp.headers });
      };
      if (method === 'POST') $httpClient.post({ url, headers }, cb);
      else $httpClient.get({ url, headers }, cb);
      return;
    }
    // Node 环境不支持（简单reject）
    reject(new Error('unsupported runtime'));
  });
}

// 通知与结束封装
function notify(title, subtitle, message) {
  try {
    if (typeof $notify === 'function') $notify(title, subtitle, message);
    else console.log(`${title}\n${subtitle}\n${message}`);
  } catch (e) { console.log(title, subtitle, message); }
}
function done(v) { if (typeof $done === 'function') $done(v); }
