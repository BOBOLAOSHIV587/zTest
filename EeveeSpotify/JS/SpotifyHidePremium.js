const fields = [

"show_premium_upsell",

"enable_premium_upsell",

"show_time_cap_upsell_with_premium_badge",

"enable_upgrade_button",

"show_upgrade_button",

"premium_upsell_enabled"

];


function patch(obj){

if(!obj || typeof obj !== "object")
return;


for(let key of Object.keys(obj)){


if(fields.includes(key)){


if(typeof obj[key] === "boolean"){

obj[key]=false;

}


if(typeof obj[key] === "number"){

obj[key]=0;

}

}


else if(typeof obj[key] === "object"){

patch(obj[key]);

}


}

}



try{


let json =
JSON.parse($response.body);


patch(json);


$done({

body:
JSON.stringify(json)

});


}catch(e){


$done({

body:$response.body

});


}