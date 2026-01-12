/*
海角社区自动签到脚本
功能：读取已保存的 Cookie，每日自动签到
支持：Quantumult X / Surge / Loon
作者：Qwen
日期：2026-01-13
*/

const SIGN_IN_URL = "https://haijiao.com/signin";
const USER_CHECK_URL = "https://haijiao.com/user"; // 可用于判断是否登录
const COOKIE_KEY = "haijiao_cookie";

let cookie = "";

// 读取 Cookie
if ($persistentStore) {
  cookie = $persistentStore.read(COOKIE_KEY);
} else if ($prefs) {
  cookie = $prefs.valueForKey(COOKIE_KEY);
} else if (typeof $loon !== "undefined") {
  cookie = $loon.getStorage(COOKIE_KEY);
}

if (!cookie) {
  notify("❌ 海角签到失败", "未找到有效 Cookie，请先登录网站");
  exit();
}

const headers = {
  "Cookie": cookie,
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
  "Referer": "https://haijiao.com/",
  "Accept": "application/json, text/plain, */*",
  "X-Requested-With": "XMLHttpRequest"
};

!(async () => {
  try {
    // 可选：检查是否已登录（访问用户页）
    const userCheck = await request(USER_CHECK_URL, { headers });
    if (!userCheck || userCheck.statusCode !== 200) {
      throw new Error("Cookie 可能已失效，请重新登录");
    }

    // 尝试签到（海角通常返回 HTML 或 JSON，此处按常见 POST 签到处理）
    const signInRes = await request(SIGN_IN_URL, {
      method: "POST",
      headers: headers
    });

    // 判断是否签到成功（根据响应内容）
    const body = signInRes.body || "";
    if (body.includes("今天已经签到") || body.includes("already signed")) {
      notify("✅ 已签到", "海角社区：今日已签到");
    } else if (body.includes("签到成功") || signInRes.statusCode === 200) {
      notify("🎉 签到成功", "海角社区：签到完成");
    } else {
      console.log("签到响应:", body.substring(0, 200));
      throw new Error("签到失败，请检查接口");
    }
  } catch (e) {
    notify("❌ 签到异常", e.message || "未知错误");
  }
})();

// ================== 通用请求封装 ==================
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const method = options.method || "GET";
    const headers = options.headers || {};

    if ($httpClient) {
      // QX / Loon
      $httpClient.request({ url, method, headers }, (err, resp, data) => {
        if (err) reject(err);
        else resolve({ statusCode: resp.status, body: data });
      });
    } else if (typeof $task !== "undefined") {
      // Surge
      $task.fetch({ url, method, headers })
        .then(response => resolve({ statusCode: response.statusCode, body: response.body }))
        .catch(reject);
    } else {
      reject("不支持的环境");
    }
  });
}

// ================== 通知封装 ==================
function notify(title, subtitle) {
  if ($notify) $notify(title, "", subtitle);
  else if ($notification) $notification.post(title, "", subtitle);
  else if (typeof $loon !== "undefined") $loon.notify(title, "", subtitle);
  console.log(`[通知] ${title}: ${subtitle}`);
}

function exit() {
  if ($done) $done();
}
