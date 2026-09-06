// 获取面板配置中传入的 key 参数
const key = typeof $argument !== "undefined" && $argument.key ? $argument.key : "";

$httpAPI("GET", "v1/system", { key: key }, (data, error) => {
  if (error) {
    $done({
      title: "Surge Monitor",
      content: `API 调用失败: ${error}`,
      icon: "exclamationmark.triangle.fill",
      "icon-color": "#FF3B30"
    });
    return;
  }

  if (!data || !data.memory) {
    $done({
      title: "Surge Monitor",
      content: "无法读取内存数据，请检查 API 密钥是否正确",
      icon: "exclamationmark.triangle.fill",
      "icon-color": "#FF9500"
    });
    return;
  }

  // 1. 内存占用 (MB)
  const memUsage = (data.memory.usage / 1024 / 1024).toFixed(2);

  // 2. 运行时间转换
  const totalSeconds = data.system.uptime || 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const uptimeStr = `${hours}小时 ${minutes}分钟`;

  // 3. 流量统计 (MB / GB 转换)
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 MB";
    const mb = bytes / 1024 / 1024;
    return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(2)} MB`;
  };

  const directIn = data.traffic?.direct?.in || 0;
  const proxyIn = data.traffic?.proxy?.in || 0;
  const directOut = data.traffic?.direct?.out || 0;
  const proxyOut = data.traffic?.proxy?.out || 0;

  const download = formatBytes(directIn + proxyIn);
  const upload = formatBytes(directOut + proxyOut);

  // 4. Surge 版本号信息
  const version = data.system.version || "Unknown";
  const build = data.system.build || "";
  const platform = data.system.platform || "iOS";
  const versionStr = `Surge ${version} · Build ${build} · ${platform}`;

  // 5. 组合输出内容
  const content = `内存占用：  ${memUsage} MB\n\n运行时间：  ${uptimeStr}\n\n↓ ${download}    ↑ ${upload}\n\n${versionStr}`;

  $done({
    title: "Surge Monitor",
    content: content,
    icon: "chart.bar.fill",
    "icon-color": "#4285F4"
  });
});
