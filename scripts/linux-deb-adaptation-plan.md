# Debian (deb 系) Linux 适配清单

本文件用于记录 `master-cyrene2008` 分支针对 Debian/Ubuntu 系 Linux 的逐步适配计划。每完成一项可验证的小改动后单独提交。

## 需要新增 / 重构
- 引入跨平台桌面抽象层：`src/utils/desktopRuntime.js`，用于统一识别 `web / tauri-windows / tauri-linux / tauri-macos`。
- 将 `src/utils/version.js`、`src/utils/updater.js`、`src/utils/updateAsset.mjs` 改为从抽象层获取平台信息，而不是硬编码 `tauri-win64`。
- Linux 下的 URI 注册：通过 `$XDG_DATA_HOME/applications/*.desktop` + `x-scheme-handler/cyrenenr` 注册协议，并提供启用/禁用与检测能力。
- Linux 下的自启动：以 `~/.config/autostart/*.desktop` 作为默认方案（Debian XFCE 可用），移除 Windows 计划任务/UI 提权概念。
- Rust 层新增 `configure_autostart_desktop_entry` / `configure_uri_desktop_entry` 等 Linux-only helper，并在 `set_auto_start` / `set_uri_scheme_enabled` 中走 Linux 分支。

## 需要移除 / 降级（仅 Linux）
- Windows only 的 `schtasks`、`HKCU\...\Run`、`ShellExecuteW` 逻辑保留给 Windows；Linux 分支不可调用。
- `restart_elevated_for_auto_start` 在 Linux 下应返回明确的不支持信息，并在 UI 上隐藏“以管理员身份重启”按钮。
- 更新下载流程中 `.exe` / NSIS 专属判断需要放宽：Linux 匹配 `.deb` / `.AppImage`；当前的 `download_and_launch_update` 仅适合 Windows exe，需要新增 Linux 安装/打开策略。
- `system_accent()` 在 Linux 下返回默认色即可（当前已回退），但 UI/文档需明确这是平台限制。

## 包与构建
- 已支持 `deb` + `appimage` targets；后续增加多架构发布计划：`amd64`、`arm64`、`i386`（若仍需支持）。
- 验证 Tauri 在当前 Ubuntu 22.04 上的依赖链（libwebkit2gtk、librsvg 等），并在仓库文档或安装说明里补充。
- 对齐包名和安装后行为：`/usr/share/applications/*.desktop`、图标路径、首次启动参数等。

## 测试与回归
- 覆盖单元测试：平台识别、资产匹配、autostart/URI desktop entry 生成、Linux update asset selection。
- 在 Ubuntu/Debian 真机或容器中验证：协议注册、自启动、打开链接、最小化到托盘、自动更新流程降级。
- 确保 Windows 行为不回退：所有 Linux 新增路径通过 capability/OS 判断隔离。

## 顺序建议
1. 抽象层 + 平台检测（前端 + Rust 返回平台信息）。
2. Linux autostart（XDG autostart desktop）。
3. Linux URI scheme（xdg-mime / desktop entry + x-scheme-handler）。
4. 更新资产匹配（deb/appimage）与下载策略。
5. UI 适配（隐藏/禁用 Windows-only 控件，增加 Linux 提示）。
6. 多架构打包与安装说明。
