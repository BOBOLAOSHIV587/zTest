let token=$persistentStore.read("EeveeSpotifyAccessToken");

if(token && (
$request.url.includes("spicylyrics") ||
$request.url.includes("musixmatch")
)){
 $request.headers.Authorization=token;
}

$done({});
