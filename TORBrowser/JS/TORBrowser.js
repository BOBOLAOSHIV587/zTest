/**
 * YouTube 字幕抓取 + Gemini 总结
 * 响应体脚本 - 通用版 (Surge / QX / Loon)
 * 
 * 配置说明：将下方 GEMINI_API_KEY 替换为你的 API Key
 */

const GEMINI_API_KEY = 'AIzaSyCaAfJpcubTzA7OZDnD07clUJOhO9CtnSY';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY;
const CACHE_KEY = 'yt_summary_cache';
const TAG = '[YT-Summary]';

(function () {
    var url = $request.url;
    var body = $response.body;

    if (!body || body.length < 100) {
        $done({});
        return;
    }

    // 提取视频 ID
    var vMatch = url.match(/[?&]v=([^&]+)/);
    if (!vMatch) {
        $done({});
        return;
    }
    var videoId = vMatch[1];

    // 跳过非自动字幕/已是中文的请求（只处理原始字幕）
    if (/[?&]tlang=zh/.test(url) || /[?&]_ytzhsub=1/.test(url)) {
        $done({});
        return;
    }

    console.log(TAG + ' got subtitle for v=' + videoId + ' len=' + body.length);

    // 解析字幕文本（srv3 / xml 格式）
    var text = parseSubtitle(body);
    if (!text || text.length < 50) {
        console.log(TAG + ' subtitle text too short, skip');
        $done({});
        return;
    }

    console.log(TAG + ' parsed text length=' + text.length);

    // 调用 Gemini 生成总结
    var prompt = '以下是一个YouTube视频的字幕文本，请用简体中文生成一个结构清晰的总结。\n\n要求：\n1. 先用1-2句话概括视频主题\n2. 列出3-5个核心要点（用•符号）\n3. 最后一句话说明适合哪类观众\n\n字幕内容：\n' + text.substring(0, 8000);

    var requestBody = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
    });

    var isQX = typeof $task !== 'undefined';

    function onGeminiSuccess(respBody) {
        try {
            var json = JSON.parse(respBody);
            var summary = json.candidates[0].content.parts[0].text;
            console.log(TAG + ' summary generated, len=' + summary.length);

            // 存入持久化存储，供注入脚本读取
            var cacheData = JSON.stringify({
                videoId: videoId,
                summary: summary,
                timestamp: Date.now()
            });

            if (typeof $persistentStore !== 'undefined') {
                $persistentStore.write(cacheData, CACHE_KEY);
            } else if (typeof $prefs !== 'undefined') {
                $prefs.setValueForKey(cacheData, CACHE_KEY);
            }

            console.log(TAG + ' summary saved to store');
        } catch (e) {
            console.log(TAG + ' parse error: ' + e);
        }
        $done({});
    }

    function onError(err) {
        console.log(TAG + ' error: ' + JSON.stringify(err));
        $done({});
    }

    if (isQX) {
        $task.fetch({
            url: GEMINI_URL,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: requestBody
        }).then(function (resp) {
            onGeminiSuccess(resp.body);
        }, onError);
    } else {
        $httpClient.post({
            url: GEMINI_URL,
            headers: { 'Content-Type': 'application/json' },
            body: requestBody
        }, function (err, resp, body) {
            if (err) { onError(err); return; }
            onGeminiSuccess(body);
        });
    }

    // 解析 srv3/xml 字幕格式
    function parseSubtitle(raw) {
        try {
            // 去掉 XML 标签，提取纯文本
            var text = raw
                .replace(/<\?xml[^>]*\?>/g, '')
                .replace(/<text[^>]*>/g, ' ')
                .replace(/<\/text>/g, ' ')
                .replace(/<[^>]+>/g, '')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/\s+/g, ' ')
                .trim();
            return text;
        } catch (e) {
            return '';
        }
    }
})();
