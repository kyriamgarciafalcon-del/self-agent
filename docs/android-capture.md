# 安卓：自动记账与密码收录

原则：只读用户明确授权的系统 API；拿到数据后先弹确认，再写入 self-agent。不要暗中 Hook 微信 / 支付宝，不要做全屏密码监听。

## 自动记账（推荐顺序）

1. **通知栏** `NotificationListenerService`  
   用户授权后，只解析微信 / 支付宝 / 银行 App 的支付成功通知。微信往往不把金额放进通知，能用的主要是支付宝、银行短信、部分银行 App。
2. **确认弹窗**  
   解析出金额、商家后弹层：账户 / 分类 / 是否保存。和现在原型的「确认后保存」一致。
3. **无障碍读支付成功页**（可选，像钱迹）  
   用户主动开启无障碍后，只读支付成功页节点里的金额和商家。Google Play 限制很严，国内应用商店也要审查用途。
4. **不要优先 Xposed Hook**  
   精度高，但破坏对方应用协议，有封号风险，不适合作为 self-agent 的主路。

参考项目：
- https://github.com/AutoAccountingOrg/AutoAccounting
- https://github.com/Evelorion/chaoxi-jizhang
- https://github.com/GystuG/LiteNote
- https://github.com/LLOWDS/wechat-notification-interceptor
- https://github.com/lhalcyon/payment-listener

## 密码收录（只用正式自动填充）

正确做法是实现 Android `AutofillService`：

1. 用户在系统设置里把 self-agent 设为自动填充服务。
2. 登录框出现时，系统把用户名 / 密码框交给你的服务。
3. 用户点「保存到 self-agent」后，才写入本机加密库。
4. 网站端用浏览器扩展或 Chromium 的密码 API，不要注入键盘监听。

禁止：用无障碍通读其他 App 密码框、Hook 输入法、全局键盘日志。这些与监控软件无异，应用商店会下架。

参考项目：
- https://github.com/AChep/keyguard-app
- https://github.com/authpass/authpass
- https://github.com/android-password-store/Android-Password-Store
- https://github.com/Adam-ZS/AccessVault
- https://github.com/android/input（官方 Autofill 示例）
