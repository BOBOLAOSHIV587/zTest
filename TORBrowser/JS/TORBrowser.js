// raw-github-preview.js
// 修复 raw.githubusercontent.com 在手机浏览器只能下载不能预览的问题

let headers = $response.headers;

function findKey(obj, name) {
  return Object.keys(obj).find(k => k.toLowerCase() === name.toLowerCase());
}

// 删除强制下载头
const cdKey = findKey(headers, 'Content-Disposition');
if (cdKey) delete headers[cdKey];

// 统一 Content-Type，避免按未知类型触发下载
const ctKey = findKey(headers, 'Content-Type');
if (ctKey) {
  headers[ctKey] = 'text/plain; charset=utf-8';
} else {
  headers['Content-Type'] = 'text/plain; charset=utf-8';
}

$response.headers = headers;
$done({ response: $response });
