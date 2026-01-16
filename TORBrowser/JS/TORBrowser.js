let body = JSON.parse($response.body);
body.data.list = [
  {
    "autoRenewProductId": "VivaCut_Yearly_Pro_9",
    "orderId": "470001817417189",
    "isTrialPeriod": false,
    "endTime": 4102444799000,
    "productId": "VivaCut_Yearly_Pro_9",
    "productType": 3,
    "startTime": 1707126877000,
    "orderStatus": 1,
    "autoRenewStatus": true,
    "originalOrderId": "470001817417189",
    "sign": "de523bfabb4dc6150e8dfbaa10e67f20"
  }
]
body.data.hasFreedTrialProds = [
  "VivaCut_Yearly_Pro_9"
]
body.data.hasPurchasedProds = [
  "VivaCut_Yearly_Pro_9"
]
$done({body: JSON.stringify(body)});
