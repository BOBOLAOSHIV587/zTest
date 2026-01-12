/*
海角社区 Cookie 自动捕获脚本
作用：从登录响应中提取 Set-Cookie，自动保存
支持：QX / Surge / Loon
*/

const cookieName = "haijiao_cookie";

if ($request && $request.headers) {
  // QX / Loon: $request
  var respHeaders = $response?.headers || {};
} else if ($request && $response) {
  // Surge: $request + $response
  var respHeaders = $response.headers || {};
} else {
  // 非响应上下文，退出
  $done({});
}

// 从响应头中提取 Set-Cookie
let setCookie = respHeaders['Set-Cookie'] || respHeaders['set-cookie'];
if (!setCookie) {
  console.log("未找到 Set-Cookie");
  $done({});
}

// 多个 Cookie 合并（如数组）
if (Array.isArray(setCookie)) {
  setCookie = setCookie.join('; ');
}

// 只保留必要字段（移除 Path、Domain、Secure 等）
let cleanCookie = setCookie.split(';').map(c => c.trim()).filter(c => {
  return !c.toLowerCase().startsWith('path=') &&
         !c.toLowerCase().startsWith('domain=') &&
         !c.toLowerCase()..startsWith('expires=') &&
         !c.toLowerCase()..startsWith('max-age=') &&
         !c.toLowerCase().startsWith('httponly') &&
         !c.toLowerCase().startsWith('secure');
}).join('; ');

if (cleanCookie) {
  // 保存到持久化存储
  if ($persistentStore) {
    $persistentStore.write(cleanCookie, cookieName);
  } else if ($prefs) {
    $prefs.setValueForKey(cleanCookie, cookieName);
  } else if (typeof $loon !== "undefined") {
    $loon.setStorage(cookieName, cleanCookie);
  }
  console.log("✅ 海角 Cookie 已更新");
}

$done({});
