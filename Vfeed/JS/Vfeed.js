let body = JSON.parse($response.body);
body = {
  "code": 0,
  "data": {
    "inApp": [
    ],
    "latestReceiptInfo": [
      {
        "productId": "vmake.subs.month12.func00.lev00.2023trial.ver1",
        "quantity": 1,
        "promotionalOfferId": "",
        "purchaseDateMs": "1707507158000",
        "autoRenewStatus": true,
        "productType": "",
        "originalTransactionId": "470001823122615",
        "expiresDateMs": "4102444799000",
        "subscriptionGroupIdentifier": "20897211",
        "transactionId": "470001823122615",
        "offerCodeRefName": "",
        "awTransId": "3d4cbaa7-e415-4862-b6c3-ff3781a0deab",
        "isTrialPeriod": true,
        "gracePeriodExpiresDateMs": "",
        "isInIntroOfferPeriod": false,
        "originalPurchaseDateMs": "1707507159000",
        "inAppOwnershipType": "PURCHASED",
        "status": 1
      }
    ]
  },
  "message": "success",
  "update": ""
}
$done({body: JSON.stringify(body)});
