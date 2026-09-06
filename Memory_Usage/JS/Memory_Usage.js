$httpAPI("GET", "v1/system", null, (data) => {
  if (!data || !data.memory) {
    $done({
      title: "Surge Monitor",
      content: "获取系统数据失败",
      icon: "chart.bar.fill",
      "icon-color": "#4285F4"
    });
    return;
  }

  // 1. 内存占用 (MB)
  const memUsage = (data.memory.usage / 1024 / 1024).toFixed(2);

  // 2. 运行时间转换 (小时 / 分钟)
  const totalSeconds = data.system.uptime || 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const uptimeStr = `${hours}小时 ${minutes}分钟`;

  // 3. 流量统计 (MB / GB 自动转换)
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 MB";
    const mb = bytes / 1024 / 1024;
    return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(2)} MB`;
  };
  const download = formatBytes(data.traffic.direct.in + data.traffic.proxy.in);
  const upload = formatBytes(data.traffic.direct.out + data.traffic.proxy.out);

  // 4. Surge 版本号信息
  const version = data.system.version || "Unknown";
  const build = data.system.build || "";
  const platform = data.system.platform || "iOS";
  const versionStr = `Surge ${version} · Build ${build} · ${platform}`;

  // 5. 组合输出面板内容
  const content = `内存占用：  ${memUsage} MB\n\n运行时间：  ${uptimeStr}\n\n↓ ${download}    ↑ ${upload}\n\n${versionStr}`;

  $done({
    title: "Surge Monitor",
    content: content,
    icon: "chart.bar.fill",
    "icon-color": "#4285F4"
  });
});
