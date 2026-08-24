const fields={
"enable_premium_upsell":false,
"show_premium_upsell":false,
"show_time_cap_upsell_with_premium_badge":false,
"have_premium_popup":false,
"enable_campaigns":false,
"enable_promotions":false
};
function walk(o){
 if(!o||typeof o!=="object")return;
 Object.keys(o).forEach(k=>{
  if(k in fields)o[k]=fields[k];
  else if(typeof o[k]==="object")walk(o[k]);
 });
}
try{let j=JSON.parse($response.body);walk(j);$done({body:JSON.stringify(j)});}
catch(e){$done({body:$response.body});}
