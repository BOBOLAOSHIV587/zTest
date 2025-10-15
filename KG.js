/**
 * Endless Google Injector
 * 适配：Surge / Loon / Quantumult X
 * 功能：在 Google 搜索页注入 Endless Google 无限加载脚本
 * 作者：bobo 修改版
https:\/\/www\.youtube\.com\/api\/timedtext\? url script-response-body https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/KG.js

[Script]
EndlessGoogle = type=http-response,pattern=https:\/\/www\.google\..*\/search\?.*,requires-body=1,max-size=0,script-path=https://raw.githubusercontent.com/yourrepo/EndlessGoogle_Inject.js

[MITM]
hostname = www.google.*

 */

let body = $response.body;

// 防止重复注入
if (body.includes("Endless Google")) {
  $done({ body });
  return;
}

// 在 <head> 注入脚本
const injectScript = `
<script>
${`
(function() {
  if (location.href.indexOf("tbm=isch") !== -1) return;
  if (window.top !== window.self) return;

  const centerElement = "#center_col";
  const loadWindowSize = 1.6;
  const filtersAll = ["#foot", "#bottomads"];
  const filtersCol = filtersAll.concat(["#extrares", "#imagebox_bigimages"]);
  let msg = "";
  const css = \`
  .page-number { position: relative; display: flex; flex-direction: row-reverse; align-items: center; margin-bottom: 2em; color: #808080; }
  .page-number::before { content: ""; background-color: #ededed; height: 1px; width: 100%; margin: 1em 3em; }
  .endless-msg { position:fixed; bottom:0; left:0; padding:5px 10px; background: darkred; color: white; font-size: 11px; display: none; }
  .endless-msg.shown { display:block; }\`;

  let pageNumber = 1, prevScrollY = 0, nextPageLoading = false;

  function requestNextPage() {
    nextPageLoading = true;
    let nextPage = new URL(location.href);
    if (!nextPage.searchParams.has("q")) return;

    nextPage.searchParams.set("start", String(pageNumber * 10));
    !msg.classList.contains("shown") && msg.classList.add("shown");
    fetch(nextPage.href)
      .then(r => r.text())
      .then(text => {
        let parser = new DOMParser();
        let htmlDocument = parser.parseFromString(text, "text/html");
        let content = htmlDocument.querySelector(centerElement);
        content.id = "col_" + pageNumber;
        filter(content, filtersCol);
        content.style.marginLeft = '0';

        let pageMarker = document.createElement("div");
        pageMarker.textContent = String(pageNumber + 1);
        pageMarker.className = "page-number";

        let col = document.createElement("div");
        col.className = "next-col";
        col.appendChild(pageMarker);
        col.appendChild(content);
        document.querySelector(centerElement).appendChild(col);

        if (!content.querySelector("#rso")) {
          window.removeEventListener("scroll", onScrollDocumentEnd);
          msg.classList.remove("shown");
          nextPageLoading = false;
          return;
        }

        pageNumber++;
        nextPageLoading = false;
        msg.classList.remove("shown");
      });
  }

  function onScrollDocumentEnd() {
    let y = window.scrollY, delta = y - prevScrollY;
    if (!nextPageLoading && delta > 0 && y + window.innerHeight * loadWindowSize >= document.body.clientHeight) {
      requestNextPage();
    }
    prevScrollY = y;
  }

  function filter(node, filters) {
    for (let f of filters) {
      let child = node.querySelector(f);
      if (child) child.remove();
    }
  }

  function init() {
    prevScrollY = window.scrollY;
    window.addEventListener("scroll", onScrollDocumentEnd);
    filter(document, filtersAll);
    let style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    msg = document.createElement("div");
    msg.className = "endless-msg";
    msg.innerText = "Loading next page...";
    document.body.appendChild(msg);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
`}
</script>
`;

// 注入到 head 前
body = body.replace(/<\/head>/i, `${injectScript}\n</head>`);

$done({ body });
