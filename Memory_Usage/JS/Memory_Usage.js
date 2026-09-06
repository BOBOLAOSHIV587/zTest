/*
 * Surge Monitor（自诊断版）
 *
 * 数据来源：
 *   $httpAPI('GET', '/v1/traffic')  —— JSON，各网络接口累计上下行字节数
 *   $httpAPI('GET', '/v1/metrics')  —— Prometheus 纯文本，内存/运行时间/版本信息
 *
 * 相比上一版的改动：
 *   1. 内存 / 运行时间的指标名匹配放宽：先尝试标准名称
 *      (surge_memory_bytes / surge_uptime_seconds)，找不到时再退化为
 *      "只要这一行包含 mem / uptime 字样就尝试取里面的数字"，
 *      以兼容不同版本/build 之间指标名称可能存在的差异。
 *   2. 如果两种方式都提取不到，会把 /v1/metrics 返回的原始文本节选
 *      直接显示在面板里（而不是简单显示 "-"），方便直接在手机上
 *      看到 Surge 实际返回了什么，用于进一步排查。
 */

function api(method, path, body) {
  return new Promise(function (resolve) {
    $httpAPI(method, path, body || {}, function (result) {
      resolve(result);
    });
  });
}

function formatMB(bytes) {
  if (typeof bytes !== 'number' || !isFinite(bytes)) return null;
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function formatUptime(seconds) {
  if (typeof seconds !== 'number' || !isFinite(seconds)) return null;
  const totalMinutes = Math.floor(seconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h + '小时 ' + m + '分钟';
}

// 严格匹配标准指标名
function extractStrict(text, metricName) {
  const re = new RegExp(metricName + '(?:\\{[^}]*\\})?\\s+([0-9.eE+\\-]+)');
  const m = text.match(re);
  return m ? parseFloat(m[1]) : NaN;
}

// 宽松匹配：整行包含关键字即可，取该行里第一个数字
function extractLoose(text, keyword) {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().indexOf(keyword) !== -1) {
      const m = line.match(/([0-9]+\.?[0-9]*(?:[eE][+\-]?[0-9]+)?)\s*$/);
      if (m) return parseFloat(m[1]);
    }
  }
  return NaN;
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

    // ---- 流量 ----
    let inBytes = NaN;
    let outBytes = NaN;
    try {
      const traffic = await api('GET', '/v1/traffic');
      if (traffic && traffic.interface) {
        inBytes = 0;
        outBytes = 0;
        Object.keys(traffic.interface).forEach(function (key) {
          if (key === 'lo0') return;
          const iface = traffic.interface[key];
          if (iface) {
            inBytes += iface.in || 0;
            outBytes += iface.out || 0;
          }
        });
      }
    } catch (e) {}

    // ---- 内存 / 运行时间 / 版本 ----
    let memoryText = null;
    let uptimeText = null;
    let build = extractBuildInfo('');
    let rawSnippet = null;
    let metricsFetchFailed = false;

    try {
      const metrics = await api('GET', '/v1/metrics');
      console.log('metrics typeof: ' + typeof metrics);

      if (typeof metrics === 'string' && metrics.length > 0) {
        build = extractBuildInfo(metrics);

        let mem = extractStrict(metrics, 'surge_memory_bytes');
        if (!isFinite(mem)) mem = extractLoose(metrics, 'mem');
        memoryText = formatMB(mem);

        let up = extractStrict(metrics, 'surge_uptime_seconds');
        if (!isFinite(up)) up = extractLoose(metrics, 'uptime');
        uptimeText = formatUptime(up);

        if (memoryText === null || uptimeText === null) {
          // 提取失败，保留原始内容片段用于诊断
          rawSnippet = metrics.replace(/\n/g, ' | ').slice(0, 220);
        }
      } else {
        metricsFetchFailed = true;
      }
    } catch (e) {
      metricsFetchFailed = true;
    }

    const lines = [
      '内存占用：  ' + (memoryText !== null ? memoryText : '-'),
      '',
      '运行时间：  ' + (uptimeText !== null ? uptimeText : '-'),
      '',
      '↓ ' + (formatMB(inBytes) || '-') + '    ↑ ' + (formatMB(outBytes) || '-'),
      '',
      'Surge ' + build.version + ' · Build ' + build.build + ' · ' + build.system
    ];

    if (metricsFetchFailed) {
      lines.push('');
      lines.push('(未获取到 /v1/metrics，可能设备版本过旧)');
    } else if (rawSnippet) {
      lines.push('');
      lines.push('诊断信息：' + rawSnippet);
    }

    $done({
      title: 'Surge Monitor',
      content: lines.join('\n'),
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
