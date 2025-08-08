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
hostname = *music.163.com, interface*.music.163.com

*******************************/

var modifiedHeaders = $request.headers;
Object.keys(modifiedHeaders).forEach(key => {
  const lowerKey = key.toLowerCase();
  if (lowerKey !== key) {
    modifiedHeaders[lowerKey] = modifiedHeaders[key];
    delete modifiedHeaders[key];
  }
});
Object.assign(modifiedHeaders, {
  "mconfig-info": '{"zr4bw6pKFDIZScpo":{"version":2316352,"appver":"9.2.50"},"tPJJnts2H31BZXmp":{"version":3454976,"appver":"2.0.30"},"c0Ve6C0uNl2Am0Rl":{"version":598016,"appver":"1.7.50"},"IuRPVVmc3WWul9fT":{"version":74338304,"appver":"9.2.50"}}',
  "user-agent": "neteasemusic/9.2.50 (iPhone; iOS 18.2; Scale/3.00)",
  "cookie": "MUSIC_A_T=1705532211685; MUSIC_R_T=1705532446019; ntes_kaola_ad=1; EVNSM=1.0.0; NMCID=olqxtu.1737802817000.01.3; NMDI=Q1NKTQcBDADmwA0x9%2FFsGQKlW4FoAAAAPgql9ymlZBw2w%2B1RpxX6lIy2iMM1Kmls6BMIKqqjVxp6XWHhxga%2B63n6X0EBudtAssftkyWAKRWhvSPrConfuT5BDcI2AM31T6dTxoXOtkhxY9CBhvFRhgQvJb2BUKYZa5zG2tV7aK0%3D; URS_APPID=C0B5332B5F1B3A51D16BC6C97F61FCB0C2F449C003BB0DA230AF33DFED8426A09CC2821647BBF7FC67D9350F9678A060; appkey=IuRPVVmc3WWul9fT; appver=9.2.50; buildver=5714; caid={\\"lastIyunId\\":\\"8b08e92346da4d6feb48239bcdba9110\\",\\"iyunId\\":\\"5b6824734e64e650894e481ea6c9867c\\",\\"iyunVersion\\":\\"20230330\\",\\"lastIyunVersion\\":\\"20220111\\"}; channel=distribution; deviceId=c37795fa7cc0bd4d38b242e3da8497a6; idfa=; idfv=B9AA4EE6-B044-47AE-81DF-510AB2565A8C; machineid=iPhone17.2; os=iPhone OS; osver=18.2; packageType=release; sDeviceId=c37795fa7cc0bd4d38b242e3da8497a6; JSESSIONID-WYYY=Yp8PN2DpbKTkDYSjCXfe3Eust5Zx9VJo%2B63NUl6gjzJsv3GFhQ5zOPmOHRnWxYdp%5CfA1uRMpwprIDOuDAH4fZMYCmJP5xdyGkyTWd61pJJobY1BGaPEqrPq9z%5CkQO0oaF30X3%2BSORVRdqttkIemjsuQTs15AwvWdA6d%5CqV9H6mX7AfA6%3A1740379765856; _iuqxldmzr_=33; __csrf=59236862858878a00af1fcfeb4f4f948; NMTID=00ObqALE7hzXAMMuEPrvYh0OEqYL1cAAAGVNayaFg; MUSIC_U=00646BE596B3720AB415D44281F1157F8465C46C48976D97DCCCBE7D5001313BED03D049C5A03783F0C8F29011CF1E69AC2BFF31614203826255958955DC9B45DEA6723D67C37FDA69CBD0C4D6517FBB8E350EC39EE0E6ED4EFDDEB71E8A859B1B1BE6685192B298824E64F3088AA32150E6E4DBF14B831ED4D093722C18185A5EF6A1D60282DBF5D34E9C650A8BFBFB481BFE6BC70D3528FA3D8AE14253F613463612F689AECCA9D94D50B74F1F04DC3A68B0A57B5A0F4076F5EBBF916E2B5210B841EEBB6FFA692E99DA202072D58124CC0BFF5AA84B8071673E961091833836E8E42CE03C44F3E67945F24B5239A8017054BE7FE1BD3BEB232F15DB5DB7402BCD99DAAA983208E3808891FEF2750A46C2364D441F51A0D437EE466B7E6211F1; _ntes_nnid=76d072a12fd96cf846c35fae372fdc24,1737807497367; _ntes_nuid=76d072a12fd96cf846c35fae372fdc24"
});

$done({ headers: modifiedHeaders });

