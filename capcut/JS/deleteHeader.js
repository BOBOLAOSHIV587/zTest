# deleteHeader.js
function dhungx_deleteHeader() {
  if ($request.headers) {
    delete $request.headers["X-SS-QUERIES"];
    delete $request.headers["x-tt-token"];
    delete $request.headers["X-Khronos"];
    delete $request.headers["X-Gorgon"];
    delete $request.headers["X-Ladon"];
    delete $request.headers["X-Argus"];
    delete $request.headers["X-Tyhon"];
  }
  $done({headers: $request.headers});
}
dhungx_deleteHeader();