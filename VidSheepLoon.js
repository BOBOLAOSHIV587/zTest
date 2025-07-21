#!name=VideoPlay视频聚合
#!desc=https://v.qq.com/sheep/VidSheep/main/  --浏览器打开链接，添加到主屏幕
#!category=😍BOBO Premium
#!openUrl=https://v.qq.com/sheep/VidSheep/main/


[Script]
# > VideoPlay视频聚合
http-response ^https:\/\/v\.qq\.com\/sheep\/VidSheep\/ script-path=https://raw.githubusercontent.com/BOBOLAOSHIV587/Rules/main/JS/VideoPlay/JS/API/VideoPlay-API.js,requires-body=false,tag=VideoPlay视频聚合


[Mitm]
hostname = v.qq.com
