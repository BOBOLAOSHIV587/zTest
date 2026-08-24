let t=$persistentStore.read("Spotify_AccessToken");
if(t && ($request.url.includes("spicylyrics")||$request.url.includes("musixmatch"))){
 $request.headers.Authorization=t;
}
$done({});
