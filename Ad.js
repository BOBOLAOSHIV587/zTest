/*******************************
脚本功能：网易云音乐 最高音质
软件版本：9.1.90
下载地址：
脚本作者：
更新时间：2024
电报频道：https://t.me/GieGie777
问题反馈：
使用声明：此脚本仅供学习与交流，请在下载使用24小时内删除！请勿在中国大陆转载与贩卖！
*******************************
[rewrite_local]
# > 网易云音乐
^https:\/\/interface3\.music\.163\.com\/eapi\/music\/dislike\/change url script-request-header https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Ad.js
# 播放器会员皮肤
^https:\/\/interface3?\.music\.163\.com\/eapi\/playermode\/ url script-request-header https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Ad.js
# 搜索结果会员歌曲
^https:\/\/interface3?\.music\.163\.com\/eapi\/search\/complex\/(page|rec\/song\/get) url script-request-header https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Ad.js
# 播放器会员歌曲
^https:\/\/interface3?\.music\.163\.com\/eapi\/v3\/song\/detail url script-request-header https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Ad.js
^https:\/\/interface3?\.music\.163\.com\/eapi\/song\/(chorus|enhance\/|play\/|type\/detail\/get) url script-request-header https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Ad.js
^https:\/\/interface3?\.music\.163\.com\/eapi\/(v1\/artist\/top\/song|v3\/discovery\/recommend\/songs) url script-request-header https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Ad.js
# 侧边栏会员等级
^https:\/\/interface3?\.music\.163\.com\/eapi\/vipnewcenter\/app\/resource\/newaccountpage url script-request-header https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Ad.js
# 首页歌单会员歌曲
^https?:\/\/interface3?\.music\.163\.com\/eapi\/(homepage\/|v6\/)?playlist\/ url script-request-header https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Ad.js
# 会员认证
^https?:\/\/interface3?\.music\.163\.com\/eapi\/vipauth\/app\/auth\/(soundquality\/)?query url script-request-header https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Ad.js


[mitm]
hostname = *music.163.com

*******************************/

var modifiedHeaders = $request.headers;

modifiedHeaders['Cookie'] = 'MUSIC_U=00CD11039308D14DFD39BF180DDD24D0C0E9D9A919644A4D74388219678336AA1CA0ADEEA7F19CC33E476AB952B50650766361EC504C72C984905C7F00362347DE7491CDBAC10662D4DE168723AE55FE44A721E0B62C25861FE1A96F8744FCC14A977C87B6925C3AA4057C83BC22D2899FA1BCE9D3343D96DF26D2D44D254F7F0C1DB7F2728A8960F6211A1488311109FCEDA36C1FBFED0A0557C2001546B22CBD3BC6E0E660FC21C3844C9D9C20B44CBDC319AA557DE4CFE08B9EE472E9E90866C757BFCCB3B6703CA721AE874C804C8BE47E946C1F8EA7376166AB720F995D482999CD6BF2815224BFE0E1EB3CB40E66BC26FA071C57FE5A2EBD7807C16777B558FEB8432209CE82FA808D22A023CCBDBCA2CD23DD255291B8E24C19BB723656;appver=9.1.42; deviceId=9471bf34a33036f50121ecba0591a4bc; os=iPhone OS; osver=16.2; machineid=iPhone13.4; ' ;

delete modifiedHeaders['MConfig-Info'];
$done({headers : modifiedHeaders});
