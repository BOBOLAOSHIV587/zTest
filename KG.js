/*
Sur2b (Quantumult X version)
Original Author: Neurogram
Ported by: ChatGPT (GPT-5)

[rewrite_local]
https:\/\/www\.youtube\.com\/api\/timedtext\? url script-response-body https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/KG.js
https:\/\/www\.youtube\.com\/api\/timedtextConf url script-request-body https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/KG.js

[MITM]
hostname = www.youtube.com
*/

const isQX = typeof $task !== "undefined";
const isSurge = typeof $httpClient !== "undefined";
const isReq = typeof $request !== "undefined";
const isResp = typeof $response !== "undefined";

let conf = getData("Sur2bConf");
let cache = getData("Sur2bCache") || {};
const url = isReq ? $request.url : "";
let body = isResp ? $response.body : "";
const autoGenSub = url.includes("&kind=asr");
const videoID = url.match(/(\?|&)v=([^&]+)/)?.[2];
const sourceLang = url.match(/&lang=([^&]+)/)?.[1];

(async () => {
  if (url.includes("timedtextConf") && isReq) {
    const newConf = JSON.parse($request.body || "{}");
    if (newConf.delCache) setData("{}", "Sur2bCache");
    delete newConf.delCache;
    setData(JSON.stringify(newConf), "Sur2bConf");
    return doneOK("OK");
  }

  if (!conf) return notify("Sur2b", "", "请先通过捷径配置脚本");

  conf = JSON.parse(conf);
  let subtitleData = processTimedText(body);
  if (!subtitleData.processedText)
    return notify("Sur2b", "", "未匹配到字幕内容");

  let summaryContent, translatedBody;

  if (conf.videoSummary && subtitleData.maxT <= conf.summaryMaxMinutes * 60 * 1000)
    summaryContent = await summarizer(subtitleData.processedText);
  if (conf.videoTranslation && subtitleData.maxT <= conf.translationMaxMinutes * 60 * 1000)
    translatedBody = await translator(body);

  if ((summaryContent || translatedBody) && videoID && sourceLang) {
    if (!cache[videoID]) cache[videoID] = {};
    if (!cache[videoID][sourceLang]) cache[videoID][sourceLang] = {};

    if (summaryContent)
      cache[videoID][sourceLang].summary = { content: summaryContent, timestamp: Date.now() };

    if (translatedBody) {
      if (!cache[videoID][sourceLang].translation)
        cache[videoID][sourceLang].translation = {};
      cache[videoID][sourceLang].translation[conf.targetLanguage] = {
        content: translatedBody,
        timestamp: Date.now(),
      };
    }
  }

  cleanCache();
  setData(JSON.stringify(cache), "Sur2bCache");

  $done({ body });
})();

async function summarizer(text) {
  if (cache[videoID]?.[sourceLang]?.summary)
    return notify("YouTube 视频摘要", "", cache[videoID][sourceLang].summary.content);

  try {
    const resp = await http({
      url: conf.openAIProxyUrl,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + conf.openAIAPIKey,
      },
      body: JSON.stringify({
        model: conf.openAIModel,
        messages: [{ role: "user", content: conf.summaryPrompts.replace(/{{subtitles}}/, text) }],
      }),
    });
    const res = JSON.parse(resp.body);
    const content = res.choices?.[0]?.message?.content || "无摘要";
    notify("YouTube 视频摘要", "", content);
    return content;
  } catch (e) {
    notify("YouTube 视频摘要", "摘要失败", String(e));
  }
}

async function translator(body) {
  const regex = /<p t="\d+" d="\d+">([^<]+)<\/p>/g;
  const originalSubs = [...body.matchAll(regex)].map((m) => m[1]);
  if (originalSubs.length === 0) return;

  const targetSubs = [];
  const batchSize = 50;
  for (let i = 0; i < originalSubs.length; i += batchSize) {
    const batch = originalSubs.slice(i, i + batchSize);
    const translatedBatch = await translateSwitcher(batch);
    targetSubs.push(...translatedBatch);
  }

  let subIndex = 0;
  const translatedBody = body.replace(regex, (full) => {
    const originalText = originalSubs[subIndex];
    const translatedText = targetSubs[subIndex] || originalText;
    const finalSub =
      conf.subLine === 1
        ? `${translatedText}\n${originalText}`
        : conf.subLine === 2
        ? `${originalText}\n${translatedText}`
        : translatedText;
    subIndex++;
    const attr = full.match(/<p (t="\d+" d="\d+")>/);
    return `<p ${attr[1]}>${finalSub}</p>`;
  });

  return translatedBody;
}

async function translateSwitcher(subs) {
  switch (conf.translationProvider) {
    case "Google":
      return googleTranslator(subs);
    case "DeepL":
      return deepLTranslator(subs);
    default:
      throw new Error(`未知翻译服务: ${conf.translationProvider}`);
  }
}

async function googleTranslator(subs) {
  const resp = await http({
    url: `https://translate.google.com/translate_a/single?client=it&dt=t&dj=1&sl=auto&tl=${conf.targetLanguage}`,
    method: "POST",
    headers: { "User-Agent": "GoogleTranslate/6.29.59279" },
    body: `q=${encodeURIComponent(subs.join("\n"))}`,
  });
  const res = JSON.parse(resp.body);
  const text = res.sentences.map((s) => s.trans).join("\n");
  return text.split("\n").filter(Boolean);
}

async function deepLTranslator(subs) {
  const resp = await http({
    url: conf.deepLUrl || "https://api-free.deepl.com/v2/translate",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "DeepL-Auth-Key " + conf.deepLAPIKey,
    },
    body: JSON.stringify({ text: subs, target_lang: conf.targetLanguage }),
  });
  const res = JSON.parse(resp.body);
  return res.translations.map((t) => t.text);
}

function processTimedText(xml) {
  const regex = /<p t="(\d+)"[^>]*>(.*?)<\/p>/gs;
  const results = [];
  let maxT = 0;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const t = parseInt(match[1]);
    const content = match[2].replace(/<[^>]+>/g, "").trim();
    if (content) {
      results.push(content);
      if (t > maxT) maxT = t;
    }
  }
  return { processedText: results.join("\n"), maxT };
}

function cleanCache() {
  const now = Date.now();
  const maxMs = conf.cacheMaxHours * 3600 * 1000;
  for (const vid in cache) {
    for (const lang in cache[vid]) {
      const langObj = cache[vid][lang];
      if (langObj.summary && now - langObj.summary.timestamp > maxMs)
        delete langObj.summary;
      if (langObj.translation)
        for (const tl in langObj.translation)
          if (now - langObj.translation[tl].timestamp > maxMs)
            delete langObj.translation[tl];
    }
  }
}

function getData(key) {
  try {
    return isQX ? $prefs.valueForKey(key) : $persistentStore.read(key);
  } catch {
    return null;
  }
}
function setData(value, key) {
  return isQX ? $prefs.setValueForKey(value, key) : $persistentStore.write(value, key);
}
function notify(title, sub, msg) {
  if (isQX) $notify(title, sub, msg);
  else $notification.post(title, sub, msg);
  return $done({});
}
function doneOK(body) {
  return $done({ response: { body } });
}

function http(options) {
  if (isQX)
    return $task.fetch(options);
  return new Promise((res, rej) =>
    $httpClient[options.method.toLowerCase() || "get"](
      options,
      (err, resp, data) => (err ? rej(err) : res({ status: resp.status, body: data }))
    )
  );
}
