// raw-github-preview.js
let headers = $response.headers;

function findKey(obj, name) {
  return Object.keys(obj).find(k => k.toLowerCase() === name.toLowerCase());
}

// 1. 去掉强制下载
const cdKey = findKey(headers, 'Content-Disposition');
if (cdKey) delete headers[cdKey];

// 2. 去掉导致空白的 CSP sandbox
const cspKey = findKey(headers, 'Content-Security-Policy');
if (cspKey) delete headers[cspKey];

// 3. 去掉 nosniff，避免浏览器按老 Content-Type 死板处理
const xctoKey = findKey(headers, 'X-Content-Type-Options');
if (xctoKey) delete headers[xctoKey];

// 4. 去掉可能的 frame 限制（部分 in-app 浏览器用 iframe 承载预览）
const xfoKey = findKey(headers, 'X-Frame-Options');
if (xfoKey) delete headers[xfoKey];

// 5. 统一成纯文本类型，确保内联展示而不是下载
const ctKey = findKey(headers, 'Content-Type');
if (ctKey) {
  headers[ctKey] = 'text/plain; charset=utf-8';
} else {
  headers['Content-Type'] = 'text/plain; charset=utf-8';
}

$response.headers = headers;
$done({ response: $response });
