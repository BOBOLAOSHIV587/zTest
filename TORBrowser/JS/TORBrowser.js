let body = JSON.parse($response.body)
body = {
  "riveo": {
    "android": {
      "riveo.features.premium": {
        "expire_at": "2099-09-09T20:20:20.000Z",
        "id": "riveo.features.premium",
        "expire_at_ts": 4092657620000,
        "is_active": true
      }
    },
    "ios": {
      "riveo.features.premium": {
        "expire_at": "2099-09-09T20:20:20.000Z",
        "id": "riveo.features.premium",
        "expire_at_ts": 4092657620000,
        "is_active": true
      }
    }
  }
}
$done({body: JSON.stringify(body)})
