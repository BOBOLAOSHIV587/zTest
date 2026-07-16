



/**
 * Surge 节点连通性及阻断检测脚本
 * 适配自 Quantumult X 脚本 (作者：https://github.com/RavelloH)
 * * 功能：
 * 检测当前策略组选中的节点是否可连接，并判断是否被运营商/GFW 阻断

script-path=https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/refs/heads/main/KG.js

 */

// ====== 配置项 ======
const TARGET_GROUP = "PROXY"; // 你想要检测的 Surge 策略组名称（请根据实际情况修改，如 "Proxy"、"节点选择" 等）
const IP_API = "http://ip-api.com/json?lang=zh-CN";
const CHECK_HOST = "https://check-host.net";
const TIMEOUT = 8000;

// ====== 异步 HTTP 封装 ======
function httpFetch(options) {
  return new Promise((resolve, reject) => {
    $httpClient.get(options, function(error, response, data) {
      if (error) {
        reject(error);
      } else {
        resolve({ body: data, status: response.status });
      }
    });
  });
}

function surgeApi(method, path, body) {
  return new Promise((resolve) => {
    $surge.httpAPI(method, path, body, (result) => {
      resolve(result);
    });
  });
}

async function run() {
  let host = null, port = null, nodeName = "未知节点";

  try {
    // 1. 获取当前选中的节点名称
    const groupData = await surgeApi("GET", "/v1/policy_groups", null);
    if (groupData && groupData[TARGET_GROUP]) {
      nodeName = groupData[TARGET_GROUP];
    } else {
      return done(`未找到策略组: ${TARGET_GROUP}`);
    }

    // 2. 获取该节点的具体配置 (IP/Port)
    const policyData = await surgeApi("GET", `/v1/policies/detail?policy_name=${encodeURIComponent(nodeName)}`, null);
    if (policyData && policyData.server) {
      host = policyData.server;
      port = policyData.port;
    }
  } catch (e) {
    // 若获取失败则继续，但无法进行远端探测
  }

  startChecks(nodeName, host, port);
}

function startChecks(tag, host, port) {
  // 本地代理测试 (走选中的节点)
  var pA = httpFetch({ url: IP_API, policy: tag, timeout: TIMEOUT })
    .then(function(r) { return { src: "node", ok: true, data: JSON.parse(r.body) }; })
    .catch(function() { return { src: "node", ok: false }; });

  // 本地直连测试
  var pB = httpFetch({ url: IP_API, timeout: TIMEOUT })
    .then(function(r) { return { src: "direct", ok: true, data: JSON.parse(r.body) }; })
    .catch(function() { return { src: "direct", ok: false }; });

  // 远端 TCP 探测
  var pC;
  if (host && port) {
    var target = host + ":" + port;
    var checkUrl = CHECK_HOST + "/check-tcp?host=" + encodeURIComponent(target) + "&max_nodes=10";
    pC = httpFetch({ url: checkUrl, headers: { "Accept": "application/json" }, timeout: TIMEOUT })
      .then(function(r) {
        var d = JSON.parse(r.body);
        if (!d.ok || !d.request_id) return { src: "remote", ok: false, error: "远端提交失败" };
        var rid = d.request_id;
        var nodeList = d.nodes || {};
        var nodeNames = Object.keys(nodeList);
        var countryMap = {};
        nodeNames.forEach(function(n) {
          var info = nodeList[n];
          if (info && info.length >= 1) countryMap[n] = info[0];
        });
        return new Promise(function(resolve) {
          setTimeout(function() {
            httpFetch({ url: CHECK_HOST + "/check-result/" + rid, headers: { "Accept": "application/json" }, timeout: TIMEOUT })
              .then(function(r2) {
                var res = JSON.parse(r2.body);
                var reachable = false;
                var items = [];
                nodeNames.forEach(function(n) {
                  var cc = countryMap[n] || "";
                  var flag = cc ? getFlag(cc) : "🌍";
                  var nr = res[n];
                  var ms = '--.--ms';
                  if (nr && Array.isArray(nr) && nr.length > 0 && nr[0].time !== undefined) {
                    reachable = true;
                    ms = formatMs(nr[0].time * 1000);
                  }
                  items.push({ flag: flag, ms: ms });
                });
                resolve({ src: "remote", ok: reachable, data: items });
              }, function() {
                resolve({ src: "remote", ok: false, error: "远端查询失败" });
              });
          }, 3500);
        });
      })
      .catch(function() { return { src: "remote", ok: false, error: "远端请求失败" }; });
  } else {
    pC = Promise.resolve({ src: "remote", ok: false, error: "无节点地址信息" });
  }

  Promise.allSettled([pA, pB, pC]).then(function(results) {
    render(tag, results[0].value, results[1].value, results[2].value);
  });
}

function formatMs(ms) {
  if (ms >= 10000) return Math.floor(ms) + "ms";
  if (ms >= 1000) return Math.floor(ms).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "ms";
  if (ms >= 100) return ms.toFixed(1) + "ms";
  if (ms >= 10) return ms.toFixed(2) + "ms";
  return ms <= 0 ? "0.00ms" : ms.toFixed(3) + "ms";
}

function render(tag, node, direct, remote) {
  var nOk = node && node.ok;
  var dOk = direct && direct.ok;
  var rOk = remote && remote.ok;

  var parts = [];

  // 标题与当前节点
  parts.push(`📍 当前检测节点: ${tag || "未知"}`);
  parts.push("--------------------------------");

  // 节点代理
  var nodeStr = `ℹ️ 节点代理: ` + (nOk ? "✅ 正常" : "❌ 不可达");
  if (nOk && node.data) {
    var d = node.data;
    nodeStr += `\n   IP: ${d.query}`;
    nodeStr += `\n   位置: ${[d.country, d.regionName, d.city].filter(Boolean).join(" - ")}`;
    nodeStr += `\n   ISP: ${d.isp || "未知"}`;
  }
  parts.push(nodeStr);

  // 本机网络
  parts.push(`🌐 本机网络: ` + (dOk ? "✅ 正常" : "❌ 异常"));

  // 远端探测
  var remoteStr = `📡 远端探测: ` + (rOk ? "✅ 可达" : "❌ 不可达");
  if (remote && remote.data && remote.data.length > 0) {
    var items = remote.data;
    var row = [];
    for (var i = 0; i < items.length; i += 2) {
      var left = items[i];
      var right = i + 1 < items.length ? items[i + 1] : null;
      var line = `   ${left.flag} ${left.ms}`;
      if (right) {
        line += `   |   ${right.flag} ${right.ms}`;
      }
      row.push(line);
    }
    remoteStr += "\n" + row.join("\n");
  } else if (remote && remote.error) {
    remoteStr += `\n   提示: ${remote.error}`;
  }
  parts.push(remoteStr);

  parts.push("--------------------------------");

  // 诊断结论
  var conclusion = "📋 诊断结论: ";
  if (!dOk) {
    conclusion += "⚠️ 本机网络异常";
  } else if (nOk && rOk) {
    conclusion += "✅ 节点完全正常";
  } else if (!nOk && rOk && dOk) {
    conclusion += "🚫 疑似被运营商/GFW 阻断 (外部可达, 本地不通)";
  } else if (!nOk && !rOk && dOk) {
    conclusion += "💤 节点已离线 (全球不可达)";
  } else {
    conclusion += "❓ 数据不完整";
  }
  parts.push(conclusion);

  $done({
    title: "🌐 节点阻断检测",
    content: parts.join("\n\n"),
    icon: "bolt.horizontal.circle.fill",
    "icon-color": nOk ? "#2ecc71" : "#e74c3c"
  });
}

function getFlag(cc) {
  if (!cc || cc.length !== 2) return "🌍";
  var cp = cc.toUpperCase().split('').map(function(c) { return 127397 + c.charCodeAt(); });
  return String.fromCodePoint.apply(null, cp);
}

function done(msg) {
  $done({
    title: "🌐 节点阻断检测",
    content: `🛑 出错: ${msg}`,
    icon: "exclamationmark.triangle.fill",
    "icon-color": "#e67e22"
  });
}

run();
