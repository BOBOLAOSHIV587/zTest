# capcut-pro.js
function dhungx_capcutPro() {
  var body = $response.body;
  var obj = JSON.parse(body);

  if (obj.data) {
    // Mark user as Premium
    obj.data.is_vip = true;
    obj.data.status = "subscribed";
    obj.data.permission = "premium";
    obj.data.expire_time = 4102415999; // 31/12/2099
    
    // Add VIP privileges
    if (!obj.data.vip_privileges) {
      obj.data.vip_privileges = [];
    }
    
    // List of all premium features
    const premiumFeatures = [
      {
        "feature_id": "export_no_watermark",
        "feature_name": "Xuất video không watermark",
        "status": "active"
      },
      {
        "feature_id": "high_quality_export",
        "feature_name": "Xuất video chất lượng cao",
        "status": "active"
      },
      {
        "feature_id": "premium_templates",
        "feature_name": "Mẫu thiết kế premium",
        "status": "active"
      },
      {
        "feature_id": "premium_effects",
        "feature_name": "Hiệu ứng premium",
        "status": "active"
      },
      {
        "feature_id": "premium_filters",
        "feature_name": "Bộ lọc premium",
        "status": "active"
      },
      {
        "feature_id": "premium_transitions",
        "feature_name": "Hiệu ứng chuyển cảnh premium",
        "status": "active"
      },
      {
        "feature_id": "premium_stickers",
        "feature_name": "Sticker premium",
        "status": "active"
      },
      {
        "feature_id": "premium_fonts",
        "feature_name": "Font premium",
        "status": "active"
      },
      {
        "feature_id": "premium_music",
        "feature_name": "Nhạc premium",
        "status": "active"
      },
      {
        "feature_id": "cloud_storage",
        "feature_name": "Lưu trữ đám mây",
        "status": "active"
      }
    ];
    
    // Add all premium privileges to account
    obj.data.vip_privileges = premiumFeatures;
    
    // Add VIP plan info
    obj.data.vip_plan = {
      "plan_id": "premium_yearly",
      "plan_name": "Premium Yearly",
      "start_time": 1714019500, // Current time
      "expire_time": 4102415999, // 31/12/2099
      "renew_status": true,
      "auto_renew_enabled": true
    };
    
    // Set video export status
    if (obj.data.export_status) {
      obj.data.export_status.allow_high_quality = true;
      obj.data.export_status.allow_4k = true;
      obj.data.export_status.allow_no_watermark = true;
      obj.data.export_status.allow_60fps = true;
    } else {
      obj.data.export_status = {
        "allow_high_quality": true,
        "allow_4k": true,
        "allow_no_watermark": true,
        "allow_60fps": true
      };
    }
  }

  $done({body: JSON.stringify(obj)});
}
dhungx_capcutPro();