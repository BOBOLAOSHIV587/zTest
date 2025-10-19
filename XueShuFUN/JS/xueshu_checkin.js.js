/***************************************
  学术FUN 自动签到脚本
  支持：Quantumult X / Surge / Loon
  从本地读取 Cookie（Key：XUESHU_COOKIE）
***************************************/
const KEY = 'XUESHU_COOKIE';

function getCookie() {
  if (typeof $prefs !== 'undefined') return $prefs.valueForKey(KEY);
  if (typeof $persistentStore !== 'undefined') return $persistentStore.read(KEY);
  return null;
}
const cookie = getCookie();
if (!cookie) {
  notify('学术FUN 签到失败', '', '未找到 Cookie，请先登录网站触发获取脚本');
  return done();
}

const headers = {
  'Cookie': cookie,
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  'Referer': 'https://xueshu.fun/',
  'X-Requested-With': 'XMLHttpRequest',
};
const urls = [
  'https://xueshu.fun/user/checkin',
  'https://xueshu.fun/checkin',
  'https://xueshu.fun/api/checkin'
];

(async () => {
  for (const u of urls) {
    const res = await request('POST', u);
    if (/签到成功|已签到|success/i.test(res.body || '')) {
      notify('学术FUN 签到成功', '', res.body.slice(0, 100));
      return done();
    }
  }
  notify('学术FUN 签到失败', '', '接口未响应成功，可手动签到并反馈接口地址');
  done();
})();

function request(method, url) {
  return new Promise(resolve => {
    if (typeof $task !== 'undefined') {
      $task.fetch({ url, method, headers }).then(resp => resolve(resp));
    } else if (typeof $httpClient !== 'undefined') {
      $httpClient[method === 'POST' ? 'post' : 'get']({ url, headers }, (err, resp, body) => {
        resolve({ status: resp?.status || 0, body });
      });
    } else resolve({});
  });
}
function notify(t, s, m) {
  if (typeof $notify !== 'undefined') $notify(t, s, m);
  else console.log(`${t}\n${s}\n${m}`);
}
function done(v) { if (typeof $done === 'function') $done(v); }
