/**
 * Endless Google Injector
 * 适配：Surge / Loon / Quantumult X
 * 功能：在 Google 搜索页注入 Endless Google 无限加载脚本
 * 作者：bobo 修改版

[rewrite_local]
# Rewrite rule to intercept YouTube video URLs
^https?:\/\/(www\.)?youtube\.com\/watch\?v=(.*) url script-response-body https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/KG.js



[mitm]
hostname = *.youtube.com

*/

// QX Rewrite Script: YouTube Video Summary Notifier

// 监听 YouTube 页面请求
$httpClient.get('https://www.youtube.com/watch?v=([^&]+)', function(error, response, data) {
    if (error) {
        console.error('Error fetching YouTube video:', error);
        return;
    }

    const videoId = extractVideoId(response.url);
    if (videoId) {
        // YouTube 视频 ID 提取成功，继续处理
        showNotification('视频ID提取成功: ' + videoId);
        
        // 在此处可以继续添加处理视频页面内容的逻辑，获取摘要等
    } else {
        showNotification('无法提取视频ID');
    }
});

// 提取视频ID的函数
function extractVideoId(url) {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('v');
}

// 显示通知的函数
function showNotification(message) {
    $notify('YouTube Gemini Summarizer', '', message);
}

// 监听请求并阻止无效的请求
$httpClient.get('https://www.youtube.com/watch', function(error, response, data) {
    if (error) {
        showNotification('无法连接到YouTube');
    } else {
        showNotification('视频页面加载成功');
    }
});
