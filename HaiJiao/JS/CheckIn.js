/*
 * 海角社区 (haijiao.com) - 自动签到 (优化版)
 * 支持显示：连续签到天数、本次获得金币、账户总金币
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
          
          // 如果返回了加密的 data 字符串，进行 Base64 解码尝试提取明文
          if (json.isEncrypted && json.data) {
            decryptedData = $.base64Decode(json.data);
          } else if (typeof json.data === "string") {
            decryptedData = json.data;
          }

          // 尝试提取签到信息（天数、奖励金币等）
          const daysMatch = decryptedData.match(/(\d+)\s*(天|day)/i) || decryptedData.match(/count["']?\s*:\s*(\d+)/i);
          const goldMatch = decryptedData.match(/(\d+)\s*(金币|gold)/i) || decryptedData.match(/gold["']?\s*:\s*(\d+)/i);

          const days = daysMatch ? daysMatch[1] : null;
          const rewardGold = goldMatch ? goldMatch[1] : null;

          if (days || rewardGold) {
            signResultMsg = `签到成功！${days ? `已连续签到 ${days} 天` : ""}${rewardGold ? `，获得 ${rewardGold} 金币` : ""}`;
          } else {
            signResultMsg = "签到成功 🎉";
          }
        } else {
          signResultMsg = json.message || "今日已签到过";
        }

        // 2. 无论签到成功与否，继续获取最新个人信息（查询总金币数）
        getUserInfo(requestHeaders, (userInfo) => {
          let totalGoldStr = "未知";
          let nicknameStr = "";

          if (userInfo) {
            if (userInfo.gold !== undefined) totalGoldStr = `${userInfo.gold}`;
            if (userInfo.nickname) nicknameStr = `账号: ${userInfo.nickname}\n`;
          }

          // 3. 构建并输出优化后的通知内容
          const title = isSuccess ? "海角社区 签到成功 🎉" : "海角社区 签到提示 ℹ️";
          const subtitle = signResultMsg;
          const body = `${nicknameStr}💰 账户总金币: ${totalGoldStr}`;

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
          
          // 尝试解析解密后的 JSON 数据
          try {
            const userObj = JSON.parse(decoded);
            callback(userObj);
            return;
          } catch (e) {
            // 如果解密出来的不是标准 JSON，正则提取 gold 和 nickname
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

// ==================== 兼容环境库 (Env.js 增强版) ====================
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
  this.base64Decode = (str) => {
    if (!str) return "";
    try {
      if (typeof Atob !== "undefined") return atob(str);
      if (typeof Buffer !== "undefined") return Buffer.from(str, "base64").toString("utf-8");
    } catch (e) {}
    return str;
  };
  this.done = (val = {}) => {
    if (this.isQX) $done(val);
    if (this.isLoon || this.isSurge) $done(val);
  };
}