if($request.url.includes("order/restore")) {
body = body = {
  "code": 0,
  "message": "success",
  "data": {
    "inApp": [],
    "latestReceiptInfo": [
      {
        "quantity": 1,
        "productId": "airbrush.subs.mongth12.func00.lev00.standard.ver2",
        "promotionalOfferId": "",
        "purchaseDateMs": "1717328288000",
        "autoRenewStatus": true,
        "productType": "",
        "originalTransactionId": "1470000008834448",
        "expiresDateMs": "4102444799000",
        "subscriptionGroupIdentifier": "21417206",
        "transactionId": "1470000008834448",
        "offerCodeRefName": "",
        "awTransId": "30100000-2024-0602-1137-069894793197",
        "isTrialPeriod": false,
        "gracePeriodExpiresDateMs": "",
        "isInIntroOfferPeriod": false,
        "originalPurchaseDateMs": "1717328288000",
        "inAppOwnershipType": "PURCHASED",
        "status": 2
      }
    ]
  },
  "update": ""
}
}
else {
body = {
  "message": "success",
  "data": {
    "entitlements": [
      {
        "purchaseDateMs": "1717328288000",
        "transaction_id": "1470000008834448",
        "grace_period_expires_date_ms": "0",
        "start_time": "",
        "type": 3,
        "key": "subscription_iOS",
        "is_trial_period": false,
        "original_transaction_id": "1470000008834448",
        "product_id": "airbrush.subs.mongth12.func00.lev00.standard.ver2",
        "items": [
          "Whiten",
          "Brighten",
          "Auto-retouch",
          "Dark Circles",
          "Acne",
          "Smooth"
        ],
        "end_time": "",
        "originalPurchaseDateMs": "1717328288000",
        "product_type": 2,
        "expires_date_ms": "4102444799000",
        "product_cate": 1
      }
    ]
  },
  "code": 0
}
}
$done({body: JSON.stringify(body)});
