/*        
        ➪：酷狗音乐解锁永久🆅🅸🅿

        ★：解锁永久🆅🅸🅿

        𖣘： @𝙍𝙣𝙞𝙠➏➏➏
# https://apps.apple.com/cn/app/%E9%85%B7%E7%8B%97%E9%9F%B3%E4%B9%90-%E5%B0%B1%E6%98%AF%E6%AD%8C%E5%A4%9A/id472208016?uo=4
𒊹𒊹𒊹𒊹𒊹𒊹𒊹𒊹𒊹𒊹𒊹𒊹𒊹𒊹𒊹𒊹𒊹𒊹𒊹𒊹𒊹

[rewrite_local]
^https?:\/\/gateway\.kugou\.com url script-response-body https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/KG.js

[MITM]
hostname = gateway.kugou.com


*/


var body = $response.body
// 用户权限类
.replace(/"user_type":\d+/g, '"user_type":1')   
.replace(/"user_y_type":\d+/g, '"user_y_type":9')   
.replace(/"is_vip":\d+/g, '"is_vip":6')   
.replace(/"vip_type":\d+/g, '"vip_type":6')    
// 会员有效期类
.replace(/"annual_fee_begin_time":".*?"/g, '"annual_fee_begin_time":"2099-09-09 23:59:59"')
.replace(/"annual_fee_end_time":".*?"/g, '"annual_fee_end_time":"2099-09-09 23:59:59"')
.replace(/"su_vip_end_time":".*?"/g, '"su_vip_end_time":"2099-09-09"')
.replace(/"vip_end_time":".*?"/g, '"vip_end_time":"2099-09-09 23:59:59"')
// 数值类字段
.replace(/"svip_score":\d+/g, '"svip_score":9')
.replace(/"svip_level":\d+/g, '"svip_level":9')
.replace(/"duration":\d+/g, '"duration":14213245')
.replace(/"p_grade":\d+/g, '"p_grade":20')
.replace(/"p_current_point":\d+/g, '"p_current_point":14213245')
// 防御性替换（仅当字段存在时修改）
.replace(/"m_is_old":(\d+)/, function(match, p1) {     return Number(p1) < 5 ? '"m_is_old":8' : match;   })
.replace(/"roam_type":(\d+)/, function(match, p1) {     return Number(p1) === 0 ? '"roam_type":1' : match;   })
// 用户信息
.replace(/("photo"\s*:\s*")[^"]*(")/, '`latex-inlineEquation 1https://pavo.elongstatic.com/i/ori/1uG8Yb8CUWA.png`2')
.replace(/"nickname":".*?"/, '"nickname":"Rnik666🎖"')
// 时间字段统一处理
.replace(/"(\w+_time)":".*?"/g, function(match, p1) {const timeMap = {end_time: "2099-09-09 23:59:59",roam_end_time: "2099-09-09 23:59:59",m_y_endtime: "2099-09-09 23:59:59"};return timeMap[p1] ? `"`latex-inlineEquation {p1}":"`{timeMap[p1]}"`: match;});

$done({body});
