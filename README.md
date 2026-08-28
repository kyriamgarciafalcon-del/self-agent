# self-agent

本机优先个人管家：日程 + 多账户财务 + 待确认的支付识别 + 独立密码库。

## 网页前端（`src/`）

底栏：首页 / 日程 / 记录 / 财务 / 我的。

已上传：

- `src/components/app-shell.tsx` 底栏
- `src/routes/me.tsx` 我的
- `src/routes/vault.tsx` 密码库
- `src/routes/finance.tsx` 财务布局
- `src/lib/finance.ts` / `finance-store.ts` / `pay-parser.ts` / `vault-store.ts` / `native-bridge.ts`

记录页、财务首页、首页摘要与日程页跟着补传（单文件较大）。

## 安卓

见 `android/` 与 [docs/android-capture.md](docs/android-capture.md)。
