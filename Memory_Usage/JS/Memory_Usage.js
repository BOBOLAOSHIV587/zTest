// 兼容不同的 argument 解析形式
function getApiKey() {
  if (typeof $argument === "undefined" || !$argument) return "";
  if (typeof $argument === "string") {
    // 兼容 argument=key=xxxx 或 argument=xxxx
    const match = $argument.match(/key=([^&]+)/);
    return match ? match[1] : $argument;
  }
  if (typeof $argument === "object") {
    return $argument.key || $argument.apiKey || "";
  }
  return "";
}

const apiKey = getApiKey();

// 请求 Surge 系统信息 API
$httpAPI("GET", "v1/system", { key: apiKey }, (data, error) => {
  if (error) {
    $done({
      title: "Surge Monitor",
      content: `API 连接失败: ${JSON.stringify(error)}`,
      icon: "exclamationmark.triangle.fill",
      "icon-color": "#FF3B30"
    });
    return;
  }

  // 1. 获取内存数据（兼容不同的数据层级）
  const memBytes = data?.memory?.usage || data?.memoryUsage || 0;
  if (!memBytes && (!data || Object.keys(data).length === 0)) {
    $done({
      title: "Surge Monitor",
      content: "返回数据为空，请检查密码及端口设置",
      icon: "exclamationmark.triangle.fill",
      "icon-color": "#FF9500"
    });
    return;
  }

  const memUsage = (memBytes / 1024 / 1024).toFixed(2);

  // 2. 运行时间转换
  const totalSeconds = data?.system?.uptime || data?.uptime || 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const uptimeStr = `${hours}小时 ${minutes}分钟`;

  // 3. 流量统计
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 MB";
    const mb = bytes / 1024 / 1024;
    return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(2)} MB`;
  };

  const directIn = data?.traffic?.direct?.in || 0;
  const proxyIn = data?.traffic?.proxy?.in || 0;
  const directOut = data?.traffic?.direct?.out || 0;
  const proxyOut = data?.traffic?.proxy?.out || 0;

  const download = formatBytes(directIn + proxyIn);
  const upload = formatBytes(directOut + proxyOut);

  // 4. Surge 版本号信息
  const version = data?.system?.version || data?.version || "Unknown";
  const build = data?.system?.build || data?.build || "";
  const platform = data?.system?.platform || "iOS";
  const versionStr = `Surge ${version} · Build ${build} · ${platform}`;

  // 5. 组合面板输出
  const content = `内存占用：  ${memUsage} MB\n\n运行时间：  ${uptimeStr}\n\n↓ ${download}    ↑ ${upload}\n\n${versionStr}`;

  $done({
    title: "Surge Monitor",
    content: content,
    icon: "chart.bar.fill",
    "icon-color": "#4285F4"
  });
});
