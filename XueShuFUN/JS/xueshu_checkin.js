const loginUrl = "https://xueshu.fun/wp-login.php";
const signUrl = "https://xueshu.fun/wp-admin/admin-ajax.php";

const username = "2500697492@qq.com";  // 您的账号
const password = "xuanli97325";  // 您的密码

const loginBody = `log=${encodeURIComponent(username)}&pwd=${encodeURIComponent(password)}&wp-submit=Log+In&redirect_to=https%3A%2F%2Fxueshu.fun%2Fuser%2F&testcookie=1`;

const loginHeaders = {
  "Content-Type": "application/x-www-form-urlencoded",
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
};

$httpClient.post({ url: loginUrl, headers: loginHeaders, body: loginBody }, (err, resp, data) => {
  if (err || (resp.status !== 302 && resp.status !== 200)) {  // 登录成功通常重定向302，或200
    $notify("学术Fun登录失败", "", err ? err : "状态码: " + resp.status);
    $done();
    return;
  }

  // 提取Cookie
  let cookie = resp.headers["Set-Cookie"] || "";
  if (Array.isArray(cookie)) {
    cookie = cookie.join("; ");
  }

  if (!cookie) {
    $notify("学术Fun登录失败", "", "未获取到Cookie");
    $done();
    return;
  }

  // 签到请求（基于常见WP插件，action=user_checkin）
  const signBody = "action=user_checkin";  // 如果不同，请调整为实际action（如cao_checkin或checkin）
  const signHeaders = {
    "Content-Type": "application/x-www-form-urlencoded",
    "Cookie": cookie,
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    "Referer": "https://xueshu.fun/user/"
  };

  $httpClient.post({ url: signUrl, headers: signHeaders, body: signBody }, (err2, resp2, data2) => {
    if (err2 || resp2.status !== 200) {
      $notify("学术Fun签到失败", "", err2 ? err2 : "状态码: " + resp2.status);
    } else {
      try {
        const result = JSON.parse(data2);
        const message = result.msg || result.message || data2;  // 假设返回JSON有msg或message字段
        $notify("学术Fun签到成功", "", message);
      } catch (e) {
        $notify("学术Fun签到结果", "", data2);  // 非JSON直接通知
      }
    }
    $done();
  });
});
