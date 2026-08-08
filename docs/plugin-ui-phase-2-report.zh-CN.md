# Plugin UI 阶段 2 结果

日期：2026-08-08

## 已确认并实现

- 首批 13 个稳定组件目标已冻结为宿主注册表；`roller.filters` 继续标记为 `optional`，真实映射包含 `.switches` 与 `.multi-settings`。
- Web 端 `app.title-bar` 返回 `available: false`，Tauri 端保留可用声明。
- 组件样式包仅接受稳定组件 ID 和受限样式属性；选择器、CSS 文件、`url()`、`var()`、布局/层级/指针事件等能力在标准化阶段拒绝。
- `required` 与 `protected` 目标执行浅色/深色宿主背景的最终对比度检查，低于 4.5:1 时拒绝。
- 权威结果、名单身份和统计原值目标拒绝插件字体；插件字体只允许目标显式声明 `allowPluginFonts` 的辅助目标。
- 插件字体仅允许包内 WOFF2，单字体不超过 2 MiB，总量不超过 8 MiB，校验 `wOF2` 文件头；禁用、卸载和运行故障后移除 `FontFace`。
- Store 已持久化组件样式选择，插件管理页提供宿主预览与按目标选择；未选择或插件不可用时回退宿主默认样式。
- SDK、CLI、Host Descriptor 和权限白名单同步到 API 1.3；冻结的 API 1.2 插件样本仍按旧路径解析和运行。

## 本阶段未实现

- 组件覆盖包的 `hidden`/`replaceable` 原子应用与 `roller.filters` 隐藏行为（阶段 3）。
- Safe Mode 文件读取与插件启动前阻断（阶段 3）。
- 原生声明式视图、固定插槽、`VerifiedResult`、Web Core Worker 和 Tauri Rust 权威事务（阶段 4-7）。

## 验证

- 阶段 2 专测：组件样式 4/4，字体注册 3/3。
- 全量 `npm test`：99/99。
- `npm run build`：成功。

## 风险与后续

- 目前仅在 Roller 的结果、筛选、当前名单和主操作四个目标接入样式变量；其余注册目标等待各自宿主组件接入。
- 插件字体的真实浏览器加载失败会安全回退宿主字体，但需要在阶段 8 增加跨平台字体加载与无障碍视觉回归。
