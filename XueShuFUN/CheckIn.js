/*
 * 学术FUN (xueshu.fun) - 自动签到
 * 用法：在 Surge 中作为 cron 定时脚本运行
 *
 * 流程：
 * 1. 用存好的 Cookie 请求 /user/ 页面，从 HTML 中提取最新的 nonce
 * 2. 用这个 nonce 拼出签到请求 body，POST 到 admin-ajax.php
 *
 * !!! 待确认 !!!
 * signAction: admin-ajax.php 的 action 参数名，需要你把抓包 body 内容发我确认
 * nonceParamName: body 里 nonce 字段的参数名（有的叫 nonce，有的叫 _wpnonce，有的叫 security）
 * nonceRegex: 从 /user/ 页面 HTML 里提取 nonce 的正则，可能要按实际页面源码调整
 */

const domain = "xueshu.fun";
const checkInUrl = "https://xueshu.fun/wp-admin/admin-ajax.php";
const userPageUrl = "https://xueshu.fun/user/";

// ==== 已根据实际抓包确认 ====
const signAction = "user_qiandao";        // 确认值，来自抓包
const nonceParamName = "nonce";           // 确认值，来自抓包
const nonceRegex = /go-user-qiandao[^>]*data-nonce="([a-f0-9]+)"/; // 精确匹配签到按钮 (class="go-user-qiandao") 的 data-nonce 属性
// ==================================

const cookie = $persistentStore.read(`${domain}_cookie`);
const ua = $persistentStore.read(`${domain}_ua`) ||
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Mobile/15E148 Safari/604.1";

if (!cookie) {
  $notification.post(
    "学术FUN 签到失败 ❌",
    "",
    "未找到 Cookie，请先打开网站登录一次触发抓取"
  );
  $done({});
} else {
  // 第一步：请求用户中心页面，提取最新 nonce
  $httpClient.get(
    {
      url: userPageUrl,
      headers: {
        "Cookie": cookie,
        "User-Agent": ua,
        "Referer": "https://xueshu.fun/"
      }
    },
    (err1, resp1, html) => {
      if (err1 || !html) {
        $notification.post("学术FUN 签到失败 ❌", "", `获取用户页失败: ${err1 || "空响应"}`);
        $done({});
        return;
      }

      const match = html.match(nonceRegex);
      const nonce = match ? match[1] : null;

      if (!nonce) {
        $notification.post(
          "学术FUN 签到失败 ❌",
          "",
          "未能从用户页提取到 nonce，请检查 nonceRegex 是否需要调整"
        );
        $done({});
        return;
      }

      // 第二步：用 nonce 发起签到请求
      const bodyString = `action=${signAction}&${nonceParamName}=${nonce}`;

      $httpClient.post(
        {
          url: checkInUrl,
          headers: {
            "Cookie": cookie,
            "User-Agent": ua,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "Origin": "https://xueshu.fun",
            "Referer": "https://xueshu.fun/user/"
          },
          body: bodyString
        },
        (err2, resp2, data) => {
          if (err2) {
            $notification.post("学术FUN 签到失败 ❌", "", `请求错误: ${err2}`);
            $done({});
            return;
          }

          let title = "学术FUN 签到结果";
          let subtitle = "";
          let body = data;

          try {
            const json = JSON.parse(data);
            // 返回格式示例: {"status":"0","msg":"今日已签到，请明日再来"}
            subtitle = `status: ${json.status}`;
            body = json.msg || JSON.stringify(json);
          } catch (e) {
            // 非 JSON 返回，原样展示
          }

          $notification.post(title, subtitle, body ? body.slice(0, 200) : `状态码: ${resp2.status}`);
          $done({});
        }
      );
    }
  );
}
