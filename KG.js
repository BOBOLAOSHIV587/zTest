
/*
网易云音乐 Cookie / UA / MConfigInfo 提取器（Surge MITM 版）
作者：Qwen
适用：Surge 4+，需开启 music.163.com 域名 MITM

[MITM]
hostname = %APPEND% music.163.com, interface3.music.163.com

[Script]
# 或远程脚本（替换为你的 raw URL）
http-request ^https?:\/\/(interface3\.|music\.)?music\.163\.com\/ script-path=https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/KG.js, requires-body=false, timeout=10, enable=true
*/

// 判断是否为网易云音乐相关域名
if (
  /^https?:\/\/(interface3\.|music\.)?music\.163\.com\//.test($request.url)
) {
  const headers = $request.headers || {};
  
  // 统一转小写便于查找（Surge headers key 可能大小写不一致）
  const lowerHeaders = {};
  for (const key in headers) {
    lowerHeaders[key.toLowerCase()] = headers[key];
  }

  const cookie = lowerHeaders['cookie'] || '';
  const ua = lowerHeaders['user-agent'] || '';
  const mconfig = lowerHeaders['mconfiginfo'] || '';

  // 至少要有 Cookie 和 UA 才认为有效
  if (cookie && ua) {
    const data = {
      Cookie: cookie,
      UserAgent: ua,
      MConfigInfo: mconfig || null
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const summary = `UA长度: ${ua.length} | Cookie长度: ${cookie.length}`;
    const title = '🎵 网易云音乐信息已捕获';

    // 发送通知
    $notification.post(title, summary, jsonStr);

    // 写入剪贴板（Surge 支持）
    $clipboard.set(jsonStr);

    console.log('[NeteaseExtract] Data captured and copied to clipboard.');
  }
}

// 必须返回响应（MITM 脚本要求）
$done({});
