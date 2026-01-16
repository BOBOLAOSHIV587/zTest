let body = JSON.parse($response.body)
body = {
  "valid": true,
  "expirationDate_unix_ms": 4092657620000,
  "customer": true
} 

$done({body: JSON.stringify(body)})
