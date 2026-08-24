const flags=[


"enable_audio_ads",

"enable_display_ads",

"enable_video_ads",

"enable_search_ads",

"enable_search_banner_ads",

"enable_now_playing_ads",


"enable_podcast_ads",

"enable_audiobook_ads",


"enable_sponsored_content",

"enable_sponsored_playlists",

"enable_sponsored_sessions",

"enable_sponsored_stories",

"enable_sponsored_videos",

"enable_sponsored_artist",

"enable_sponsored_album",

"enable_sponsored_track",

"enable_sponsored_show",

"enable_sponsored_episode"


];


function clean(obj){


if(!obj || typeof obj!=="object")
return;


for(let k of Object.keys(obj)){


if(flags.includes(k)){


obj[k]=false;


}

else if(typeof obj[k]==="object"){


clean(obj[k]);


}

}

}



try{


let json =
JSON.parse($response.body);


clean(json);


$done({

body:
JSON.stringify(json)

});


}catch(e){


$done({

body:$response.body

});

}