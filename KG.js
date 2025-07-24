/******************************

脚本功能：酷狗音乐——解锁VIP
软件版本：12.2.0
更新时间：2024.04.14


*******************************
[rewrite_local]
^https:\/\/gateway\.kugou\.com\/updateservice\/ url script-response-body https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/KG.js

                            
[mitm]
hostname = gateway.kugou.com

*******************************/

body = $response.body.replace(/\"is_vip":\w+/g, '\"is_vip":1')
$done({body});