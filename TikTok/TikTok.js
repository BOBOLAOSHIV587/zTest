/**
 * TikTok 区域解锁脚本 (Surge 版)
 * 作者: Claude
 * 版本: 1.0.0
 *
 * 功能: 通过修改请求头，将 TikTok 播放区域伪装为指定地区
 * 支持区域: US, UK, JP, KR, AU, CA, SG, TW
 *
 * 使用前提：
 *   - 需要配合对应地区的代理节点使用
 *   - 节点 IP 归属地与目标区域一致时效果最佳
 */

// ============================================================
// 配置区域 - 按需修改
// ============================================================

// 目标解锁区域，可选: "US" | "UK" | "JP" | "KR" | "AU" | "CA" | "SG" | "TW"
const TARGET_REGION = "TW";

// 是否打印调试日志 (调试完毕后建议设为 false)
const DEBUG = false;

// ============================================================
// 区域配置映射
// ============================================================

const REGION_CONFIG = {
  US: { region: "US", market: "US", lang: "en", tz: "America/New_York" },
  UK: { region: "GB", market: "GB", lang: "en", tz: "Europe/London" },
  JP: { region: "JP", market: "JP", lang: "ja", tz: "Asia/Tokyo" },
  KR: { region: "KR", market: "KR", lang: "ko", tz: "Asia/Seoul" },
  AU: { region: "AU", market: "AU", lang: "en", tz: "Australia/Sydney" },
  CA: { region: "CA", market: "CA", lang: "en", tz: "America/Toronto" },
  SG: { region: "SG", market: "SG", lang: "en", tz: "Asia/Singapore" },
  TW: { region: "TW", market: "TW", lang: "zh", tz: "Asia/Taipei" },
};

// ============================================================
// 主逻辑
// ============================================================

(function () {
  const config = REGION_CONFIG[TARGET_REGION];

  if (!config) {
    log(`[TikTok Unlock] 不支持的目标区域: ${TARGET_REGION}`);
    $done({});
    return;
  }

  const url = $request.url;
  const headers = Object.assign({}, $request.headers);

  log(`[TikTok Unlock] 拦截请求: ${url}`);
  log(`[TikTok Unlock] 目标区域: ${TARGET_REGION}`);

  // 修改区域相关请求头
  headers["X-TT-Market-Region"] = config.market;
  headers["X-TT-Location"] = config.region;
  headers["X-TT-Region"] = config.region;
  headers["X-TT-Locale"] = config.lang;
  headers["X-TT-Timezone"] = config.tz;

  // 修改 accept-language
  headers["accept-language"] = `${config.lang}-${config.region},${config.lang};q=0.9`;

  // 移除可能暴露本地区域的请求头
  const headersToRemove = [
    "X-TT-Client-Region",
    "X-TT-Device-Region",
    "X-TT-Idc",
  ];
  headersToRemove.forEach((h) => {
    if (headers[h]) {
      log(`[TikTok Unlock] 移除头: ${h}`);
      delete headers[h];
    }
  });

  // 修改 URL 参数中的 region 字段
  let modifiedUrl = url;
  try {
    const urlObj = new URL(url);
    const paramsToModify = ["region", "market_region", "idc"];
    paramsToModify.forEach((param) => {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.set(
          param,
          param === "idc" ? config.region.toLowerCase() : config.region
        );
      }
    });
    modifiedUrl = urlObj.toString();
  } catch (e) {
    log(`[TikTok Unlock] URL 解析失败，跳过参数修改: ${e}`);
  }

  log(`[TikTok Unlock] 修改完成，放行请求`);

  $done({ url: modifiedUrl, headers });
})();

// ============================================================
// 工具函数
// ============================================================

function log(msg) {
  if (DEBUG) {
    console.log(msg);
  }
}
