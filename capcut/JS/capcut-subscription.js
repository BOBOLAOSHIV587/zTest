# capcut-subscription.js
function dhungx_capcutSubscription() {
  var body = $response.body;
  var obj = JSON.parse(body);

  if (obj.data) {
    obj.data.status = "valid";
    obj.data.subscription_type = "premium";
    obj.data.expire_time = 4102415999; // 31/12/2099
    obj.data.start_time = 1714019500; // Current time
    obj.data.product_id = "com.lemon.lvoverseas.premium.yearly";
    
    // Set subscription info
    obj.data.subscription = {
      "status": "ACTIVE",
      "product_id": "com.lemon.lvoverseas.premium.yearly",
      "billing_period": "yearly",
      "is_trial": false,
      "auto_renew": true,
      "purchase_time": 1714019500, // Current time
      "expire_time": 4102415999, // 31/12/2099
      "platform": "ios"
    };
    
    // Set available features
    obj.data.features = {
      "allow_no_watermark": true,
      "allow_high_quality": true,
      "allow_4k": true,
      "allow_60fps": true,
      "allow_premium_templates": true,
      "allow_premium_effects": true,
      "allow_premium_filters": true,
      "allow_premium_transitions": true,
      "allow_premium_stickers": true,
      "allow_premium_fonts": true,
      "allow_premium_music": true,
      "allow_cloud_storage": true
    };
    
    // Set payment info
    obj.data.payment_info = {
      "payment_channel": "apple",
      "payment_status": "success",
      "transaction_id": "1000000XXXXXX",
      "receipt_data": "valid_receipt_data"
    };
  }

  $done({body: JSON.stringify(obj)});
}
dhungx_capcutSubscription();