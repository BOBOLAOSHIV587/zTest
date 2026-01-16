let body = JSON.parse($response.body);
body.subscriptions = [
    {
      "provider": "apple",
      "lastCheckAt": "2025-10-04T12:23:21.014171Z",
      "environment": "production",
      "expiresAt": "2099-12-31T23:59:59Z",
      "application": "plx-clay",
      "willAutoRenew": true,
      "appleInfo": {
        "offerType": "introductoryOffer",
        "productId": "clay.pro.weekly.trial"
      }
    }
]
$done({body: JSON.stringify(body)});
