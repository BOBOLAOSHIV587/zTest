/**
 * YouTube 强制简体中文字幕
 * 响应体脚本 - Loon 专用版
 */

const TAG = '[YT-ZH-Sub]';

(function () {
    var url = $request.url;

    // 已是中文字幕，跳过
    if (/[?&]tlang=zh/.test(url) || /[?&]lang=zh/.test(url)) {
        console.log(TAG + ' already zh, skip');
        $done({});
        return;
    }

    // 从原始 URL 提取 v 参数（视频 ID）
    var vMatch = url.match(/[?&]v=([^&]+)/);
    if (!vMatch) {
        console.log(TAG + ' no video id found, skip');
        $done({});
        return;
    }
    var videoId = vMatch[1];

    // 提取其他必要参数
    var params = ['ei', 'caps', 'opi', 'xoaf', 'xowf', 'xospf',
                  'ip', 'ipbits', 'expire', 'sparams', 'signature',
                  'key', 'kind', 'format'];
    var query = 'v=' + videoId;
    params.forEach(function (p) {
        var m = url.match(new RegExp('[?&]' + p + '=([^&]*)'));
        if (m) query += '&' + p + '=' + m[1];
    });

    // 强制指定简体中文，去掉原来的 lang/tlang/hl
    query += '&hl=zh-Hans&lang=zh-Hans&tlang=zh-Hans&fmt=srv3';

    var zhUrl = 'https://www.youtube.com/api/timedtext?' + query;

    // 构造干净的请求头，不带认证信息
    var headers = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': '*/*',
        'Accept-Language': 'zh-Hans-CN,zh-Hans;q=0.9',
        'Origin': 'https://www.youtube.com',
        'Referer': 'https://www.youtube.com/'
    };

    console.log(TAG + ' fetching clean url for v=' + videoId);

    $httpClient.get({ url: zhUrl, headers: headers }, function (err, resp, body) {
        if (err) {
            console.log(TAG + ' error: ' + JSON.stringify(err));
            $done({});
            return;
        }
        var status = resp.status;
        console.log(TAG + ' status=' + status + ' bodyLen=' + (body ? body.length : 0));
        if (status === 200 && body && body.length > 100) {
            console.log(TAG + ' replaced with zh subtitle');
            $done({ body: body });
        } else {
            console.log(TAG + ' failed status=' + status + ', keep original');
            $done({});
        }
    });
})();
