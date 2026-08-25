const keys = [
"enable_audio_ads",
"enable_display_ads",
"enable_video_ads",
"enable_search_ads",
"enable_search_banner_ads",
"enable_search_sponsored_ads",
"enable_home_banner_ads",
"enable_home_sponsored_ads",
"enable_now_playing_ads",
"enable_now_playing_banner_ads",
"enable_now_playing_sponsored_ads",
"enable_artist_ads",
"enable_artist_banner_ads",
"enable_artist_sponsored_ads",
"enable_playlist_ads",
"enable_playlist_banner_ads",
"enable_playlist_sponsored_ads",
"enable_album_ads",
"enable_album_banner_ads",
"enable_album_sponsored_ads",
"enable_library_ads",
"enable_library_banner_ads",
"enable_library_sponsored_ads",
"enable_sponsored_content",
"enable_sponsored_playlists",
"enable_sponsored_sessions",
"enable_sponsored_stories",
"enable_sponsored_videos",
"enable_sponsored_artist",
"enable_sponsored_artists",
"enable_sponsored_album",
"enable_sponsored_albums",
"enable_sponsored_track",
"enable_sponsored_tracks",
"enable_sponsored_show"
];

function patch(o){
 if(!o || typeof o!=="object") return;
 for(let k of Object.keys(o)){
  if(keys.includes(k)) o[k]=false;
  else if(typeof o[k]==="object") patch(o[k]);
 }
}

try{
 let j=JSON.parse($response.body);
 patch(j);
 $done({body:JSON.stringify(j)});
}catch(e){
 $done({body:$response.body});
}
