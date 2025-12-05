
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

if (/^https?:\/\/(interface3\.|music\.)?music\.163\.com\//.test($request.url)) {
  const headers = $request.headers || {};
  const lowerHeaders = {};
  for (const key in headers) {
    lowerHeaders[key.toLowerCase()] = headers[key];
  }

  const cookie = lowerHeaders['cookie'] || '';
  const ua = lowerHeaders['user-agent'] || '';
  const mconfig = lowerHeaders['mconfiginfo'] || '';

  if (cookie && ua) {
    const data = {
      Cookie: cookie,
      UserAgent: ua,
      MConfigInfo: mconfig || null
    };

    const jsonStr = JSON.stringify(data, null, 2);
    // 编码为 data URL（兼容 Safari）
    const encoded = encodeURIComponent(jsonStr);
    const dataUrl = `data:application/json;charset=utf-8,${encoded}`;

    const title = "🎵 网易云信息已捕获";
    const subtitle = `UA长度: ${ua.length} | Cookie长度: ${cookie.length}`;
    const content = "👉 点击本通知，在浏览器中打开并复制全部内容";

    // 发送带 data URL 的通知（Surge 支持点击跳转）
    $notification.post(title, subtitle, content, { url: dataUrl });

    // 同时输出到日志，方便调试
    console.log("[NeteaseExtract] Full data:\n" + jsonStr);
  }
}

$done({});
