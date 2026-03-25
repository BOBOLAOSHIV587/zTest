# capcut-resource.js
function dhungx_capcutResource() {
  var body = $response.body;
  var obj = JSON.parse(body);

  // Check if response contains items list (templates, fonts, stickers, etc)
  if (obj.data && obj.data.items) {
    // Loop through items and unlock any premium ones
    obj.data.items.forEach(item => {
      if (item.vip_status) {
        item.vip_status = 0; // Set to free
      }
      if (item.status) {
        item.status = "free"; // Set status to free
      }
      if (item.price) {
        item.price = 0; // Set price to 0
      }
      // Mark as purchased if applicable
      if (item.purchase_status !== undefined) {
        item.purchase_status = 1; // Purchased
      }
      // Unlock if item has template_type
      if (item.template_type) {
        item.template_type = "free";
      }
    });
  }

  // For resource categories
  if (obj.data && obj.data.categories) {
    obj.data.categories.forEach(category => {
      if (category.vip_status) {
        category.vip_status = 0;
      }
      if (category.status) {
        category.status = "free";
      }
    });
  }

  $done({body: JSON.stringify(obj)});
}
dhungx_capcutResource();