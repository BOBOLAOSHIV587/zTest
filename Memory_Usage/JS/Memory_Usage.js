/*
 * Surge Monitor
 *
 * 内存占用 / 运行时间 / 版本信息：
 *   GET /v1/metrics (Prometheus 纯文本)，通过 $httpClient 请求。
 *   关键点：显式指定 policy: "DIRECT"，强制这个请求跳过当前的出站
 *   策略判断、直接发往 127.0.0.1，避免被规则送去远程代理节点导致
 *   连接失败 ("Read stream EOF")。
 *
 * 上下行流量：
 *   GET /v1/traffic（JSON），通过 $httpAPI 调用（进程内直连，
 *   不需要额外配置，比 $httpClient 更省心，这个接口本身就是 JSON
 *   所以 $httpAPI 能正常工作）。
 *
 * 使用前置条件（仅内存/运行时间这部分需要）：
 *   在 Surge 的 [General] 中开启 HTTP API：
 *     http-api = 你的密钥@127.0.0.1:6171
 *   然后在 argument 中传入 key（以及如果端口不是默认 6171 也传 port）：
 *     argument=key=你的密钥&port=6171
 */

function httpAPI(method, path, body) {
  return new Promise(function (resolve) {
    $httpAPI(method, path, body || {}, function (result) {
      resolve(result);
    });
  });
}

function httpClientGet(options) {
  return new Promise(function (resolve, reject) {
    $httpClient.get(options, function (error, response, data) {
      if (error) {
        reject(new Error(String(error)));
        return;
      }
      resolve(data);
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

function extractStrict(text, metricName) {
  const re = new RegExp(metricName + '(?:\\{[^}]*\\})?\\s+([0-9.eE+\\-]+)');
  const m = text.match(re);
  return m ? parseFloat(m[1]) : NaN;
}

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
  const apiKey = args.key || 'examplekey';
  const host = args.host || '127.0.0.1';
  const port = args.port || '6171';

  // ---- 流量：走 $httpAPI，稳定可靠 ----
  let inBytes = NaN;
  let outBytes = NaN;
  try {
    const traffic = await httpAPI('GET', '/v1/traffic');
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

  // ---- 内存 / 运行时间 / 版本：走 $httpClient + policy DIRECT ----
  let memoryText = null;
  let uptimeText = null;
  let build = extractBuildInfo('');
  let metricsError = null;
  let rawSnippet = null;

  try {
    const url =
      'http://' + host + ':' + port + '/v1/metrics?x-key=' + encodeURIComponent(apiKey);

    const data = await httpClientGet({
      url: url,
      timeout: 8,
      policy: 'DIRECT',
      headers: { Connection: 'close' }
    });

    if (typeof data === 'string' && data.length > 0) {
      build = extractBuildInfo(data);

      let mem = extractStrict(data, 'surge_memory_bytes');
      if (!isFinite(mem)) mem = extractLoose(data, 'mem');
      memoryText = formatMB(mem);

      let up = extractStrict(data, 'surge_uptime_seconds');
      if (!isFinite(up)) up = extractLoose(data, 'uptime');
      uptimeText = formatUptime(up);

      if (memoryText === null || uptimeText === null) {
        rawSnippet = data.replace(/\n/g, ' | ').slice(0, 220);
      }
    } else {
      metricsError = '接口返回为空';
    }
  } catch (e) {
    metricsError = e && e.message ? e.message : String(e);
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

  if (metricsError) {
    lines.push('');
    lines.push('metrics 请求失败：' + metricsError);
    lines.push('请确认 [General] 已开启 http-api，且 argument 中的 key/port 正确');
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
})();
