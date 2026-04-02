/**
 * Google Search Auto-Pager (Universal Version)
 * 支持: Quantumult X, Surge, Loon
 */

const $ = new Env("GoogleAutoPager");

(async () => {
    if (typeof document === 'undefined') {
        // 确保在浏览器环境（注入模式）运行
        $.done();
        return;
    }

    let isloading = false;

    const getNextPageUrl = () => {
        const nextButton = document.querySelector('#pnnext, a[aria-label="Next page"], a[data-pcu]');
        return nextButton ? nextButton.href : null;
    };

    const loadNextPage = async () => {
        if (isloading) return;
        const nextUrl = getNextPageUrl();
        if (!nextUrl) return;

        isloading = true;
        console.log("正在加载下一页...");

        try {
            // 使用标准的 fetch (Safari 原生支持)
            const response = await fetch(nextUrl);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const newResults = doc.querySelector('#search');
            if (newResults) {
                const container = document.querySelector('#search');
                const hr = document.createElement('hr');
                hr.style.cssText = 'border:0;border-top:1px solid #dfe1e5;margin:30px 0;opacity:0.5;';
                container.appendChild(hr);
                container.appendChild(newResults);
                
                // 更新翻页按钮状态，以便下次滚动
                const currentNav = document.querySelector('#navcnt, #footrent');
                const newNav = doc.querySelector('#navcnt, #footrent');
                if (currentNav && newNav) currentNav.innerHTML = newNav.innerHTML;
            }
        } catch (e) {
            console.log("翻页失败: " + e);
        } finally {
            isloading = false;
        }
    };

    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
            loadNextPage();
        }
    });
})();

// 简易环境模拟
function Env(name) {
    this.name = name;
    this.log = (m) => console.log(`[${this.name}] ${m}`);
    this.done = (obj = {}) => (typeof $done !== 'undefined' ? $done(obj) : null);
}