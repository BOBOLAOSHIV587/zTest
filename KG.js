/*
# [rewrite_local]
# ^https?://(user|app|entry).qtfm.cn/(m-bff|api|u2/api)/(v1|v5)/(channel_verify|personal/?carrier|user).*$ url script-response-body https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/refs/heads/main/KG.js
# ^https?://app.qtfm.cn/m-bff/v1/audiostreams url script-request-header https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/refs/heads/main/KG.js

# [mitm]
/*
^https?:\/\/kk\.weshine\.im\/v1\.0\/text2voice\/(checkCount|consumeCount) url jsonjq-response-body .data.totalCount = 999 | .data.currCount = 999

^https?:\/\/kk\.weshine\.im\/v1\.0\/text2voice\/createTtsAudio url jsonjq-response-body .data.freeCount = 999

hostname = kk.weshine.im
