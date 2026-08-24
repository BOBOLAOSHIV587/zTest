const flags=[
"enable_audio_ads","enable_display_ads","enable_video_ads",
"enable_search_ads","enable_search_banner_ads",
"enable_campaigns","enable_promotions",
"enable_sponsored_content",
"enable_sponsored_playlists",
"enable_search_sponsored_ads",
"enable_home_sponsored_ads",
"enable_now_playing_sponsored_ads",
"enable_artist_sponsored_ads",
"enable_playlist_sponsored_ads",
"enable_album_sponsored_ads"
];
function walk(o){
 if(!o||typeof o!=="object")return;
 for(let k of Object.keys(o)){
  if(flags.includes(k))o[k]=false;
  else if(typeof o[k]==="object")walk(o[k]);
 }
}
try{let j=JSON.parse($response.body);walk(j);$done({body:JSON.stringify(j)});}
catch(e){$done({body:$response.body});}
