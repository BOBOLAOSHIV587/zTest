/*******************************
脚本功能：波点音乐 会员调试 + 去广告 + 下载歌曲 +付费专辑
软件版本：5.1.7
更新时间：2025年
电报频道：https://t.me/GieGie777
使用声明：此脚本仅供学习与交流，请在下载使用24小时内删除！请勿在中国大陆转载与贩卖！
*******************************
[rewrite_local]
^https:\/\/www\.youtube\.com\/api\/timedtext url script-response-body https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Sur2b.js

[mitm]
hostname = www.youtube.com

*******************************/



const url = $request.url;
let body, subtitleData;
let conf = $prefs.valueForKey('Sur2bConf');
const autoGenSub = url.includes('&kind=asr');
const videoID = url.match(/(\?|&)v=([^&]+)/)?.[2];
const sourceLang = url.match(/&lang=([^&]+)/)?.[1];
let cache = $prefs.valueForKey('Sur2bCache') || '{}';
cache = JSON.parse(cache);

(async () => {

  if (url.includes('timedtextConf')) {
    const newConf = JSON.parse($request.body);
    if (newConf.delCache) $prefs.setValueForKey('{}', 'Sur2bCache');
    delete newConf.delCache;
    $prefs.setValueForKey(JSON.stringify(newConf), 'Sur2bConf');
    return $done({ response: { body: 'OK' } });
  };

  if (!conf) {
    $notify('Sur2b', '', '请先通过捷径配置脚本');
    return $done({});
  };

  conf = JSON.parse(conf);
  body = $response.body;
  subtitleData = processTimedText(body);

  if (!subtitleData.processedText) {
    $notify('Sur2b', '', '未匹配到字幕内容');
    return $done({});
  };

  let summaryContent, translatedBody;

  if (conf.videoSummary && subtitleData.maxT <= conf.summaryMaxMinutes * 60 * 1000) summaryContent = await summarizer();
  if (conf.videoTranslation && subtitleData.maxT <= conf.translationMaxMinutes * 60 * 1000) translatedBody = await translator();

  if ((summaryContent || translatedBody) && videoID && sourceLang) {
    if (!cache[videoID]) cache[videoID] = {};
    if (!cache[videoID][sourceLang]) cache[videoID][sourceLang] = {};

    if (summaryContent) {
      cache[videoID][sourceLang].summary = {
        content: summaryContent,
        timestamp: new Date().getTime()
      };
    };

    if (translatedBody) {
      if (!cache[videoID][sourceLang].translation) cache[videoID][sourceLang].translation = {};
      cache[videoID][sourceLang].translation[conf.targetLanguage] = {
        content: translatedBody,
        timestamp: new Date().getTime()
      };
    };
  };

  cleanCache();
  $prefs.setValueForKey(JSON.stringify(cache), 'Sur2bCache');
  $done({ body });

})();

async function summarizer() {
  if (cache[videoID]?.[sourceLang]?.summary) {
    $notify('YouTube 视频摘要', '', cache[videoID][sourceLang].summary.content);
    return;
  };

  if (!conf.openAIProxyUrl || !conf.openAIAPIKey || !conf.openAIModel) {
    $notify('YouTube 视频摘要', '', '未配置 OpenAI 接口信息');
    return;
  }

  const options = {
    url: conf.openAIProxyUrl,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + conf.openAIAPIKey
    },
    body: {
      model: conf.openAIModel,
      messages: [
        {
          role: 'user',
          content: conf.summaryPrompts.replace(/{{subtitles}}/, subtitleData.processedText)
        }
      ]
    }
  };

  try {
    const resp = await sendRequest(options, 'post');
    if (resp.error) throw new Error(resp.error.message);
    const content = resp.choices[0].message.content;
    $notify('YouTube 视频摘要', '', content);
    return content;
  } catch (err) {
    $notify('YouTube 视频摘要', '摘要请求失败', err.message || err);
    return;
  }
}

async function translator() {
  if (cache[videoID]?.[sourceLang]?.translation?.[conf.targetLanguage]) {
    body = cache[videoID][sourceLang].translation[conf.targetLanguage].content;
    return;
  }

  const regex = /<p t="\d+" d="\d+">([^<]+)<\/p>/g;
  const originalSubs = [];
  let match;
  while ((match = regex.exec(body)) !== null) originalSubs.push(match[1]);
  if (originalSubs.length === 0) return;

  const targetSubs = [];
  const batchSize = 50;

  for (let i = 0; i < originalSubs.length; i += batchSize) {
    const batch = originalSubs.slice(i, i + batchSize);
    try {
      const translatedBatch = await translateSwitcher(batch);
      targetSubs.push(...translatedBatch);
    } catch (error) {
      $notify('YouTube 视频翻译', '翻译请求失败', error.message || error);
      return;
    }
  }

  let subIndex = 0;
  const translatedBody = body.replace(regex, (fullMatch) => {
    if (subIndex < targetSubs.length && subIndex < originalSubs.length) {
      const originalText = originalSubs[subIndex];
      const translatedText = targetSubs[subIndex];
      let finalSubText;

      switch (conf.subLine) {
        case 1:
          finalSubText = `${translatedText}\n${originalText}`;
          break;
        case 2:
          finalSubText = `${originalText}\n${translatedText}`;
          break;
        case 0:
        default:
          finalSubText = translatedText;
          break;
      }

      subIndex++;
      const attributesMatch = fullMatch.match(/<p (t="\d+" d="\d+")>/);
      return `<p ${attributesMatch[1]}>${finalSubText}</p>`;
    }
    return fullMatch;
  });

  body = translatedBody;
  return translatedBody;
}

async function translateSwitcher(subs) {
  switch (conf.translationProvider) {
    case 'Google':
      return await googleTranslator(subs);
    case 'DeepL':
      return await deepLTranslator(subs);
    default:
      throw new Error(`未知的翻译服务: ${conf.translationProvider}`);
  }
}

async function googleTranslator(subs) {
  const options = {
    url: `https://translate.google.com/translate_a/single?client=it&dt=t&dj=1&sl=auto&tl=${conf.targetLanguage}`,
    headers: { 'User-Agent': 'Mozilla/5.0' },
    body: `q=${encodeURIComponent('<p>' + subs.join('\n<p>'))}`
  };
  const resp = await sendRequest(options, 'post');
  if (!resp.sentences) throw new Error('Google 翻译失败');
  const combinedTrans = resp.sentences.map(s => s.trans).join('');
  const splitSentences = combinedTrans.split('<p>');
  return splitSentences.filter(s => s.trim()).map(s => s.trim());
}

async function deepLTranslator(subs) {
  if (!conf.deepLAPIKey) throw new Error('未配置 DeepL API Key');
  const options = {
    url: conf.deepLUrl || 'https://api-free.deepl.com/v2/translate',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'DeepL-Auth-Key ' + conf.deepLAPIKey
    },
    body: {
      text: subs,
      target_lang: conf.targetLanguage
    }
  };
  const resp = await sendRequest(options, 'post');
  if (!resp.translations) throw new Error('DeepL 翻译失败');
  return resp.translations.map(t => t.text);
}

function processTimedText(xml) {
  const regex = /<p t="(\d+)"[^>]*>(.*?)<\/p>/gs;
  let match, maxT = 0;
  const results = [];
  while ((match = regex.exec(xml)) !== null) {
    const t = parseInt(match[1], 10);
    const content = match[2].trim();
    let lineText = '';
    if (content.startsWith('<s')) {
      const sTagRegex = /<s[^>]*>([^<]+)<\/s>/g;
      const words = Array.from(content.matchAll(sTagRegex), m => m[1]);
      if (words.length > 0) lineText = words.join('');
    } else lineText = content;
    lineText = decodeHTMLEntities(lineText).trim();
    if (lineText) {
      if (t > maxT) maxT = t;
      const totalSeconds = Math.floor(t / 1000);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const paddedSeconds = String(seconds).padStart(2, '0');
      results.push(`(${minutes}:${paddedSeconds}) ${lineText}`);
    }
  }
  return { processedText: results.join('\n'), maxT };
}

function decodeHTMLEntities(text) {
  const entities = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': '\'' };
  return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, m => entities[m]);
}

function sendRequest(options, method = 'get') {
  options.method = method.toUpperCase();
  if (typeof options.body === 'object') options.body = JSON.stringify(options.body);
  return $task.fetch(options).then(resp => {
    try {
      return JSON.parse(resp.body);
    } catch {
      return resp.body;
    }
  });
}

function cleanCache() {
  const now = Date.now();
  const maxMs = conf.cacheMaxHours * 60 * 60 * 1000;
  for (const itemKey of Object.keys(cache)) {
    const item = cache[itemKey];
    for (const lang of Object.keys(item)) {
      const langObj = item[lang];
      if (langObj.summary && now - langObj.summary.timestamp > maxMs) delete langObj.summary;
      if (langObj.translation) {
        for (const tLang of Object.keys(langObj.translation)) {
          const tObj = langObj.translation[tLang];
          if (now - tObj.timestamp > maxMs) delete langObj.translation[tLang];
        }
        if (Object.keys(langObj.translation).length === 0) delete langObj.translation;
      }
      if (!langObj.summary && !langObj.translation) delete item[lang];
    }
    if (Object.keys(item).length === 0) delete cache[itemKey];
  }
  return cache;
}
