/*******************************
脚本功能：波点音乐 会员调试 + 去广告 + 下载歌曲 +付费专辑
软件版本：5.1.7
更新时间：2025年
电报频道：https://t.me/GieGie777
使用声明：此脚本仅供学习与交流，请在下载使用24小时内删除！请勿在中国大陆转载与贩卖！
*******************************
[rewrite_local]
^https:\/\/www\.youtube\.com\/api\/timedtext\? url script-response-body https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Sur2b.js
^https:\/\/www\.youtube\.com\/\?timedtextConf url script-request-body https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Sur2b.js

[mitm]
hostname = www.youtube.com

*******************************/



/**
 * Quantumult X 版 Sur2b 字幕助手 配置脚本
 * 使用方法：
 * 访问链接：https://www.youtube.com/?timedtextConf  即可触发配置界面
 */

const conf = {
  openAIProxyUrl: "",
  openAIAPIKey: "",
  openAIModel: "gpt-4o-mini",
  summaryPrompts: "请帮我用中文总结以下字幕的主要内容：\n\n{{subtitles}}",
  targetLanguage: "zh-CN",
  translationProvider: "Google",
  deepLAPIKey: "",
  deepLUrl: "",
  subLine: 1, // 0=仅译文, 1=译文在上,原文在下, 2=原文在上,译文在下
  videoSummary: true,
  videoTranslation: true,
  summaryMaxMinutes: 30,
  translationMaxMinutes: 60,
  cacheMaxHours: 24
};

if ($request && $request.url.includes('timedtextConf')) {
  // === 处理设置 ===
  const input = $request.body ? JSON.parse($request.body) : {};
  Object.assign(conf, input);
  $prefs.setValueForKey(JSON.stringify(conf), 'Sur2bConf');
  $notify("Sur2b 配置成功 ✅", "", "配置已保存到 Quantumult X");
  $done({ body: "OK" });
} else {
  // === 生成捷径链接说明 ===
  const tip = `
🎬 Sur2b Quantumult X 配置说明

你可以通过捷径或手动发送 POST 请求到:
https://www.youtube.com/?timedtextConf

body 示例:
{
  "openAIProxyUrl": "https://api.openai.com/v1/chat/completions",
  "openAIAPIKey": "sk-xxxx",
  "openAIModel": "gpt-4o-mini",
  "targetLanguage": "zh-CN",
  "translationProvider": "Google"
}

也可手动在脚本中修改默认值。`;

  $notify("Sur2b 设置提示", "", tip);
  $done({ body: "OK" });
}
