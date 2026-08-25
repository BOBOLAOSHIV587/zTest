const keys = [
"enable_premium_upsell",
"show_premium_upsell",
"show_time_cap_upsell_with_premium_badge",
"have_premium_popup",
"enable_campaigns",
"enable_promotions",
"enable_search_upsell",
"enable_home_upsell",
"enable_now_playing_upsell",
"enable_artist_upsell",
"enable_playlist_upsell",
"enable_album_upsell",
"enable_library_upsell",
"enable_audiobook_upsell",
"enable_podcast_upsell"
];

function patch(o){
 if(!o || typeof o!=="object") return;
 for(let k of Object.keys(o)){
  if(keys.includes(k)){
   if(typeof o[k]==="boolean") o[k]=false;
   else if(typeof o[k]==="number") o[k]=0;
  }else if(typeof o[k]==="object"){
   patch(o[k]);
  }
 }
}

try{
 let j=JSON.parse($response.body);
 patch(j);
 $done({body:JSON.stringify(j)});
}catch(e){
 $done({body:$response.body});
}
