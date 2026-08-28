# self-agent

本机优先的个人管家原型：日程 + 多账户财务。数据默认只存浏览器 / 手机本机。

当前可运行文件：[`www/index.html`](www/index.html)

## 现状

- 底栏：首页 / 日程 / 记录 / 财务 / 我的
- 财务账户类型：资金、信贷、理财、储值、订阅、待收回、欠款、物品
- 账户只在财务页内进入
- 记录流：一句话 → 整理 → 确认后才保存

浏览器直接打开 `www/index.html` 即可预览。

## 下一步

用 Capacitor 把 `www/` 包进安卓 WebView。自动记账与密码库见 [`docs/android-capture.md`](docs/android-capture.md)。
