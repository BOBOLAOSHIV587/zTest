
[Script]
# 去广告
^https:\/\/vodmanifest\.hulustream\.com\/hulu\/v\d+\/hls\/(video|audio)\/\d+\/ url script-response-body https://raw.githubusercontent.com/liunice/HuluHelper/master/hulu_helper.js
^https:\/\/vodmanifest\.hulustream\.com\/hulu\/v\d+\/hls\/vtt\/\d+\/playlist\.m3u8 url script-response-body https://raw.githubusercontent.com/liunice/HuluHelper/master/hulu_helper.js

# 强制1080p
^https:\/\/vodmanifest\.hulustream\.com\/hulu\/v\d+\/hls\/multivariant\/\d+\/playlist\.m3u8 url script-response-body https://raw.githubusercontent.com/liunice/HuluHelper/master/hulu_helper.js

# 去播放器台标水印
^https:\/\/discover\.hulu\.com\/content\/v\d+\/hubs\/series\/  url script-response-body https://raw.githubusercontent.com/liunice/HuluHelper/master/hulu_helper.js
^https:\/\/discover\.hulu\.com\/content\/v\d+\/browse\/upnext\? url script-response-body https://raw.githubusercontent.com/liunice/HuluHelper/master/hulu_helper.js


