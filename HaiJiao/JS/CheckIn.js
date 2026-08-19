/*
 * 海角社区 (haijiao.com) - 自动签到 (修复与结构优化版)
 * 兼容：Quantumult X / Loon / Surge
 */

const $ = new Env("海角社区 - 签到");

const domain = "haijiao.com";
const checkInUrl = "https://www.haijiao.com/api/user/user_sign_in";

// 读取持久化凭据
const userId = $.getdata(`${domain}_uid`);
const token = $.getdata(`${domain}_token`);
const ua = $.getdata(`${domain}_ua`) || "Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Mobile/15E148 Safari/604.1";
let cookie = $.getdata(`${domain}_cookie`) || `mainshow=true; token=${token}; uid=${userId}`;

if (!userId || !token) {
  $.msg("海角社区签到失败 ❌", "", "未检测到凭据，请先用浏览器登录海角社区触发抓取");
  $.done();
} else {
  // 通用 Request Header
  const requestHeaders = {
    "Host": "www.haijiao.com",
    "Accept": "application/json, text/plain, */*",
    "x-user-id": userId,
    "x-user-token": token,
    "mver": "211112203214",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "User-Agent": ua,
    "Origin": "https://www.haijiao.com",
    "Referer": "https://www.haijiao.com/task",
    "Cookie": cookie
  };

  // 1. 发起签到请求
  $.post(
    {
      url: checkInUrl,
      headers: requestHeaders,
      body: ""
    },
    (err, resp, data) => {
      if (err) {
        $.msg("海角社区签到失败 ❌", "", `网络错误: ${err}`);
        $.done();
        return;
      }

      try {
        const json = JSON.parse(data);
        let signResultMsg = "";
        let isSuccess = false;

        if (json.success === true) {
          isSuccess = true;
          let decryptedData = "";
          
          if (json.isEncrypted && json.data) {
            decryptedData = $.base64Decode(json.data);
          } else if (typeof json.data === "string") {
            decryptedData = json.data;
          } else if (typeof json.data === "object") {
            decryptedData = JSON.stringify(json.data);
          }

          // 提取连续签到天数和本次获得金币
          const daysMatch = decryptedData.match(/["']?(?:count|day|days)["']?\s*[:=]\s*["']?(\d+)["']?/i) || decryptedData.match(/(\d+)\s*(天|day)/i);
          const goldMatch = decryptedData.match(/["']?(?:gold|reward|coin)["']?\s*[:=]\s*["']?(\d+)["']?/i) || decryptedData.match(/(\d+)\s*(金币|gold)/i);

          const days = daysMatch ? daysMatch[1] : null;
          const rewardGold = goldMatch ? goldMatch[1] : null;

          let details = [];
          if (days) details.push(`已连续签到 ${days} 天`);
          if (rewardGold) details.push(`获得 ${rewardGold} 金币`);

          signResultMsg = details.length > 0 ? details.join("，") : "签到成功 🎉";
        } else {
          signResultMsg = json.message || "今日已签到过";
        }

        // 2. 获取个人信息（查询账号及总金币）
        getUserInfo(requestHeaders, (userInfo) => {
          let totalGoldStr = "未知";
          let nicknameStr = "未知账号";

          if (userInfo) {
            if (userInfo.gold !== undefined) totalGoldStr = `${userInfo.gold}`;
            if (userInfo.nickname) nicknameStr = userInfo.nickname;
          }

          // 3. 构建规范化的通知格式
          const title = isSuccess ? "海角社区 签到成功 🎉" : "海角社区 签到提示 ℹ️";
          const subtitle = signResultMsg; // 格式: 已连续签到 X 天，获得 X 金币 / 今日已签到过
          const body = `账号: ${nicknameStr}\n💰 账户总金币: ${totalGoldStr}`;

          $.msg(title, subtitle, body);
          $.done();
        });

      } catch (e) {
        $.msg("海角社区 签到异常 ❌", "", `解析响应失败: ${e.message || e}`);
        $.done();
      }
    }
  );
}

/**
 * 请求用户信息接口获取总金币
 */
function getUserInfo(headers, callback) {
  const infoUrl = `https://www.haijiao.com/api/user/info/${userId}`;
  const infoHeaders = { ...headers, "Referer": "https://www.haijiao.com/user/myinfo" };

  $.get(
    {
      url: infoUrl,
      headers: infoHeaders
    },
    (err, resp, data) => {
      if (err || !data) {
        callback(null);
        return;
      }
      try {
        const json = JSON.parse(data);
        if (json.success && json.data) {
          let decoded = json.isEncrypted ? $.base64Decode(json.data) : json.data;
          
          if (typeof decoded === "object") {
            callback(decoded);
            return;
          }

          try {
            const userObj = JSON.parse(decoded);
            callback(userObj);
            return;
          } catch (e) {
            const goldMatch = decoded.match(/["']gold["']\s*:\s*(\d+)/);
            const nameMatch = decoded.match(/["']nickname["']\s*:\s*["']([^"']+)["']/);
            
            callback({
              gold: goldMatch ? goldMatch[1] : undefined,
              nickname: nameMatch ? nameMatch[1] : undefined
            });
            return;
          }
        }
      } catch (e) {
        // ignore error
      }
      callback(null);
    }
  );
}

// ==================== 兼容环境库 (优化 Base64 解码) ====================
function Env(name) {
  this.name = name;
  this.isLoon = typeof $loon !== "undefined";
  this.isSurge = typeof $httpClient !== "undefined" && typeof $loon === "undefined";
  this.isQX = typeof $task !== "undefined";

  this.getdata = (key) => {
    if (this.isQX) return $prefs.valueForKey(key);
    if (this.isLoon || this.isSurge) return $persistentStore.read(key);
  };
  this.msg = (title = name, subt = "", desc = "") => {
    if (this.isQX) $notify(title, subt, desc);
    if (this.isLoon || this.isSurge) $notification.post(title, subt, desc);
  };
  this.get = (options, callback) => {
    if (this.isQX) {
      if (typeof options === "string") options = { url: options };
      options.method = "GET";
      $task.fetch(options).then(
        (res) => callback(null, res, res.body),
        (err) => callback(err.error, null, null)
      );
    }
    if (this.isLoon || this.isSurge) {
      $httpClient.get(options, (err, response, body) => {
        callback(err, response, body);
      });
    }
  };
  this.post = (options, callback) => {
    if (this.isQX) {
      if (typeof options === "string") options = { url: options };
      options.method = "POST";
      $task.fetch(options).then(
        (res) => callback(null, res, res.body),
        (err) => callback(err.error, null, null)
      );
    }
    if (this.isLoon || this.isSurge) {
      $httpClient.post(options, (err, response, body) => {
        callback(err, response, body);
      });
    }
  };
  // 自定义纯 JS 实现的 Base64 解码，确保在 QX/Loon/Surge 下 100% 可用
  this.base64Decode = (str) => {
    if (!str) return "";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let output = "";
    str = String(str).replace(/=+$/, "");
    for (
      let bc = 0, bs, buffer, idx = 0;
      (buffer = str.charAt(idx++));
      ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
        ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
        : 0
    ) {
      buffer = chars.indexOf(buffer);
    }
    try {
      return decodeURIComponent(escape(output));
    } catch (e) {
      return output;
    }
  };
  this.done = (val = {}) => {
    if (this.isQX) $done(val);
    if (this.isLoon || this.isSurge) $done(val);
  };
}
