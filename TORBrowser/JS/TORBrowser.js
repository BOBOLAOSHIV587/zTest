let body = JSON.parse($response.body);
body.me.active_bundle_subscriptions = [
  {
    "features": [

    ],
    "expiry": "2099-12-31T23:59:59+00:00",
    "product_id": "com.focos.1y_t130_bundle_creator",
    "plan_id": null
  }
]
body.me.active_subscriptions_ids = [
  "com.focos.1y_t130_bundle_creator"
]
body.transactions = {}
$done({body: JSON.stringify(body)});
