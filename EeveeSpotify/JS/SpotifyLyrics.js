let token =
$persistentStore.read(
"Spotify_AccessToken"
);



if(token){


if(
$request.url.includes(
"musixmatch"
)
||
$request.url.includes(
"spicylyrics"
)
){


$request.headers.Authorization =
token;


}

}



$done({});