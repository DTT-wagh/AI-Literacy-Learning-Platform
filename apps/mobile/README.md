# 智趣AI学堂移动端

这是 Expo 托管项目。Phase 5 使用 MMKV 和 NetInfo 原生模块，因此不再支持 Expo Go，需使用 Expo development build。

## 首次安装

```powershell
pnpm.cmd install
```

复制 `.env.example` 为 `.env`，把 `EXPO_PUBLIC_API_URL` 改为运行 API 的 Windows 主机 IPv4 地址。当前机器为 `http://10.80.25.15:8080`；网络变化后请更新它。不要使用 `10.0.2.2`，它仅适用于 Android Studio Emulator。

## Android development build

1. 安装 Android Studio/JDK，并让模拟器或设备可被 `adb devices` 识别。
2. 生成并安装开发构建：`pnpm.cmd --dir apps/mobile android`。
3. 后续启动 Metro：`pnpm.cmd --dir apps/mobile start:dev`。

MMKV v4 依赖 React Native New Architecture（本项目已启用），最低 Android API 23、iOS 15.1；不申请运行时权限。Windows 负责 Android 首验，iOS 构建与横竖屏/字体放大最终验收需在 Mac/Xcode 完成。

语境侦探进入“AI候选分析”步骤时，会通过 `EXPO_PUBLIC_API_URL` 调用后端 `/api/v1/game/ai-evaluate`。请求沿用登录 Token；移动端不会保存或配置 AI Provider Key。后端不可用时，游戏显示低置信度降级候选并允许继续复盘。

## 检查

```powershell
pnpm.cmd --dir apps/mobile typecheck
pnpm.cmd --dir apps/mobile test
```
