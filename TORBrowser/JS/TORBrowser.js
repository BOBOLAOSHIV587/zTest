/**
 * 将 GitHub Raw 响应体包装为 HTML 格式
 * 彻底解决 Safari 下载弹窗与空白页问题
 */

const body = $response.body;
const contentType = $response.headers['Content-Type'] || $response.headers['content-type'] || '';

// 如果本来就是 HTML，直接返回不处理
if (contentType.includes('text/html')) {
  $done({});
} else {
  // 转义 HTML 标签防止代码被浏览器误解析渲染
  const escapedBody = (body || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 构建标准 HTML 结构
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 12px;
      background: #0d1117;
      color: #c9d1d9;
      font-family: ui-monospace, SFMono-Regular, SF Pro Display, Consolas, monospace;
      font-size: 13px;
      line-height: 1.5;
    }
    pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <pre><code>${escapedBody}</code></pre>
</body>
</html>`;

  $done({
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      },
      body: htmlContent
    }
  });
}
