/*
 * 学术FUN (xueshu.fun) - 获取 Cookie & User-Agent
 * 用法：在 Surge 中作为 http-request 脚本挂载，仅在触发 admin-ajax.php 请求时抓取
 *      （只有这个接口会带上完整的一套 Cookie，包含 wp-admin 权限相关的两个 Cookie）
 * 触发方式：手动打开 xueshu.fun 登录后，去用户中心点一次"签到"按钮
 *          （不用管这次点击是否签到成功，只是为了触发一次带完整 Cookie 的请求）
 */

const domain = "xueshu.fun";

let cookie = $request.headers["Cookie"] || $request.headers["cookie"];
let ua = $request.headers["User-Agent"] || $request.headers["user-agent"];

if (cookie) {
  const oldCookie = $persistentStore.read(`${domain}_cookie`) || "";

  // 只在新 Cookie 更完整（更长）时才覆盖，避免被不完整的请求覆盖掉好的 Cookie
  if (cookie.length >= oldCookie.length) {
    $persistentStore.write(cookie, `${domain}_cookie`);
    if (ua) $persistentStore.write(ua, `${domain}_ua`);

    $notification.post(
      "学术FUN - Cookie 获取成功 ✅",
      "",
      `Cookie 长度: ${cookie.length}\nUA: ${ua || "未获取到"}`
    );
  }
} else {
  $notification.post(
    "学术FUN - 未获取到 Cookie ⚠️",
    "",
    "请确认已在浏览器登录后重新访问首页"
  );
}

$done({});
