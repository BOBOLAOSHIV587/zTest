let body = JSON.parse($response.body);
body.subscriptionEndDate = "2099-11-03T11:09:34.929Z",
body.hasPremium = true,
body.subscriptionStartDate = "2023-11-03T11:09:34.929Z"
console.log(body);
$done({body: JSON.stringify(body)});

*///
const body = JSON.parse($response.body);
if (body.data?.getSubscriptionSummary) {
    body.data.getSubscriptionSummary.hasPremium = true;
	body.data.getSubscriptionSummary.currentTier = "PREMIUM";
	body.data.getSubscriptionSummary.products = [
        {
          "activeSubscriptionDetails": {
            "frequencyInterval": 1,
            "frequencyUnit": "YEAR"
          },
          "productId": "mfp_12m_ios_4999_1m_trial",
          "subscriptionTier": "PREMIUM",
          "subscriptionType": "TRIAL",
          "requestedCancellationDate": "2025-02-13",
          "paymentProvider": "APPLE",
          "subscriptionEndDateTime": "2099-03-13T11:12:25.000Z",
          "willRenew": false,
          "subscriptionStartDateTime": "2099-02-13T12:12:25.000Z"
        }
      ];
if (Array.isArray(body.data.getSubscriptionSummary.features)) {
        body.data.getSubscriptionSummary.features.forEach(feature => {
            if (feature.entitlement === "UPGRADABLE") {
                feature.entitlement = "ENTITLED";
            }
        });
    }
$done({body: JSON.stringify(body)});
} else {
$done({});
}
