/**
 * Google Search Auto-Pager for Surge
 * 适配 Safari 浏览器
 */

(function() {
    if (window.top !== window.self) return; // 避免在 iframe 中运行

    let isloading = false;
    let nextPageUrl = '';

    // 获取“下一页”的链接
    const getNextPageUrl = () => {
        const nextButton = document.querySelector('#pnnext, a[aria-label="Next page"], a[data-pcu]');
        return nextButton ? nextButton.href : null;
    };

    const loadNextPage = async () => {
        if (isloading) return;
        nextPageUrl = getNextPageUrl();
        if (!nextPageUrl) return;

        isloading = true;
        
        // 创建一个加载指示器
        const loader = document.createElement('div');
        loader.innerHTML = '<div style="text-align:center;padding:20px;color:#70757a;">加载中...</div>';
        document.body.appendChild(loader);

        try {
            const response = await fetch(nextPageUrl);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // 提取搜索结果主容器 (Google 搜索结果通常在 #search 内部)
            const newResults = doc.querySelector('#search');
            if (newResults) {
                const container = document.querySelector('#search');
                // 在当前搜索结果后追加分割线
                const hr = document.createElement('hr');
                hr.style.cssText = 'border:0;border-top:1px solid #dfe1e5;margin:30px 0;';
                container.appendChild(hr);
                
                // 将新内容插入
                container.appendChild(newResults);
            }

            // 更新当前页面的“下一页”链接，以便连续翻页
            const currentNav = document.querySelector('#navcnt, #footrent');
            const newNav = doc.querySelector('#navcnt, #footrent');
            if (currentNav && newNav) {
                currentNav.innerHTML = newNav.innerHTML;
            }

        } catch (e) {
            console.error('自动翻页失败:', e);
        } finally {
            loader.remove();
            isloading = false;
        }
    };

    // 监听滚动事件
    window.addEventListener('scroll', () => {
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const clientHeight = document.documentElement.clientHeight;

        // 距离底部还有 800px 时开始加载
        if (scrollTop + clientHeight > scrollHeight - 800) {
            loadNextPage();
        }
    });
})();
