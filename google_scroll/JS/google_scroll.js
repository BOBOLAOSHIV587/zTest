/**
 * Google Search Auto-Pager (V3 Simulation Mode)
 * 适配: Surge, QX, Loon
 */

(function() {
    // 确保只在主页面运行
    if (window.top !== window.self) return;

    let isScrolling = false;
    console.log("Google Auto-Pager: 脚本注入成功");

    // 自动点击逻辑
    const autoClickNext = () => {
        if (isScrolling) return;

        // 核心：适配桌面端 (#pnnext) 和 移动端 (显示更多/Next)
        const selectors = [
            '#pnnext', 
            'a[aria-label="Next page"]', 
            'span[jsname="V67S5c"]', // 移动端“更多结果”
            'a[data-pcu]', 
            '.GN77S' // 部分移动端加载按钮类名
        ];

        let nextButton = null;
        for (let s of selectors) {
            nextButton = document.querySelector(s);
            if (nextButton && nextButton.offsetHeight > 0) break;
        }

        if (nextButton) {
            const rect = nextButton.getBoundingClientRect();
            // 当按钮进入视口下方 600 像素内时触发
            if (rect.top < window.innerHeight + 600) {
                isScrolling = true;
                console.log("Google Auto-Pager: 发现翻页按钮，执行点击...");
                nextButton.click();
                
                // 延迟 2 秒允许加载，防止连续触发
                setTimeout(() => { isScrolling = false; }, 2000);
            }
        }
    };

    // 监听滚动事件
    window.addEventListener('scroll', autoClickNext);
    // 初始执行一次，防止页面太短不触发滚动
    setTimeout(autoClickNext, 1000);
})();

// 兼容各平台的结尾
if (typeof $done !== 'undefined') $done({});
