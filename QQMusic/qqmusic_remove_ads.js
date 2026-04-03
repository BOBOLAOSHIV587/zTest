/**
 * QQ音乐去广告脚本
 * 适用于：Surge / Loon / QuantumultX
 * 
 * QQ音乐使用 musicu.fcg 聚合接口，广告数据与正常内容
 * 混合在同一个 JSON 响应中返回，必须用脚本过滤广告字段，
 * 不能直接 reject（否则导致首页白屏/无内容）。
 * 
 * 处理的广告类型：
 *  - 开屏广告 (SplashAd / splash_ad)
 *  - 首页 Banner 广告 (AdBanner / BannerAd)
 *  - 播放页浮层广告 (FloatAd / PlayerAd)
 *  - 播放页专辑封面广告 (AlbumCoverAd)
 *  - 推广弹窗 (PopupAd / PopupActivity / ActivityCard)
 *  - 信息流广告 (FeedAd / NativeAd)
 *  - 会员推广 (VipAd / svip_promote)
 */

// ─── 广告字段关键词（大小写不敏感匹配 key 名）─────────────────
const AD_KEY_PATTERNS = [
  // 通用广告字段
  /^ad$/i,
  /^ads$/i,
  /adlist/i,
  /addata/i,
  /adinfo/i,
  /adcard/i,
  /adbanner/i,
  /bannerad/i,
  /floatad/i,
  /playerad/i,
  /albumcoverad/i,
  /popupad/i,
  /nativead/i,
  /feedad/i,
  /splashad/i,
  /splash_ad/i,
  /openscreen/i,
  /interstitial/i,

  // 推广/活动弹窗
  /popupactivity/i,
  /activitycard/i,
  /hotactivity/i,
  /promotioncard/i,
  /promote_card/i,

  // 会员推广
  /vipad/i,
  /svip_promote/i,
  /vippromote/i,
  /vip_banner/i,
  /vipbanner/i,

  // 摇一摇/互动广告
  /shakead/i,
  /shake_ad/i,
  /interactad/i,

  // 视频贴片广告
  /prerolls/i,
  /preroll_ad/i,
  /video_ad/i,
  /videoad/i,
];

// ─── 广告值特征（用于检测值内容是否为广告）───────────────────────
const AD_VALUE_PATTERNS = [
  /adtype/i,
  /ad_type/i,
  /creative_type/i,
  /landing_url/i,
  /click_url/i,
  /impression_url/i,
  /ad_track/i,
];

/**
 * 判断一个 key 是否是广告字段
 */
function isAdKey(key) {
  return AD_KEY_PATTERNS.some(p => p.test(key));
}

/**
 * 判断一个对象的值内容是否明显是广告对象
 */
function isAdObject(obj) {
  if (typeof obj !== 'object' || obj === null) return false;
  const keys = Object.keys(obj);
  return AD_VALUE_PATTERNS.some(p =>
    keys.some(k => p.test(k))
  );
}

/**
 * 递归遍历 JSON，将广告字段清空
 * 数组 → []，对象 → null，字符串 → ""
 */
function removeAds(obj, depth = 0) {
  if (depth > 10) return obj; // 防止无限递归
  if (typeof obj !== 'object' || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => removeAds(item, depth + 1));
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isAdKey(key)) {
      // 广告字段：数组置空，对象置null，其他置null
      result[key] = Array.isArray(value) ? [] : null;
      console.log(`[QQ音乐去广告] 已清除: ${key}`);
    } else if (typeof value === 'object' && value !== null && isAdObject(value)) {
      // 内容特征匹配为广告对象
      result[key] = null;
      console.log(`[QQ音乐去广告] 已清除广告对象: ${key}`);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = removeAds(value, depth + 1);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// ─── 获取响应体 ────────────────────────────────────────────────
let body;
if (typeof $response !== 'undefined') {
  body = $response.body; // Surge / Loon
} else if (typeof $res !== 'undefined') {
  body = $res.body;      // QuantumultX
}

if (body) {
  try {
    // QQ音乐部分接口响应是 JSONP 格式，需要提取 JSON 部分
    let jsonStr = body;
    let jsonpCallback = null;

    const jsonpMatch = body.match(/^([a-zA-Z_$][0-9a-zA-Z_$]*)\(([\s\S]*)\);?$/);
    if (jsonpMatch) {
      jsonpCallback = jsonpMatch[1];
      jsonStr = jsonpMatch[2];
    }

    let obj = JSON.parse(jsonStr);
    obj = removeAds(obj);

    body = jsonpCallback
      ? `${jsonpCallback}(${JSON.stringify(obj)});`
      : JSON.stringify(obj);

  } catch (e) {
    console.log('[QQ音乐去广告] JSON解析失败，跳过处理:', e.message);
  }
}

// ─── 回传响应体 ────────────────────────────────────────────────
if (typeof $response !== 'undefined') {
  $done({ body });                          // Surge / Loon
} else if (typeof $res !== 'undefined') {
  $done({ response: { body } });            // QuantumultX
} else {
  $done({});
}
