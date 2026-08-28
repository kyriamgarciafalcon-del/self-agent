# self-agent

本机优先个人管家：日程 + 多账户财务 + 待确认的支付识别 + 独立密码库。

## 怎么用

底栏：首页 / 日程 / 记录 / 财务 / 我的。账户只在财务里。

- **记录**：贴支付通知原文，或点一条样例。识别结果进待确认队列，**确认后才改余额**。微信没金额就手填。
- **密码库**：在「我的」里进入。解锁后才能看条目。模拟登录会先问「保存到 self-agent？」密码不进财务、不进导出明文。

## 安卓正规能力

| 能力 | 代码 | 系统授权 |
|---|---|---|
| 支付自动记账 | `android/.../PayNotificationService.kt` | 通知使用权 |
| 解析 | `PayParser.kt` 与 `src/lib/pay-parser.ts` | 无 |
| 密码收录 | `SelfAgentAutofillService.kt` | 自动填充服务 |

详见 [docs/android-capture.md](docs/android-capture.md)。

网页桥：`window.onAutoTxn(json)` → 待确认 → 入账。
