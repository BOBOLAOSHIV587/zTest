# capcut-export.js
function dhungx_capcutExport() {
  var body = $response.body;
  var obj = JSON.parse(body);

  // Handle export settings
  if (obj.data) {
    // Unlock export options
    if (obj.data.watermark_option) {
      obj.data.watermark_option.allow_no_watermark = true;
    }
    
    if (obj.data.resolution_option) {
      // Unlock all resolutions
      if (obj.data.resolution_option.resolutions) {
        obj.data.resolution_option.resolutions.forEach(resolution => {
          resolution.enabled = true;
          resolution.premium = false;
        });
      }
      
      // Enable 4K
      obj.data.resolution_option.allow_4k = true;
      obj.data.resolution_option.allow_2k = true;
    }
    
    // Unlock frame rate options
    if (obj.data.framerate_option) {
      if (obj.data.framerate_option.framerates) {
        obj.data.framerate_option.framerates.forEach(framerate => {
          framerate.enabled = true;
          framerate.premium = false;
        });
      }
      obj.data.framerate_option.allow_60fps = true;
    }
    
    // Set export status to premium
    if (obj.data.export_status) {
      obj.data.export_status = "premium";
    }
  }

  $done({body: JSON.stringify(obj)});
}
dhungx_capcutExport();