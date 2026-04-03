/**
 * @name 掌上公交去广告脚本 (通用版)
 * @desc 适配 QX, Loon, Surge。去除开屏、首页弹窗、列表广告。
 * @author Gemini
 */

let obj = JSON.parse($response.body);

// 1. 移除开屏广告配置
if (obj.data && obj.data.guideList) {
    obj.data.guideList = [];
}

// 2. 移除首页及列表中的广告位
if (obj.data && obj.data.adList) {
    obj.data.adList = [];
}

// 3. 移除一些特定的推广标记
if (obj.data && obj.data.commonAd) {
    delete obj.data.commonAd;
}

// 4. 针对搜索页面的推广
if (obj.data && obj.data.searchAds) {
    obj.data.searchAds = [];
}

$done({ body: JSON.stringify(obj) });
