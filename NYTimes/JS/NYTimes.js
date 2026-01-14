let body = JSON.parse($response.body);
body = {
  "meta": {},
  "data": {
    "itunes_products": {
      "com.nytimes.ios.allaccess.subscription.49.99.yearly.OC.20000262920": {
        "eligible_for_intro_pricing": false
      }
    },
    "entitlements": {
      "MSD": {
        "expiration_date": "2099-11-01 19:17:23",
        "inherited": false,
        "shareable": true,
        "has_queued_subscription": false
      },
      "ATH": {
        "expiration_date": "2099-11-01 19:17:23",
        "inherited": false,
        "shareable": true,
        "has_queued_subscription": false
      },
      "WC": {
        "expiration_date": "2099-11-01 19:17:23",
        "inherited": false,
        "shareable": true,
        "has_queued_subscription": false
      },
      "AUD": {
        "expiration_date": "2099-11-01 19:17:23",
        "inherited": false,
        "shareable": true,
        "has_queued_subscription": false
      },
      "MTD": {
        "expiration_date": "2099-11-01 19:17:23",
        "inherited": false,
        "shareable": true,
        "has_queued_subscription": false
      },
      "XWD": {
        "expiration_date": "2099-11-01 19:17:23",
        "inherited": false,
        "shareable": true,
        "has_queued_subscription": false
      },
      "MM": {
        "expiration_date": "2099-11-01 19:17:23",
        "inherited": false,
        "shareable": true,
        "has_queued_subscription": false
      },
      "CKG": {
        "expiration_date": "2099-11-01 19:17:23",
        "inherited": false,
        "shareable": true,
        "has_queued_subscription": false
      },
      "MOW": {
        "expiration_date": "2099-11-01 19:17:23",
        "inherited": false,
        "shareable": true,
        "has_queued_subscription": false
      },
      "AAA": {
        "expiration_date": "2099-11-01 19:17:23",
        "inherited": false,
        "shareable": true,
        "has_queued_subscription": false
      }
    },
    "itunes_subscriptions": {
      "2000000449384040": {
        "subscription_group_identifier": "21171062",
        "itunes_product_id": "com.nytimes.ios.allaccess.subscription.49.99.yearly.OC.20000262920",
        "is_in_intro_offer_period": false,
        "auto_renew_status": "1",
        "auto_renew_product_id": "com.nytimes.ios.allaccess.subscription.49.99.yearly.OC.20000262920",
        "original_transaction_id": "2000000449384040",
        "purchase_date": "2023-11-02T00:08:24Z[UTC]"
      }
    }
  }
}
$done({body: JSON.stringify(body)});