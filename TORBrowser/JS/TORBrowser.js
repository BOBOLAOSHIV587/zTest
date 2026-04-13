const TAG = '[YT-ZH-Sub]';
const url = $request.url;

if (/[?&]tlang=zh/.test(url) || /[?&]lang=zh/.test(url) || /[?&]_ytzhsub=1/.test(url)) {
    console.log(TAG + ' already zh or recursive, skip');
    $done({});
} else {
    var zhUrl = url + '&tlang=zh-Hans&_ytzhsub=1';
    var headers = {};
    if ($request.headers) {
        Object.keys($request.headers).forEach(function(k) {
            if (k.toLowerCase() !== 'host') {
                headers[k] = $request.headers[k];
            }
        });
    }
    delete headers['Cookie'];
    delete headers['cookie'];

    console.log(TAG + ' fetching zh: ' + zhUrl.substring(0, 120));

    $httpClient.get({ url: zhUrl, headers: headers }, function(err, resp, body) {
        if (err) {
            console.log(TAG + ' error: ' + err);
            $done({});
            return;
        }
        var status = resp.status;
        console.log(TAG + ' status=' + status + ' bodyLen=' + (body ? body.length : 0));
        if (status === 200 && body && body.length > 100) {
            console.log(TAG + ' replaced with zh subtitle');
            $done({ body: body });
        } else {
            console.log(TAG + ' fetch failed, keep original');
            $done({});
        }
    });
}
