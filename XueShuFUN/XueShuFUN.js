/**
 * xueshu.fun 自动签到脚本 (Surge 适配版)
 * 目标网站: https://xueshu.fun/
 */

const $ = new Env("学术Fun签到");

// 您提供的 Cookie
const cookie = "eli%7C1788193426%7CeEuszvsZdNDL4rjF6h19YuWvOmc3WvP3oDt7T3Oall1%7C98ced26eb436ca0e32b13fdc05c10c820ea36de9fe3aef1c3ffd22620d560895";

async function main() {
    // 常见的签到接口路径（如果签到失败，请通过一次抓包确认实际的签到 URL）
    const checkinUrls = [
        "https://xueshu.fun/wp-admin/admin-ajax.php", 
        "https://xueshu.fun/user/checkin",
        "https://xueshu.fun/api/checkin"
    ];

    const myRequest = {
        url: checkinUrls[0], // 默认先尝试第一个，可根据实际修改
        headers: {
            "Cookie": decodeURIComponent(cookie), // 自动对 URL 编码的 Cookie 进行解码
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
            "Referer": "https://xueshu.fun/"
        },
        body: "action=user_checkin" // 常见的 WordPress 签到动作参数
    };

    $.post(myRequest, function(error, response, data) {
        if (error) {
            $.msg("学术Fun签到", "❌ 网络请求失败", error);
            return;
        }

        try {
            // 尝试解析返回的 JSON 数据
            const result = JSON.parse(data);
            if (result.code === 200 || result.success === true || (result.msg && result.msg.includes("成功"))) {
                $.msg("学术Fun签到", "✅ 签到成功", result.msg || result.message || "获得积分奖励");
            } else {
                $.msg("学术Fun签到", "⚠️ 签到提示", result.msg || result.message || data);
            }
        } catch (e) {
            // 如果返回的是 HTML 或非标准 JSON
            if (data.includes("成功") || data.includes("checkin") || data.includes("已签到")) {
                $.msg("学术Fun签到", "✅ 签到可能已成功", "响应包含成功关键词");
            } else {
                $.msg("学术Fun签到", "❌ 签到响应解析失败", data.slice(0, 100));
            }
        }
        // 异步请求完成后结束脚本
        $done();
    });
}

main();

// --- 简易兼容 Surge 的 Env 类 ---
function Env(name) {
    this.name = name;
    this.post = (url, cb) => $httpClient.post(url, cb);
    this.get = (url, cb) => $httpClient.get(url, cb);
    this.msg = (title, subtitle, body) => $notification.post(title, subtitle, body);
}
