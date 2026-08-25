/**
 * 修改 raw.githubusercontent.com 的 Response Header
 * 强制让浏览器以文本形式直接预览
 */

let headers = $response.headers;

// 找到并强制替换 Content-Type
Object.keys(headers).forEach(function(key) {
    if (key.toLowerCase() === 'content-type') {
        headers[key] = 'text/plain; charset=utf-8';
    }
});

// 移除可能强制触发下载的 Content-Disposition Header
Object.keys(headers).forEach(function(key) {
    if (key.toLowerCase() === 'content-disposition') {
        delete headers[key];
    }
});

$done({ headers });
