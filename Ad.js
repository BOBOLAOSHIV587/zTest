/*******************************
脚本功能：波点音乐 会员调试 + 去广告 + 下载歌曲 +付费专辑
软件版本：5.1.7
更新时间：2025年
电报频道：https://t.me/GieGie777
使用声明：此脚本仅供学习与交流，请在下载使用24小时内删除！请勿在中国大陆转载与贩卖！
*******************************
[rewrite_local]
# > 波点音乐 会员调试 + 去广告 + 下载功能 + 付费专辑
#^https?:\/\/(bd-api\.kuwo\.cn\/api\/(ucenter\/users\/(pub|login)|play\/(advert\/info|music\/v2\/(audioUrl|checkRight))|service\/(home\/module|music\/download\/info|global\/config\/(scene|vipEnter)|advert\/config|banner\/positions)|search\/topic\/word\/list|pay\/(vip\/(lowPriceText|invitation\/(assist\/popup|swell))|audition\/url|sp\/actVip))|us\.l\.qq\.com\/exapp\?adposcount) url script-response-body https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Ad.js

https:\/\/www.youtube.com\/api\/timedtext\? url script-response-body https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Ad.js

https:\/\/www.youtube.com\/api\/timedtextConf url script-request-body https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Ad.js




[mitm]
hostname = www.youtube.com

*******************************/



/*
* Quantumult X compatible version of the Sur2b script
* Sur2b: YouTube Video Subtitle Translation and Summary
* Original environment: Surge (based on API usage)
* Quantumult X equivalent APIs used: $prefs, $task.fetch, $notify
*/

// Quantumult X doesn't use $request.url, it uses $request.URL.
// And it doesn't have $response.body in a response script unless it's a Tweak.
// Assuming this is used as a 'script-response-body' script for the YouTube timedtext request.
// In Quantumult X 'script-response-body', we use $request and $response objects.

const url = $request.url;
let body = $response.body; // Assuming the body is available for modification
let subtitleData;
// Use $prefs for persistent storage
let conf = $prefs.value('Sur2bConf');
const autoGenSub = url.includes('&kind=asr');
const videoID = url.match(/(\?|&)v=([^&]+)/)?.[2];
const sourceLang = url.match(/&lang=([^&]+)/)?.[1];
let cache = $prefs.value('Sur2bCache') || '{}';
cache = JSON.parse(cache);

(async () => {

    // Configuration endpoint logic
    if (url.includes('timedtextConf')) {
        const newConf = JSON.parse($request.body);
        if (newConf.delCache) $prefs.remove('Sur2bCache');
        delete newConf.delCache;
        $prefs.setValue(JSON.stringify(newConf), 'Sur2bConf');
        // In Quantumult X, we just return the final modified $response object, 
        // but for a simple 'OK' response, we can just exit.
        return $done({ response: { body: 'OK' } });
    };

    if (!conf) {
        $notify('Sur2b', '', '请先通过配置界面配置脚本');
        return $done({});
    };

    conf = JSON.parse(conf);

    // body is already $response.body from the scope
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
    $prefs.setValue(JSON.stringify(cache), 'Sur2bCache');

    // Return the final body to Quantumult X
    $done({ body });

})();

// --- Helper Functions (Modified for Quantumult X API) ---

async function sendRequest(options, method = 'get') {
    // Quantumult X uses $task.fetch
    options.method = method.toUpperCase();
    
    // Convert body object to string for POST/PUT if it's an object
    if (options.body && typeof options.body === 'object') {
        if (options.headers && options.headers['Content-Type'] && options.headers['Content-Type'].includes('json')) {
            options.body = JSON.stringify(options.body);
        }
    }
    
    try {
        const response = await $task.fetch(options);
        // $task.fetch response object: { status, headers, body }
        
        let data = response.body;
        
        if (typeof data === 'string') {
            try {
                // Attempt to parse JSON
                return JSON.parse(data);
            } catch {
                // Return as string if not JSON
                return data;
            }
        }
        
        // Return body if it's already an object/array (e.g., from a JSON response)
        return data;

    } catch (error) {
        // Quantumult X error handling in fetch
        throw new Error(`Request failed: ${error}`);
    }
};

async function summarizer() {

    // Use $notify for notifications
    if (cache[videoID]?.[sourceLang]?.summary) {
        $notify('YouTube 视频摘要', '', cache[videoID][sourceLang].summary.content);
        return cache[videoID][sourceLang].summary.content; // Must return content for cache hit logic
    };

    const options = {
        url: conf.openAIProxyUrl,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + conf.openAIAPIKey
        },
        // In Quantumult X, 'body' for $task.fetch is the request payload
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
        if (!conf.openAIProxyUrl) throw new Error('未配置 AI 总结接口链接');
        if (!conf.openAIAPIKey) throw new Error('未配置 AI 总结接口 API Key');
        if (!conf.openAIModel) throw new Error('未配置 AI 总结接口模型');

        const resp = await sendRequest(options, 'post');
        if (resp.error) throw new Error(resp.error.message);
        const content = resp.choices[0].message.content;
        $notify('YouTube 视频摘要', '', content);
        return content;
    } catch (err) {
        // Quantumult X error notification
        $notify('YouTube 视频摘要', '摘要请求失败', String(err));
        return;
    };

};


async function translator() {

    if (cache[videoID]?.[sourceLang]?.translation?.[conf.targetLanguage]) {
        body = cache[videoID][sourceLang].translation[conf.targetLanguage].content;
        return body; // Must return body for cache hit logic
    };

    let patt = new RegExp(`&lang=${conf.targetLanguage}&`, 'i');

    if (conf.targetLanguage == 'zh-CN' || conf.targetLanguage == 'ZH-HANS') patt = /&lang=zh(-Hans)*&/i;
    if (conf.targetLanguage == 'zh-TW' || conf.targetLanguage == 'ZH-HANT') patt = /&lang=zh-Hant&/i;

    if (url.includes('&tlang=') || patt.test(url)) return;

    if (/&lang=zh(-Han)*/i.test(url) && /^zh-(CN|TW|HAN)/i.test(conf.targetLanguage)) return await chineseTransform();

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
            const translatedBatch = await translateSwitcher(batch);
            targetSubs.push(...translatedBatch);
        } catch (error) {
            $notify('YouTube 视频翻译', '翻译请求失败', String(error));
            return;
        }
    };

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
};

async function translateSwitcher(subs) {
    switch (conf.translationProvider) {
        case 'Google':
            return await googleTranslator(subs);
        case 'DeepL':
            return await deepLTranslator(subs);
        default:
            throw new Error(`未知的翻译服务: ${conf.translationProvider}`);
    }
};

async function googleTranslator(subs) {
    const options = {
        url: `https://translate.google.com/translate_a/single?client=it&dt=qca&dt=t&dt=rmt&dt=bd&dt=rms&dt=sos&dt=md&dt=gt&dt=ld&dt=ss&dt=ex&otf=2&dj=1&hl=en&ie=UTF-8&oe=UTF-8&sl=auto&tl=${conf.targetLanguage}`,
        headers: {
            'User-Agent': 'GoogleTranslate/6.29.59279 (iPhone; iOS 15.4; en; iPhone14,2)',
            'Content-Type': 'application/x-www-form-urlencoded' // Must specify for form data
        },
        body: `q=${encodeURIComponent('<p>' + subs.join('\n<p>'))}` // Body is string form-encoded
    };

    const resp = await sendRequest(options, 'post');

    if (!resp.sentences) throw new Error(`Google 翻译失败: ${JSON.stringify(resp)}`);

    const combinedTrans = resp.sentences.map(s => s.trans).join('');

    const splitSentences = combinedTrans.split('<p>');

    const targetSubs = splitSentences
        .filter(sentence => sentence && sentence.trim().length > 0)
        .map(sentence => {
            return sentence.replace(/\s*[\r\n]+\s*/g, ' ').trim();
        });

    return targetSubs;
};


async function deepLTranslator(subs) {
    if (!conf.deepLAPIKey) throw new Error('未配置 DeepL API Key');

    const options = {
        url: conf.deepLUrl || 'https://api-free.deepl.com/v2/translate',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'DeepL-Auth-Key ' + conf.deepLAPIKey,
        },
        body: {
            text: subs,
            target_lang: conf.targetLanguage
        }
    };

    const resp = await sendRequest(options, 'post');

    if (!resp.translations) throw new Error(`DeepL 翻译失败: ${JSON.stringify(resp)}`);

    const targetSubs = resp.translations.map(translation => translation.text);

    return targetSubs;
};

async function chineseTransform() {

    let from = 'cn';
    let to = 'tw';

    if (/^zh-(CN|HANS)/i.test(conf.targetLanguage)) [from, to] = [to, from];

    // Note: External script loading and eval is generally discouraged and may not work reliably in all JS environments.
    // If OpenCC.js is a common library, consider including it as a separate module or using a native implementation if available.
    // For Quantumult X, direct fetch and eval is the closest translation.
    const openccJS = await sendRequest({
        url: 'https://cdn.jsdelivr.net/npm/opencc-js@1.0.5/dist/umd/full.js'
    })
    
    // Safety check: ensure response is a string script
    if (typeof openccJS === 'string') {
        eval(openccJS);
    } else {
        throw new Error('Failed to load OpenCC.js for Chinese transformation.');
    }

    // After eval, OpenCC should be defined globally
    const converter = OpenCC.Converter({ from: from, to: to });

    body = converter(body)
};

// --- Unmodified Helper Functions (Independent of API) ---

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
            if (words.length > 0) {
                lineText = words.join('');
            }
        } else {
            lineText = content;
        }

        lineText = decodeHTMLEntities(lineText).trim();

        if (lineText) {
            if (t > maxT) {
                maxT = t;
            }

            const totalSeconds = Math.floor(t / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            const paddedSeconds = String(seconds).padStart(2, '0');
            let formattedTime;

            if (hours > 0) {
                const paddedMinutes = String(minutes).padStart(2, '0');
                formattedTime = `(${hours}:${paddedMinutes}:${paddedSeconds})`;
            } else {
                formattedTime = `(${minutes}:${paddedSeconds})`;
            }

            results.push(`${formattedTime} ${lineText}`);
        }
    }

    const processedText = results.join('\n');

    return {
        processedText: processedText,
        maxT: maxT
    };
};

function decodeHTMLEntities(text) {
    const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': '\''
    };
    return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, match => entities[match]);
};


function cleanCache() {
    const now = Date.now();
    const maxMs = conf.cacheMaxHours * 60 * 60 * 1000;

    for (const itemKey of Object.keys(cache)) {
        const item = cache[itemKey];

        for (const lang of Object.keys(item)) {
            const langObj = item[lang];

            if (langObj.summary && now - langObj.summary.timestamp > maxMs) {
                delete langObj.summary;
            };

            if (langObj.translation) {

                for (const tLang of Object.keys(langObj.translation)) {
                    const tObj = langObj.translation[tLang];
                    if (now - tObj.timestamp > maxMs) {
                        delete langObj.translation[tLang];
                    };
                };

                if (Object.keys(langObj.translation).length === 0) {
                    delete langObj.translation;
                };
            };

            if ((!langObj.summary) && (!langObj.translation)) delete item[lang];
        };

        if (Object.keys(item).length === 0) delete cache[itemKey];
    };

    return cache;
}
