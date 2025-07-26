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
# 去除部分广告
^https?://interface.*\.music\.163\.com/eapi/ad/get url reject
^https?://interface.*\.music\.163\.com/eapi/ad/config/get url reject
^https?://interface.*\.music\.163\.com/eapi/ad/iyunIds url reject
^https?://interface.*\.music\.163\.com/eapi/ad/prefetch/select url reject
^https?://interface.*\.music\.163\.com/eapi/ad/loading/current url reject

[mitm]
hostname = *music.163.com

*******************************/

let header = $request.headers;
const isQuanX = typeof $task !== "undefined";
const MConfig = '{"zr4bw6pKFDIZScpo":{"version":1830912,"appver":"9.1.70"},"tPJJnts2H31BZXmp":{"version":3194880,"appver":"2.0.30"},"c0Ve6C0uNl2Am0Rl":{"version":598016,"appver":"1.7.50"},"IuRPVVmc3WWul9fT":{"version":52744192,"appver":"9.1.70"}}';

const User = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 CloudMusic/0.1.1 NeteaseMusic/8.20.30';

const cookie = 'ntes_kaola_ad=1; EVNSM=1.0.0; NMCID=jnvwlk.1721320815000.01.3; NMDI=Q1NKTQcBDADuDq%2B5OX66KnN8Q%2FxoAAAARwpZIj4IEx42uyAxvJVkZmOEYF5cr0G4BKvykyljSBM3u21U4LzSydM9pBPNUYJPHN7YbQ5uUU68HvaaEEoUYni1LUVNrTWollMRzh3s1o6YmCZZ7pYYlvi0gRbo0%2FYfkIlo0vL%2FoU8%3D; URS_APPID=B4300E3591BDEC0BDAD47C5B75AA09E2A1A402C0FEBDE5407986A72C8CE16DF5B6293116B121D6872A9FEA6913295501; appkey=IuRPVVmc3WWul9fT; appver=9.1.70; buildver=5410; caid={"lastIyunId":"c188fda5639eb7665faa8f12acce7976","iyunId":"8b2f57388088a1c2c7134fa625ad9375","iyunVersion":"20230330","lastIyunVersion":"20220111"}; channel=distribution; deviceId=YD-9Ax%2FxiQscpNFGlFUREaQ6SU1wt1sfjoY; idfa=; idfv=B2B23496-210B-40C0-B47B-C5AF4DADE41B; machineid=iPhone14.2; os=iPhone OS; osver=15.3.1; packageType=release; sDeviceId=YD-9Ax%2FxiQscpNFGlFUREaQ6SU1wt1sfjoY; MUSIC_U=00307E70A5507F2629804CADA3D05BD1B6B00697A2F16DC9D8EC38B6FE27D1196D909D91770B312FC8BD68D694399E4E94626995601805294F9CBD548E086EC4BB4B669381A035327A138E785DBE4937F7F34B791B7E871AB56C50E3A20E79BBF8571D86D8F7C9438381AA967E2C88F74BB1B975DE505E1D742AE24E455C388F99BDF9B159027FCDFEA8893A9DD62FB5D5481A3993C50DBD674768A22042053E977710B3B8B93ADACCB063180A34AE97BBAD782301999959C46708C701C08384927C6971F6FF2B4BDD0C48819C3960BDDA7EF10FA10DC0BB4281B3606B221213A7EBD9FC203512A12E97447F22F9BD5C596F412D0DC64AB6873524749EF67347B861E744D73C534BF50DF1329A204F299827D57201AA797C01C3E35B3C7A37339B; __csrf=b31718c05688c6de932163c8db07fa1c; JSESSIONID-WYYY=897XXw6T5uKIKsa36rp%2FATe1mITtTBM7s5CFu3u4RSMHmWuAPA56txdYghuufkiGmkf3KYpTjF1Z97TvPrveJyI49vl76aUiqtDgxRHkkiV22Vpm3lJNao8JP4TKJ9F8xYv3o5e7X76vqgVAkznNMsQHH%2F0SQijtRz5uCmVw0Kz1ZABh%3A1727759605075; _iuqxldmzr_=33; NMTID=00OaNEuUa4aQSJJSUhUuD-MiC91K-MAAAGSRdsx4Q; WEVNSM=1.0.0; WNMCID=bkuhvj.1727569858785.01.0; _ntes_nnid=4f00a119ae32ccfe726481e421f940b0,1727164162264; _ntes_nuid=dc8ffc0f5263047b3aab88aa620b5660'


if (isQuanX) {
  header["MConfig-Info"] = MConfig;
  header["User-Agent"] = User;
  header["Cookie"] = cookie;
} else {
  header["mconfig-info"] = MConfig;
  header["user-agent"] = User;
  header["cookie"] = cookie;
}

$done({ headers: header });
