let token;


let auth =
$request.headers.Authorization ||
$request.headers.authorization;


if(auth){

token=auth;

}



if($response.body){


let m =
$response.body.match(
/access_token["']?\s*:\s*["']([^"']+)/
);


if(m){

token =
"Bearer "+m[1];

}

}



if(token){


$persistentStore.write(
token,
"Spotify_AccessToken"
);


}



$done({});