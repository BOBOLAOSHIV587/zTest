/*
Sur2b (Quantumult X Enhanced Edition)
Original Author: Neurogram
Enhanced & Ported by ChatGPT (GPT-5)

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

const url = isReq ? $request.url : "";
let body = isResp ? $response.body : "";

let conf = getData("Sur2bConf");
let cache = getData("Sur2bCache") || {};

const videoID = url.match(/(\?|&)v=([^&]+)/)?.[2];
const sourceLang = url.match(/&lang=([^&]+)/)?.[1];
const autoGenSub = url.includes("&kind=asr");

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
  const debug = conf.debug || false;

  let subtitleData = processTimedText(body);
  if (!subtitleData.processedText)
    return notify("Sur2b", "", "未匹配到字幕内容");

  let summaryContent, translatedBody;

  if (conf.videoSummary && subtitleData.maxT <= conf.summaryMaxMinutes * 60 * 1000)
    summaryContent = await summarizer(subtitleData.processedText, debug);

  if (conf.videoTranslation && subtitleData.maxT <= conf.translationMaxMinutes * 60 * 1000)
    translatedBody = await translator(body, debug);

  if ((summaryContent || translatedBody) && videoID && sourceLang) {
    cache[videoID] = cache[videoID] || {};
    cache[videoID][sourceLang] = cache[videoID][sourceLang] || {};
    if (summaryContent)
      cache[videoID][sourceLang].summary = { content: summaryContent, timestamp: Date.now() };
    if (translatedBody) {
      cache[videoID][sourceLang].translation = cache[videoID][sourceLang].translation || {};
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

async function summarizer(text, debug) {
  if (cache[videoID]?.[sourceLang]?.summary)
    return notify("YouTube 摘要（缓存）", "", cache[videoID][sourceLang].summary.content);

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
    const data = JSON.parse(resp.body || "{}");
    const content = data.choices?.[0]?.message?.content || "无摘要";

    splitNotify("YouTube 视频摘要", content);
    if (debug) console.log("💬 Summary Response:", content);
    return content;
  } catch (e) {
    notify("摘要失败", "", String(e));
    if (debug) console.log("❌ Summary Error:", e);
  }
}

async function translator(body, debug) {
  const regex = /<p t="\d+" d="\d+">([^<]+)<\/p>/g;
  const originalSubs = [...body.matchAll(regex)].map((m) => m[1]);
  if (originalSubs.length === 0) return;

  const targetSubs = [];
  const batchSize = 50;
  for (let i = 0; i < originalSubs.length; i += batchSize) {
    const batch = originalSubs.slice(i, i + batchSize);
    const translated = await translateSwitcher(batch, debug);
    targetSubs.push(...translated);
  }

  let i = 0;
  const translatedBody = body.replace(regex, (full) => {
    const orig = originalSubs[i];
    const tran = targetSubs[i] || orig;
    const text =
      conf.subLine === 1
        ? `${tran}\n${orig}`
        : conf.subLine === 2
        ? `${orig}\n${tran}`
        : tran;
    i++;
    const attr = full.match(/<p (t="\d+" d="\d+")>/);
    return `<p ${attr[1]}>${text}</p>`;
  });
  notify("YouTube 字幕翻译", "", "✅ 翻译完成");
  if (debug) console.log("🔤 Translated body sample:", translatedBody.slice(0, 500));
  return translatedBody;
}

async function translateSwitcher(subs, debug) {
  switch (conf.translationProvider) {
    case "Google": return googleTranslator(subs, debug);
    case "DeepL": return deepLTranslator(subs, debug);
    default: throw new Error("未知翻译服务");
  }
}

async function googleTranslator(subs, debug) {
  const resp = await http({
    url: `https://translate.google.com/translate_a/single?client=it&dt=t&dj=1&sl=auto&tl=${conf.targetLanguage}`,
    method: "POST",
    headers: { "User-Agent": "GoogleTranslate/6.29.59279" },
    body: `q=${encodeURIComponent(subs.join("\n"))}`,
  });
  const data = JSON.parse(resp.body || "{}");
  const text = data.sentences?.map((s) => s.trans).join("\n") || "";
  if (debug) console.log("🌍 Google Trans OK:", text.slice(0, 200));
  return text.split("\n").filter(Boolean);
}

async function deepLTranslator(subs, debug) {
  const resp = await http({
    url: conf.deepLUrl || "https://api-free.deepl.com/v2/translate",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "DeepL-Auth-Key " + conf.deepLAPIKey,
    },
    body: JSON.stringify({ text: subs, target_lang: conf.targetLanguage }),
  });
  const data = JSON.parse(resp.body || "{}");
  const res = data.translations?.map((t) => t.text) || [];
  if (debug) console.log("💡 DeepL Trans:", res.length, "lines");
  return res;
}

function processTimedText(xml) {
  const regex = /<p t="(\d+)"[^>]*>(.*?)<\/p>/gs;
  const results = [];
  let maxT = 0, match;
  while ((match = regex.exec(xml)) !== null) {
    const t = parseInt(match[1]);
    const content = match[2].replace(/<[^>]+>/g, "").trim();
    if (content) { results.push(content); if (t > maxT) maxT = t; }
  }
  return { processedText: results.join("\n"), maxT };
}

function cleanCache() {
  const now = Date.now();
  const maxMs = (conf.cacheMaxHours || 12) * 3600 * 1000;
  for (const vid in cache)
    for (const lang in cache[vid]) {
      const obj = cache[vid][lang];
      if (obj.summary && now - obj.summary.timestamp > maxMs) delete obj.summary;
      if (obj.translation)
        for (const tl in obj.translation)
          if (now - obj.translation[tl].timestamp > maxMs)
            delete obj.translation[tl];
    }
}

function splitNotify(title, text) {
  const chunk = 300;
  for (let i = 0; i < text.length; i += chunk)
    $notify(title, `片段 ${i / chunk + 1}`, text.slice(i, i + chunk));
}

function getData(key) {
  return isQX ? $prefs.valueForKey(key) : $persistentStore.read(key);
}
function setData(v, k) {
  return isQX ? $prefs.setValueForKey(v, k) : $persistentStore.write(v, k);
}
function notify(t, s, m) {
  if (isQX) $notify(t, s, m); else $notification.post(t, s, m);
  return $done({});
}
function doneOK(b) { return $done({ response: { body: b } }); }
function http(o) {
  if (isQX) return $task.fetch(o);
  return new Promise((res, rej) => {
    $httpClient[o.method.toLowerCase() || "get"](o, (e, r, d) => (e ? rej(e) : res({ status: r.status, body: d })));
  });
}
