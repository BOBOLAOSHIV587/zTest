let t=$request.headers.Authorization||$request.headers.authorization;
if(!t&&$response.body){
 let m=$response.body.match(/access_token["']?\s*:\s*["']([^"']+)/);
 if(m)t="Bearer "+m[1];
}
if(t)$persistentStore.write(t,"Spotify_AccessToken");
$done({});
