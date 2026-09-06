/*
 * Surge Monitor
 * 实时显示 Surge 自身的内存占用 / 运行时间 / 上下行流量 / 版本信息
 *
 * 原理：
 * Surge 5.22.0+ (iOS) / 6.9.0+ (Mac) 内置了 Prometheus 格式的
 * 运行时指标接口 GET /v1/metrics，其中包含：
 *   surge_build_info{version,build,system}  版本 / build / 系统
 *   surge_uptime_seconds                    引擎运行时间（秒）
 *   surge_memory_bytes                      引擎进程物理内存占用（字节）
 *   surge_interface_in_bytes_total{...}     各网卡累计下行字节数
 *   surge_interface_out_bytes_total{...}    各网卡累计上行字节数
 * 本脚本请求该接口，解析文本，拼装成面板文案，通过 $done() 返回。
 *
 * 使用前置条件：
 * 1) 在 Surge 配置的 [General] 中开启 HTTP API：
 *      http-api = 你的密钥@127.0.0.1:6171
 * 2) 在 [Script] 中声明本脚本时，通过 argument 传入密钥/主机/端口，例如：
 *      surge-monitor = type=generic,script-path=surge-monitor.js,argument=key=你的密钥&port=6171
 *    如果不传 argument，默认使用 key=examplekey, host=127.0.0.1, port=6171，
 *    请务必按自己的实际配置修改，否则无法连接。
 */

function parseArgument(str) {
  const result = {};
  if (!str) return result;
  str.split('&').forEach(function (pair) {
    if (!pair) return;
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const k = decodeURIComponent(pair.slice(0, idx));
    const v = decodeURIComponent(pair.slice(idx + 1));
    result[k] = v;
  });
  return result;
}

const rawArgument = typeof $argument !== 'undefined' ? $argument : '';
const args = parseArgument(rawArgument);

const apiKey = args.key || 'examplekey';
const host = args.host || '127.0.0.1';
const port = args.port || '6171';

const metricsURL =
  'http://' + host + ':' + port + '/v1/metrics?x-key=' + encodeURIComponent(apiKey);

function formatMB(bytes) {
  if (!isFinite(bytes)) return '- MB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function formatUptime(seconds) {
  if (!isFinite(seconds)) return '-';
  const totalMinutes = Math.floor(seconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h + '小时 ' + m + '分钟';
}

function extractNumber(text, metricName) {
  // 匹配 "metric_name 数值" 或 "metric_name{labels} 数值"
  const re = new RegExp(metricName + '(?:\\{[^}]*\\})?\\s+([0-9.eE+\\-]+)');
  const m = text.match(re);
  return m ? parseFloat(m[1]) : NaN;
}

function sumCounter(text, metricName) {
  const re = new RegExp(metricName + '\\{[^}]*\\}\\s+([0-9.eE+\\-]+)', 'g');
  let total = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    total += parseFloat(m[1]);
  }
  return total;
}

function extractBuildInfo(text) {
  const lineMatch = text.match(/surge_build_info\{([^}]*)\}/);
  const info = {
    version: ($environment && $environment['surge-version']) || '-',
    build: ($environment && $environment['surge-build']) || '-',
    system: ($environment && $environment.system) || '-'
  };
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

function renderError(message) {
  $done({
    title: 'Surge Monitor',
    content: '获取数据失败：' + message + '\n请检查 HTTP API 是否已在 [General] 中开启，\n以及 argument 中的 key / host / port 是否正确。',
    icon: 'exclamationmark.triangle.fill',
    'icon-color': '#FF3B30'
  });
}

$httpClient.get({ url: metricsURL, timeout: 5 }, function (error, response, data) {
  if (error) {
    renderError(String(error));
    return;
  }
  if (!data || typeof data !== 'string') {
    renderError('接口未返回数据');
    return;
  }

  try {
    const memoryBytes = extractNumber(data, 'surge_memory_bytes');
    const uptimeSeconds = extractNumber(data, 'surge_uptime_seconds');
    const inBytes = sumCounter(data, 'surge_interface_in_bytes_total');
    const outBytes = sumCounter(data, 'surge_interface_out_bytes_total');
    const build = extractBuildInfo(data);

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
      icon: 'chart.bar.fill',
      'icon-color': '#0A84FF'
    });
  } catch (e) {
    renderError(e && e.message ? e.message : String(e));
  }
});
