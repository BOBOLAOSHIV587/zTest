const TAG = '[YT-ZH-Sub]';

(function () {
    var url = $request.url;

    if (/[?&]tlang=zh/.test(url) || /[?&]lang=zh/.test(url) || /[?&]_ytzhsub=1/.test(url)) {
        console.log(TAG + ' already zh or recursive, skip');
        $done({});
        return;
    }

    var zhUrl = url + '&tlang=zh-Hans&_ytzhsub=1';

    var headers = {};
    if ($request.headers) {
        Object.keys($request.headers).forEach(function (k) {
            if (k.toLowerCase() !== 'host') {
                headers[k] = $request.headers[k];
            }
        });
    }
    delete headers['Cookie'];
    delete headers['cookie'];

    console.log(TAG + ' fetching: ' + zhUrl.substring(0, 120));

    var isQX = typeof $task !== 'undefined';

    function onSuccess(body, status) {
        console.log(TAG + ' status=' + status + ' bodyLen=' + (body ? body.length : 0));
        if (status === 200 && body && body.length > 100) {
            console.log(TAG + ' replaced with zh subtitle');
            $done({ body: body });
        } else {
            console.log(TAG + ' fetch failed, keep original');
            $done({});
        }
    }

    function onError(err) {
        console.log(TAG + ' error: ' + (err.error || err.message || JSON.stringify(err)));
        $done({});
    }

    if (isQX) {
        $task.fetch({ url: zhUrl, method: 'GET', headers: headers }).then(
            function (resp) { onSuccess(resp.body, resp.statusCode || resp.status || 0); },
            onError
        );
    } else {
        // policy: 'DIRECT' 让 Loon 直连发出，不再触发脚本拦截
        $httpClient.get({ url: zhUrl, headers: headers, policy: 'YouTube' }, function (err, resp, body) {
            if (err) { onError(err); return; }
            onSuccess(body, resp.status);
        });
    }
})();
