let token=null;

let h=$request.headers;
token=h.Authorization || h.authorization || null;

if(!token && $response.body){
 let m=$response.body.match(/access_token["']?\s*:\s*["']([^"']+)/);
 if(m) token="Bearer "+m[1];
}

if(token){
 $persistentStore.write(token,"EeveeSpotifyAccessToken");
}

$done({});
