
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

/*
学术Fun (xueshu.fun) 自动签到脚本 - Surge MITM 版
原理：在 /user 页面注入 JS，检测并自动签到
无需账号密码，依赖已登录的 Cookie
*/

const url = $request.url;

if (url.includes('xueshu.fun/user') && $response.statusCode === 200) {
  let body = $response.body;

  if (!body || typeof body !== 'string' || body.includes('<!-- xueshu-checkin-injected -->')) {
    $done({});
    return;
  }

  const injectScript = `
<!-- xueshu-checkin-injected -->
<script>
(function() {
  if (window.xueshuCheckinInjected) return;
  window.xueshuCheckinInjected = true;

  // 创建状态提示
  const notify = (msg, color = '#4CAF50') => {
    let el = document.getElementById('xueshu-checkin-tip');
    if (!el) {
      el = document.createElement('div');
      el.id = 'xueshu-checkin-tip';
      el.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;padding:8px 16px;color:white;border-radius:6px;font-size:14px;font-weight:bold;';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.backgroundColor = color;
  };

  // 检查是否已签到（通过页面文本）
  if (document.body.innerText.includes('签到打卡成功')) {
    notify('✅ 今日已签到', '#2196F3');
    return;
  }

  notify('⏳ 尝试自动签到...');

  // 尝试多个可能的签到接口（按常见顺序）
  const checkinEndpoints = [
    '/wp-json/fun/v1/checkin',
    '/?action=checkin',
    '/ajax/checkin.php'
  ];

  const sendCheckin = async (url) => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'same-origin',
        body: ''
      });
      const data = await res.json().catch(() => ({}));
      
      if (
        res.ok &&
        (data.success || 
         data.message?.includes('成功') || 
         data.msg?.includes('签到') ||
         JSON.stringify(data).includes('diamond'))
      ) {
        return { success: true, data };
      }
      return { success: false, data };
    } catch (err) {
      return { success: false, error: err.toString() };
    }
  };

  // 依次尝试
  for (const endpoint of checkinEndpoints) {
    const result = await sendCheckin(endpoint);
    if (result.success) {
      notify('🎉 签到成功！', '#4CAF50');
      console.log('[XueshuFun] Checkin success:', result.data);
      setTimeout(() => location.reload(), 1500);
      return;
    }
  }

  notify('❌ 签到失败', '#f44336');
  console.warn('[XueshuFun] All checkin endpoints failed.');
})();
</script>
`;

  body = body.replace(/<\/body>/i, injectScript + '</body>');
  $done({ body });
} else {
  $done({});
}
