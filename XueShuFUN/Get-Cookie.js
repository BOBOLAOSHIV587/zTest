/*
 * 学术FUN (xueshu.fun) - 获取 Cookie & User-Agent
 * 用法：在 Surge 中作为 http-request 脚本挂载在 xueshu.fun 域名下
 * 触发方式：用手机/电脑浏览器打开 xueshu.fun 并登录账号一次，
 *          Surge 会拦截这次请求，自动把 Cookie 和 UA 存起来
 */

const domain = "xueshu.fun";

let cookie = $request.headers["Cookie"] || $request.headers["cookie"];
let ua = $request.headers["User-Agent"] || $request.headers["user-agent"];

if (cookie) {
  $persistentStore.write(cookie, `${domain}_cookie`);
  if (ua) $persistentStore.write(ua, `${domain}_ua`);

  $notification.post(
    "学术FUN - Cookie 获取成功 ✅",
    "",
    `Cookie 长度: ${cookie.length}\nUA: ${ua || "未获取到"}`
  );
} else {
  $notification.post(
    "学术FUN - 未获取到 Cookie ⚠️",
    "",
    "请确认已在浏览器登录后重新访问首页"
  );
}

$done({});
