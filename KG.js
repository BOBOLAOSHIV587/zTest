/*
[rewrite_local]
^https?://(user|app|entry).qtfm.cn/(m-bff|api|u2/api)/(v1|v5)/(channel_verify|personal/?carrier|user).*$ url script-response-body https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/refs/heads/main/KG.js
^https?://app.qtfm.cn/m-bff/v1/audiostreams url script-request-header https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/refs/heads/main/KG.js

[mitm]
/*
/**
 * GitHub Web URL to Raw URL Converter
 * 适配 Quantumult X, Surge, Loon
 */

const url = $request.url;
// 匹配标准 GitHub 文件浏览链接
// 示例: https://github.com/user/repo/blob/branch/path/to/file
const githubRegex = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)$/;

if (githubRegex.test(url)) {
    const rawUrl = url.replace(githubRegex, 'https://raw.githubusercontent.com/$1/$2/$3/$4');
    
    // 构造 302 重定向响应
    const response = {
        status: 302,
        headers: { 'Location': rawUrl }
    };
    
    // 兼容不同 App 的环境退出方式
    if (typeof $done !== "undefined") {
        $done({ response });
    } else {
        $done({});
    }
} else {
    $done({});
}
