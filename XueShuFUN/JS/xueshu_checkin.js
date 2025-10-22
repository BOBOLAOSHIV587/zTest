/*
 * 網站: https://xueshu.fun/
 * 腳本功能: 自動簽到
 * 適用平台: Quantumult X
 * 作者: ChatGPT
 * 更新時間: 2023-10-23
 */

const $ = new Env('xueshu.fun 自動簽到');

async function main() {
  const url = 'https://xueshu.fun/sign';
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
  };

  try {
    const response = await $.get({ url, headers });
    if (response.body.includes('簽到成功')) {
      $.msg('xueshu.fun 簽到', '簽到成功!');
    } else {
      $.msg('xueshu.fun 簽到', '簽到失敗,請手動檢查.');
    }
  } catch (e) {
    $.msg('xueshu.fun 簽到', '簽到出錯,請稍後重試.');
    console.log(`Error: ${e}`);
  }
}

function Env(name) {
  this.name = name;

  this.msg = (title, desc) => {
    $notification.post(title, '', desc);
  };

  this.get = (options) => {
    return new Promise((resolve, reject) => {
      $task.fetch(options).then(response => {
        resolve(response);
      }, reason => {
        reject(reason);
      });
    });
  };
}

main();