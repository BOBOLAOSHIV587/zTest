/**
 * xueshu.fun 自动抓取 Cookie 与自动签到一体化脚本
 */

const $ = new Env("学术Fun自动化");
const COOKIE_KEY = "xueshu_cookie";
const TARGET_HOST = "xueshu.fun";

// 判断当前是“触发抓取”还是“定时签到”
if (typeof $request !== "undefined") {
    // 【模式一：HTTP 抓包拦截】当访问 xueshu.fun 时自动提取 Cookie
    extractCookie();
} else {
    // 【模式二：Cron 定时任务】自动执行签到
    autoCheckIn();
}

// 1. 提取 Cookie 函数
function extractCookie() {
    const url = $request.url;
    if (url.includes(TARGET_HOST)) {
        const headers = $request.headers;
        // 兼容大小写获取 Cookie
        const cookie = headers["Cookie"] || headers["cookie"];
        
        if (cookie && cookie.includes("bobolaoshi") || cookie) { // 检查是否包含有效特征或任意 Cookie
            const oldCookie = $.read(COOKIE_KEY);
            if (oldCookie !== cookie) {
                $.write(cookie, COOKIE_KEY);
                $.msg("学术Fun", "🍪 Cookie 自动更新成功", "已成功捕获并保存最新的 Cookie！");
            }
        }
    }
    $done({});
}

// 2. 自动签到函数
function autoCheckIn() {
    const cookie = $.read(COOKIE_KEY);
    if (!cookie) {
        $.msg("学术Fun签到", "❌ 签到失败", "本地未找到 Cookie，请先打开一次网页进行自动捕获");
        return;
    }

    const checkinUrl = "https://xueshu.fun/wp-admin/admin-ajax.php"; // 如果有变动可自行调整
    const myRequest = {
        url: checkinUrl,
        headers: {
            "Cookie": cookie,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
            "Referer": "https://xueshu.fun/"
        },
        body: "action=user_checkin"
    };

    $.post(myRequest, function(error, response, data) {
        if (error) {
            $.msg("学术Fun签到", "❌ 网络请求失败", error);
            return;
        }

        try {
            const result = JSON.parse(data);
            if (result.code === 200 || result.success === true || (result.msg && result.msg.includes("成功"))) {
                $.msg("学术Fun签到", "✅ 签到成功", result.msg || "获得积分奖励");
            } else {
                $.msg("学术Fun签到", "⚠️ 签到提示", result.msg || data);
            }
        } catch (e) {
            if (data.includes("成功") || data.includes("checkin") || data.includes("已签到")) {
                $.msg("学术Fun签到", "✅ 签到可能已成功", "响应包含成功关键词");
            } else {
                $.msg("学术Fun签到", "❌ 响应解析失败", data.slice(0, 100));
            }
        }
    });
}

// --- 简易兼容 Surge 的 Env 类 ---
function Env(name) {
    this.name = name;
    this.read = (key) => $persistentStore.read(key);
    this.write = (val, key) => $persistentStore.write(val, key);
    this.post = (url, cb) => $httpClient.post(url, cb);
    this.get = (url, cb) => $httpClient.get(url, cb);
    this.msg = (title, subtitle, body) => $notification.post(title, subtitle, body);
}
