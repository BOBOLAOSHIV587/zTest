/**
 * 學術網站自動簽到
 * @author: Tartarus
 * @update: 2023-04-25
 * @supported: Quantumult X
 */

const $ = Env("學術網站簽到");
const url = "https://xueshu.fun/sign";

!(async () => {
  let cookie = await getCookie();
  if (!cookie) return;
  await signIn(cookie);
})().catch((e) => $.log(e)).finally(() => $.done());

function getCookie() {
  return new Promise((resolve) => {
    const options = {
      url: url,
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
      },
    };
    $.get(options, (err, resp, data) => {
      if (err) {
        $.log(`❌ 獲取 Cookie 失敗: ${err}`);
        resolve(false);
      } else {
        const cookie = resp.headers["set-cookie"];
        if (cookie) {
          $.log(`🎉 獲取 Cookie 成功: ${cookie}`);
          resolve(cookie);
        } else {
          $.log("❌ 未找到 Cookie");
          resolve(false);
        }
      }
    });
  });
}

function signIn(cookie) {
  return new Promise((resolve) => {
    const options = {
      url: url,
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
        "Cookie": cookie,
      },
    };
    $.post(options, (err, resp, data) => {
      if (err) {
        $.log(`❌ 簽到失敗: ${err}`);
        resolve();
      } else {
        $.log(`🎉 簽到成功: ${data}`);
        resolve();
      }
    });
  });
}

// https://github.com/Peng-YM/QuanX/blob/master/Tools/ENV.js
function Env(name, opts) {
  class Http {
    constructor(env) {
      this.env = env;
    }

    send(opts, method = "GET") {
      opts = typeof opts === "string" ? { url: opts } : opts;
      let sender = this.get;
      if (method === "POST") {
        sender = this.post;
      }
      return new Promise((resolve, reject) => {
        sender.call(this, opts, (err, resp, body) => {
          if (err) reject(err);
          else resolve(resp);
        });
      });
    }

    get(opts) {
      return this.send.call(this.env, opts);
    }

    post(opts) {
      return this.send.call(this.env, opts, "POST");
    }
  }

  return new (class {
    constructor(name, opts) {
      this.name = name;
      this.http = new Http(this);
      this.data = null;
      this.dataFile = "box.dat";
      this.logs = [];
      this.isMute = false;
      this.isNeedRewrite = false;
      this.logSeparator = "\n";
      this.startTime = new Date().getTime();
      Object.assign(this, opts);
      this.log(`🔔${this.name}, 開始!`);
    }

    isNode() {
      return "undefined" !== typeof module && !!module.exports;
    }

    isQuanX() {
      return "undefined" !== typeof $task;
    }

    isSurge() {
      return "undefined" !== typeof $httpClient && "undefined" === typeof $loon;
    }

    isLoon() {
      return "undefined" !== typeof $loon;
    }

    toObj(str, defaultValue = null) {
      try {
        return JSON.parse(str);
      } catch {
        return defaultValue;
      }
    }

    toStr(obj, defaultValue = null) {
      try {
        return JSON.stringify(obj);
      } catch {
        return defaultValue;
      }
    }

    getjson(key, defaultValue) {
      let json = defaultValue;
      const val = this.getdata(key);
      if (val) {
        try {
          json = JSON.parse(this.getdata(key));
        } catch {}
      }
      return json;
    }

    setjson(key, val) {
      try {
        return this.setdata(JSON.stringify(val), key);
      } catch {
        return false;
      }
    }

    getScript(url) {
      return new Promise((resolve) => {
        this.get({ url }, (err, resp, body) => resolve(body));
      });
    }

    runScript(script, runOpts) {
      return new Promise((resolve) => {
        let httpapi;
        if (this.isQuanX()) {
          httpapi = $task;
        } else if (this.isLoon()) {
          httpapi = $loon;
        } else if (this.isSurge()) {
          httpapi = $httpClient;
        } else {
          httpapi = this.http;
        }
        httpapi.get(
          { url: script, ...runOpts },
          (err, resp, body) => resolve(body)
        );
      });
    }

    loaddata() {
      if (this.isNode()) {
        this.fs = this.fs ? this.fs : require("fs");
        this.path = this.path ? this.path : require("path");
        const curDirDataFilePath = this.path.resolve(this.dataFile);
        const rootDirDataFilePath = this.path.resolve(
          process.cwd(),
          this.dataFile
        );
        const isCurDirDataFile = this.fs.existsSync(curDirDataFilePath);
        const isRootDirDataFile = !isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath);
        if (isCurDirDataFile || isRootDirDataFile) {
          const datPath = isCurDirDataFile ? curDirDataFilePath : rootDirDataFilePath;
          try {
            this.data = JSON.parse(this.fs.readFileSync(datPath));
          } catch (e) {
            this.data = {};
          }
        } else {
          return {};
        }
      } else {
        return {};
      }
    }

    writedata() {
      if (this.isNode()) {
        this.fs = this.fs ? this.fs : require("fs");
        this.path = this.path ? this.path : require("path");
        const datPath = this.path.resolve(this.dataFile);
        const data = JSON.stringify(this.data);
        this.fs.writeFileSync(datPath, data);
      }
    }

    log(...logs) {
      if (this.isMute) return;
      console.log(...logs);
    }

    logErr(e, msg) {
      if (this.isMute) return;
      console.log(`❗️${this.name}, 錯誤!`, e.message);
    }

    msg(title, subtitle = "", desc = "") {
      const toEnvOpts = (title, subtitle, desc) => {
        if (this.isQuanX()) return { "open-url": desc };
        if (this.isSurge() || this.isLoon())
          return { url: `${desc}?title=${title}&subtitle=${subtitle}` };
        else return {};
      };
      if (this.isMute) return;
      if (desc) {
        this.log(`${title}\n${subtitle}\n${desc}`);
      } else {
        this.log(`${title}\n${subtitle}`);
      }
      if (this.isNode()) {
        this.notify = require("./sendNotify");
        this.notify.sendNotify(this.name, `${title}\n${subtitle}\n${desc}`);
      } else {
        $notification.post(title, subtitle, desc, toEnvOpts(title, subtitle, desc));
      }
    }

    getdata(key) {
      if (this.isSurge() || this.isLoon()) {
        return $persistentStore.read(key);
      } else if (this.isQuanX()) {
        return $prefs.valueForKey(key);
      } else if (this.isNode()) {
        this.data = this.loaddata();
        return this.data[key];
      } else {
        return (this.data && this.data[key]) || null;
      }
    }

    setdata(val, key) {
      if (this.isSurge() || this.isLoon()) {
        return $persistentStore.write(val, key);
      } else if (this.isQuanX()) {
        return $prefs.setValueForKey(val, key);
      } else if (this.isNode()) {
        this.data[key] = val;
        this.writedata();
        return true;
      } else {
        return (this.data && this.data[key]) || null;
      }
    }

    wait(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    done(val = {}) {
      const endTime = new Date().getTime();
      const costTime = (endTime - this.startTime) / 1000;
      this.log(`🔔${this.name}, 結束! 🕛 ${costTime} 秒`);
      if (this.isSurge() || this.isQuanX() || this.isLoon()) {
        $done(val);
      }
    }
  })(name, opts);
}