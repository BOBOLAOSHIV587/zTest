/*
    Sur2b for Quantumult X (Adapted from Neurogram's Surge version)
    功能：YouTube 字幕翻译 + 视频摘要 + 简繁转换
    作者：Neurogram（原版） | Qwen（QX 适配）
    用途：合法学习与个人使用，请勿用于商业或侵权场景
*/

const url = $request.url;
let body, subtitleData;
const autoGenSub = url.includes('&kind=asr');
const videoID = url.match(/(\?|&)v=([^&]+)/)?.[2];
const sourceLang = url.match(/&lang=([^&]+)/)?.[1];

// ===== QX 持久化存储封装 =====
function readPref(key) {
    return $prefs.valueForKey(key) || '';
}
function writePref(key, value) {
    $prefs.setValueForKey(value, key);
}

(async () => {
    try {
        if (url.includes('timedtextConf')) {
            const newConf = JSON.parse($request.body);
            if (newConf.delCache) writePref('Sur2bCache', '{}');
            delete newConf.delCache;
            writePreff('Sur2bConf', JSON.stringify(newConf));
            $done({ response: { body: 'OK' } });
            return;
        }

        let confStr = readPref('Sur2bConf');
        if (!confStr) {
            $notify('Sur2b', '', '请先通过捷径配置脚本');
            $done({});
            return;
        }

        let conf;
        try {
            conf = JSON.parse(confStr);
        } catch (e) {
            $notify('Sur2b', '配置错误', '请重新配置');
            $done({});
            return;
        }

        body = $response.body;
        subtitleData = processTimedText(body);

        if (!subtitleData.processedText) {
            $notify('Sur2b', '', '未匹配到字幕内容');
            $done({});
            return;
        }

        let cacheStr = readPref('Sur2bCache') || '{}';
        let cache;
        try {
            cache = JSON.parse(cacheStr);
        } catch (e) {
            cache = {};
        }

        let summaryContent, translatedBody;

        if (conf.videoSummary && subtitleData.maxT <= conf.summaryMaxMinutes * 60 * 1000) {
            summaryContent = await summarizer(conf, cache, videoID, sourceLang);
        }
        if (conf.videoTranslation && subtitleData.maxT <= conf.translationMaxMinutes * 60 * 1000) {
            translatedBody = await translator(conf, cache, videoID, sourceLang, autoGenSub);
        }

        // 更新缓存
        if ((summaryContent || translatedBody) && videoID && sourceLang) {
            if (!cache[videoID]) cache[videoID] = {};
            if (!cache[videoID][sourceLang]) cache[videoID][sourceLang] = {};

            if (summaryContent) {
                cache[videoID][sourceLang].summary = {
                    content: summaryContent,
                    timestamp: Date.now()
                };
            }

            if (translatedBody) {
                if (!cache[videoID][sourceLang].translation) cache[videoID][sourceLang].translation = {};
                cache[videoID][sourceLang].translation[conf.targetLanguage] = {
                    content: translatedBody,
                    timestamp: Date.now()
                };
            }

            cache = cleanCache(cache, conf);
            writePref('Sur2bCache', JSON.stringify(cache));
        }

        $done({ body });

    } catch (err) {
        const msg = String(err?.message || err || '未知错误');
        $notify('Sur2b', '脚本执行失败', msg);
        $done({});
    }
})();

async function summarizer(conf, cache, videoID, sourceLang) {
    if (cache[videoID]?.[sourceLang]?.summary) {
        const content = cache[videoID][sourceLang].summary.content;
        $notify('YouTube 视频摘要', '', content);
        return content;
    }

    if (!conf.openAIProxyUrl) throw new Error('未配置 AI 总结接口链接');
    if (!conf.openAIAPIKey) throw new Error('未配置 AI 总结接口 API Key');
    if (!conf.openAIModel) throw new Error('未配置 AI 总结接口模型');

    const options = {
        url: conf.openAIProxyUrl,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + conf.openAIAPIKey
        },
        body: JSON.stringify({
            model: conf.openAIModel,
            messages: [
                {
                    role: 'user',
                    content: conf.summaryPrompts.replace(/{{subtitles}}/, subtitleData.processedText)
                }
            ]
        })
    };

    try {
        const resp = await sendRequest(options, 'post');
        if (resp?.error) throw new Error(resp.error.message);
        const content = resp.choices[0].message.content;
        $notify('YouTube 视频摘要', '', content);
        return content;
    } catch (err) {
        $notify('YouTube 视频摘要', '请求失败', String(err));
        return;
    }
}

async function translator(conf, cache, videoID, sourceLang, autoGenSub) {
    if (cache[videoID]?.[sourceLang]?.translation?.[conf.targetLanguage]) {
        body = cache[videoID][sourceLang].translation[conf.targetLanguage].content;
        return body;
    }

    let patt = new RegExp(`&lang=${conf.targetLanguage}&`, 'i');
    if (conf.targetLanguage == 'zh-CN' || conf.targetLanguage == 'ZH-HANS') patt = /&lang=zh(-Hans)*&/i;
    if (conf.targetLanguage == 'zh-TW' || conf.targetLanguage == 'ZH-HANT') patt = /&lang=zh-Hant&/i;

    if (url.includes('&tlang=') || patt.test(url)) return;

    if (/&lang=zh(-Han)*/i.test(url) && /^zh-(CN|TW|HAN)/i.test(conf.targetLanguage)) {
        return await chineseTransform(conf);
    }

    if (autoGenSub) return;

    const originalSubs = [];
    const regex = /<p t="\d+" d="\d+">([^<]+)<\/p>/g;
    let match;
    while ((match = regex.exec(body)) !== null) {
        originalSubs.push(match[1]);
    }
    if (originalSubs.length === 0) return;

    const targetSubs = [];
    const batchSize = 50;
    for (let i = 0; i < originalSubs.length; i += batchSize) {
        const batch = originalSubs.slice(i, i + batchSize);
        try {
            const translatedBatch = await translateSwitcher(batch, conf);
            targetSubs.push(...translatedBatch);
        } catch (error) {
            $notify('YouTube 翻译', '批次失败', String(error));
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

async function translateSwitcher(subs, conf) {
    switch (conf.translationProvider) {
        case 'Google':
            return await googleTranslator(subs, conf);
        case 'DeepL':
            return await deepLTranslator(subs, conf);
        default:
            throw new Error(`未知的翻译服务: ${conf.translationProvider}`);
    }
}

async function googleTranslator(subs, conf) {
    const options = {
        url: `https://translate.google.com/translate_a/single?client=it&dt=qca&dt=t&dt=rmt&dt=bd&dt=rms&dt=sos&dt=md&dt=gt&dt=ld&dt=ss&dt=ex&otf=2&dj=1&hl=en&ie=UTF-8&oe=UTF-8&sl=auto&tl=${conf.targetLanguage}`,
        headers: {
            'User-Agent': 'GoogleTranslate/6.29.59279 (iPhone; iOS 15.4; en; iPhone14,2)'
        },
        body: `q=${encodeURIComponent('<p>' + subs.join('\n<p>'))}`
    };
    const resp = await sendRequest(options, 'post');
    if (!resp.sentences) throw new Error(`Google 翻译失败: ${JSON.stringify(resp)}`);
    const combinedTrans = resp.sentences.map(s => s.trans).join('');
    const splitSentences = combinedTrans.split('<p>');
    const targetSubs = splitSentences
        .filter(sentence => sentence && sentence.trim().length > 0)
        .map(sentence => sentence.replace(/\s*[\r\n]+\s*/g, ' ').trim());
    return targetSubs;
}

async function deepLTranslator(subs, conf) {
    if (!conf.deepLAPIKey) throw new Error('未配置 DeepL API Key');
    const options = {
        url: conf.deepLUrl || 'https://api-free.deepl.com/v2/translate',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'DeepL-Auth-Key ' + conf.deepLAPIKey,
        },
        body: JSON.stringify({
            text: subs,
            target_lang: conf.targetLanguage
        })
    };
    const resp = await sendRequest(options, 'post');
    if (!resp.translations) throw new Error(`DeepL 翻译失败: ${JSON.stringify(resp)}`);
    const targetSubs = resp.translations.map(translation => translation.text);
    return targetSubs;
}

async function chineseTransform(conf) {
    let from = 'cn';
    let to = 'tw';
    if (/^zh-(CN|HANS)/i.test(conf.targetLanguage)) [from, to] = [to, from];

    const openccJS = await sendRequest({
        url: 'https://cdn.jsdelivr.net/npm/opencc-js@1.0.5/dist/umd/full.js'
    }, 'get');

    // 在 QX 中 eval 可能受限，改用 Function 构造（更安全）
    const openccModule = new Function('return ' + openccJS)();
    const OpenCC = openccModule.OpenCC || openccModule.default?.OpenCC || openccModule;
    if (!OpenCC) throw new Error('OpenCC 加载失败');

    const converter = OpenCC.Converter({ from: from, to: to });
    body = converter(body);
    return body;
}

function processTimedText(xml) {
    const regex = /<p t="(\d+)"[^>]*>(.*?)<\/p>/gs;
    let match;
    let maxT = 0;
    const results = [];
    while ((match = regex.exec(xml)) !== null) {
        const t = parseInt(match[1], 10);
        const content = match[2].trim();
        let lineText = '';
        if (content.startsWith('<s')) {
            const sTagRegex = /<s[^>]*>([^<]+)<\/s>/g;
            const words = Array.from(content.matchAll(sTagRegex), m => m[1]);
            if (words.length > 0) lineText = words.join('');
        } else {
            lineText = content;
        }
        lineText = decodeHTMLEntities(lineText).trim();
        if (lineText) {
            if (t > maxT) maxT = t;
            const totalSeconds = Math.floor(t / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            const paddedSeconds = String(seconds).padStart(2, '0');
            let formattedTime = hours > 0
                ? `(${hours}:${String(minutes).padStart(2, '0')}:${paddedSeconds})`
                : `(${minutes}:${paddedSeconds})`;
            results.push(`${formattedTime} ${lineText}`);
        }
    }
    return {
        processedText: results.join('\n'),
        maxT: maxT
    };
}

function decodeHTMLEntities(text) {
    const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'"
    };
    return text.replace(/&(amp|lt|gt|quot|#39);/g, match => entities[match]);
}

function sendRequest(options, method = 'get') {
    return new Promise((resolve, reject) => {
        const handler = (error, response, data) => {
            if (error) return reject(error);
            try {
                resolve(JSON.parse(data));
            } catch {
                resolve(data);
            }
        };
        if (method === 'get') {
            $httpClient.get(options, handler);
        } else {
            $httpClient.post(options, handler);
        }
    });
}

function cleanCache(cache, conf) {
    const now = Date.now();
    const maxMs = (conf.cacheMaxHours || 24) * 60 * 60 * 1000;
    for (const itemKey of Object.keys(cache)) {
        const item = cache[itemKey];
        for (const lang of Object.keys(item)) {
            const langObj = item[lang];
            if (langObj.summary && now - langObj.summary.timestamp > maxMs) {
                delete langObj.summary;
            }
            if (langObj.translation) {
                for (const tLang of Object.keys(langObj.translation)) {
                    const tObj = langObj.translation[tLang];
                    if (now - tObj.timestamp > maxMs) {
                        delete langObj.translation[tLang];
                    }
                }
                if (Object.keys(langObj.translation).length === 0) {
                    delete langObj.translation;
                }
            }
            if (!langObj.summary && !langObj.translation) {
                delete item[lang];
            }
        }
        if (Object.keys(item).length === 0) {
            delete cache[itemKey];
        }
    }
    return cache;
}
