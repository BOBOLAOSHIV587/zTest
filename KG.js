/*
[rewrite_local]
^https?://(user|app|entry).qtfm.cn/(m-bff|api|u2/api)/(v1|v5)/(channel_verify|personal/?carrier|user).*$ url script-response-body https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/refs/heads/main/KG.js
^https?://app.qtfm.cn/m-bff/v1/audiostreams url script-request-header https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/refs/heads/main/KG.js
^https://ad\.qtfm\.cn/api/ url reject
^https://ip\.qtfm\.cn/ip url reject
^https://adlaunch\.qtfm\.cn/launch url reject
^https://woqt2\.qtfm\.cn/v2/userConfig url reject

[mitm]
hostname = app.qtfm.cn, user.qtfm.cn, recpage-c.qtfm.cn, entry.qtfm.cn, ad.qtfm.cn, ip.qtfm.cn, adlaunch.qtfm.cn, woqt2.qtfm.cn
*/
/*
[Script]
# QX 配置 (在[task]或[gallery]中手动触发，或点击构造器运行)
# 也可以作为 Rewrite 触发，但最推荐手动触发

# Surge / Loon 面板(Panel)或组件配置（点击即执行拉取）
# Surge: type=generic
# Loon: type=generic
*/

// ================= 1. 配置区域 =================
const CONFIG = {
  url: "https://raw.githubusercontent.com/username/repo/main/data.json", // 你的 GitHub Raw 地址
  storageKey: "github_raw_data_key", 
  timeout: 5000 
};

// ================= 2. 主逻辑区域 =================
async function main() {
  const $ = apiAdapter();
  $.log(`\n🔔 收到手动触发指令，开始拉取 GitHub Raw...`);

  const options = {
    url: CONFIG.url,
    headers: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)"
    },
    timeout: CONFIG.timeout
  };

  $.get(options, (error, response, data) => {
    if (error) {
      $.log(`❌ 拉取失败: ${error}`);
      $.notify("GitHub 拉取失败", "网络请求错误", error);
      $.done({ title: "拉取失败", content: "网络错误", icon: "exclamationmark.triangle" });
      return;
    }

    if (response.statusCode === 200) {
      $.log(`🟩 拉取成功！大小: ${data.length} 字节`);
      const saveSuccess = $.setdata(data, CONFIG.storageKey);
      
      if (saveSuccess) {
        $.log(`💾 数据已成功写入本地 [${CONFIG.storageKey}]`);
        $.notify("GitHub 拉取成功", "本地数据已刷新", `大小: ${data.length} 字节`);
        // 返回给 Surge/Loon 面板显示的信息
        $.done({ title: "GitHub 数据更新", content: 成功拉取 ${data.length} 字节, icon: "doc.plaintext" });
      } else {
        $.log(`⚠️ 本地写入失败`);
        $.done({ title: "写入失败", content: "无法保存到本地存储" });
      }
    } else {
      $.log(`❌ 状态码异常: ${response.statusCode}`);
      $.notify("GitHub 拉取失败", "状态码异常", `Status: ${response.statusCode}`);
      $.done({ title: "拉取失败", content: 状态码: ${response.statusCode} });
    }
  });
}

main();

// ================= 3. 核心适配层 =================
function apiAdapter() {
  const isQX = typeof $task !== "undefined";
  const isSurge = typeof $httpClient !== "undefined" && typeof $utils !== "undefined";
  const isLoon = typeof $loon !== "undefined";

  return {
    log: (msg) => console.log(msg),
    notify: (t, s, m) => {
      if (isQX) $notify(t, s, m);
      else $notification.post(t, s, m);
    },
    setdata: (v, k) => {
      if (isQX) return $prefs.setValueForKey(v, k);
      else return $persistentStore.write(v, k);
    },
    get: (opts, cb) => {
      if (isQX) {
        opts.method = "GET";
        $task.fetch(opts).then(
          (r) => cb(null, { statusCode: r.statusCode }, r.body),
          (e) => cb(e.error, null, null)
        );
      } else {
        $httpClient.get(opts, (e, r, b) => cb(e, r, b));
      }
    },
    done: (val = {}) => {
      if (typeof $done !== "undefined") $done(val);
    }
  };
}
