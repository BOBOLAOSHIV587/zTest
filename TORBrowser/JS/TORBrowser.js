/**
 * 掌上公交 - 广告接口响应处理脚本
 * 适用于：Surge / Loon / QuantumultX
 * 功能：将广告接口返回的 JSON 中广告数据字段置空，
 *       避免 App 因接口 reject 导致崩溃或白屏
 */

// ========== 兼容三端的响应体获取 ==========
let body;
if (typeof $response !== "undefined") {
  // Surge / Loon
  body = $response.body;
} else if (typeof $res !== "undefined") {
  // QuantumultX
  body = $res.body;
}

if (body) {
  try {
    let obj = JSON.parse(body);

    // 常见广告字段清理
    const adKeys = [
      "ad", "ads", "adList", "adData", "adInfo",
      "banner", "bannerList", "bannerData",
      "splash", "splashAd", "splashData",
      "popup", "popupAd", "popupData",
      "advertise", "advertisement", "advert",
      "floatAd", "floatBanner",
      "openScreenAd",   // 开屏广告
      "feedAd",         // 信息流广告
      "nativeAd",       // 原生广告
      "interstitialAd", // 插屏广告
    ];

    /**
     * 递归遍历 JSON，将广告字段置为空数组/null
     */
    function clearAds(obj) {
      if (typeof obj !== "object" || obj === null) return obj;

      for (const key of Object.keys(obj)) {
        const lowerKey = key.toLowerCase();

        if (adKeys.some(k => lowerKey === k.toLowerCase())) {
          // 若值是数组则置为空数组，否则置 null
          obj[key] = Array.isArray(obj[key]) ? [] : null;
          console.log(`[掌上公交去广告] 已清除字段: ${key}`);
        } else if (typeof obj[key] === "object") {
          obj[key] = clearAds(obj[key]);
        }
      }
      return obj;
    }

    obj = clearAds(obj);
    body = JSON.stringify(obj);

  } catch (e) {
    // 非 JSON 格式（如开屏广告图片URL文本）直接清空
    console.log("[掌上公交去广告] 非JSON响应，已直接丢弃广告内容");
    body = "{}";
  }
}

// ========== 兼容三端的响应回传 ==========
if (typeof $response !== "undefined") {
  // Surge / Loon
  $done({ body });
} else if (typeof $res !== "undefined") {
  // QuantumultX
  $done({ response: { body } });
} else {
  $done({});
}
