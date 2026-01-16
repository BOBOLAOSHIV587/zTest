let body = JSON.parse($response.body)
body = {
    "status": "ok",
    "payload": {
        "active": true
    }
}
$done({body: JSON.stringify(body)})
