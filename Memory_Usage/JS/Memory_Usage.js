/*
 * Surge Monitor
 * 实时显示 Surge 自身的内存占用 / 运行时间 / 上下行流量 / 版本信息
 *
 * 数据来源：
 *   $httpAPI('GET', '/v1/traffic')  —— JSON，各网络接口的累计上下行字节数
 *   $httpAPI('GET', '/v1/metrics')  —— Prometheus 纯文本 (iOS 5.22+ / Mac 6.9+)
 *                                       包含 surge_memory_bytes / surge_uptime_seconds /
 *                                       surge_build_info{version,build,system}
 *
 * 为什么用 $httpAPI 而不是 $httpClient：
 *   $httpClient 请求 127.0.0.1 会经过 Surge 自己的网络栈(NE/TUN)，在 iOS 上
 *   经常出现请求连不回自身、以 "Read stream EOF" 报错的问题。
 *   $httpAPI 是进程内直连调用，不走网络栈，也不需要开启/配置 [General] 里的
 *   http-api，因此不存在这个问题，也不需要任何 key / host / port 参数。
 *
 * 若 Surge 版本过旧、没有 /v1/metrics，内存与运行时间会显示为 "-"，
 * 其余信息仍会正常显示。
 */

function api(method, path, body) {
  return new Promise(function (resolve) {
    $httpAPI(method, path, body || {}, function (result) {
      resolve(result);
    });
  });
}

function formatMB(bytes) {
  if (typeof bytes !== 'number' || !isFinite(bytes)) return '-';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function formatUptime(seconds) {
  if (typeof seconds !== 'number' || !isFinite(seconds)) return '-';
  const totalMinutes = Math.floor(seconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h + '小时 ' + m + '分钟';
}

function extractNumber(text, metricName) {
  const re = new RegExp(metricName + '(?:\\{[^}]*\\})?\\s+([0-9.eE+\\-]+)');
  const m = text.match(re);
  return m ? parseFloat(m[1]) : NaN;
}

function extractBuildInfo(text) {
  const info = {
    version: ($environment && $environment['surge-version']) || '-',
    build: ($environment && $environment['surge-build']) || '-',
    system: ($environment && $environment.system) || '-'
  };
  const lineMatch = text && text.match(/surge_build_info\{([^}]*)\}/);
  if (lineMatch) {
    const labels = lineMatch[1];
    const v = labels.match(/version="([^"]*)"/);
    const b = labels.match(/build="([^"]*)"/);
    const s = labels.match(/system="([^"]*)"/);
    if (v) info.version = v[1];
    if (b) info.build = b[1];
    if (s) info.system = s[1];
  }
  return info;
}

(async function () {
  try {
    const args = (function (str) {
      const r = {};
      if (!str) return r;
      str.split('&').forEach(function (p) {
        const i = p.indexOf('=');
        if (i === -1) return;
        r[decodeURIComponent(p.slice(0, i))] = decodeURIComponent(p.slice(i + 1));
      });
      return r;
    })(typeof $argument !== 'undefined' ? $argument : '');

    const icon = args.icon || 'chart.bar.fill';
    const color = args.color || '#0A84FF';

    // ---- 流量：始终通过 JSON 接口获取，稳定可靠 ----
    let inBytes = NaN;
    let outBytes = NaN;
    try {
      const traffic = await api('GET', '/v1/traffic');
      if (traffic && traffic.interface) {
        inBytes = 0;
        outBytes = 0;
        Object.keys(traffic.interface).forEach(function (key) {
          if (key === 'lo0') return; // 排除本地回环
          const iface = traffic.interface[key];
          if (iface) {
            inBytes += iface.in || 0;
            outBytes += iface.out || 0;
          }
        });
      }
    } catch (e) {
      // 忽略，稍后显示为 "-"
    }

    // ---- 内存 / 运行时间 / 版本：来自 Prometheus 指标接口 ----
    let memoryBytes = NaN;
    let uptimeSeconds = NaN;
    let build = extractBuildInfo('');

    try {
      const metrics = await api('GET', '/v1/metrics');
      if (typeof metrics === 'string' && metrics.length > 0) {
        memoryBytes = extractNumber(metrics, 'surge_memory_bytes');
        uptimeSeconds = extractNumber(metrics, 'surge_uptime_seconds');
        build = extractBuildInfo(metrics);
      }
      // 如果 $httpAPI 把结果解析成了对象（理论上不太可能，做个兜底）
      else if (metrics && typeof metrics === 'object') {
        if (typeof metrics.surge_memory_bytes === 'number') memoryBytes = metrics.surge_memory_bytes;
        if (typeof metrics.surge_uptime_seconds === 'number') uptimeSeconds = metrics.surge_uptime_seconds;
      }
    } catch (e) {
      // 版本过旧或接口不存在，忽略，内存/运行时间显示为 "-"
    }

    const content = [
      '内存占用：  ' + formatMB(memoryBytes),
      '',
      '运行时间：  ' + formatUptime(uptimeSeconds),
      '',
      '↓ ' + formatMB(inBytes) + '    ↑ ' + formatMB(outBytes),
      '',
      'Surge ' + build.version + ' · Build ' + build.build + ' · ' + build.system
    ].join('\n');

    $done({
      title: 'Surge Monitor',
      content: content,
      icon: icon,
      'icon-color': color
    });
  } catch (e) {
    $done({
      title: 'Surge Monitor',
      content: '获取数据失败：' + (e && e.message ? e.message : String(e)),
      icon: 'exclamationmark.triangle.fill',
      'icon-color': '#FF3B30'
    });
  }
})();
