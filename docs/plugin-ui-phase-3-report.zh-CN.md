# Plugin UI 阶段 3 结果

日期：2026-08-08

## 已确认并实现

- 覆盖包使用 `Visibility Policy` 标准化；`protected`/`required` 目标在清单阶段拒绝隐藏，`replaceable` 目标在尚无宿主替代视图时拒绝 `replaced`。
- 覆盖包完整预检后才返回标准化结果，未知目标、非法状态、非法布局会使整个包拒绝，不产生部分状态。
- `roller.filters` 已接入 `hidden + collapse/reserve/compact`：隐藏时宿主继续使用当前或默认点名范围；`reserve` 保留宿主占位；`compact` 提供可键盘操作的“显示筛选”入口。
- 插件管理页提供覆盖包选择和内置“恢复默认界面”，禁用、卸载或崩溃后撤销插件覆盖状态。
- Web 在创建 Pinia/插件 Store 前读取 `safemode.json`，使用 `cache: no-store`；安全模式状态只在启动时读取，运行中修改文件不改变当前状态。
- Web 离线时沿用最近成功状态并标记 `stale`；无历史时默认关闭并显示 `SAFE_MODE_CONFIG_UNAVAILABLE` 诊断；损坏配置强制进入安全模式并返回 `SAFE_MODE_CONFIG_INVALID`。
- Tauri setup 阶段读取 `<appConfigDir>/safemode.json` 并通过 `safe_mode_status` 提供只读状态；安全模式阻断插件包解析、目录、Worker、iframe、命令、字体、动画和视觉贡献。
- Service Worker 对 `safemode.json` 强制 `no-store`，不会写入长期 Shell Cache。

## 本阶段未实现

- 原生声明式视图和固定插槽（阶段 4）。
- `VerifiedResult`、权威 Receipt 统一和 Card/Lottery Receipt（阶段 5）。
- Web Core Worker 与 Rust 权威核心事务、MAC 状态信封和崩溃恢复（阶段 6-7）。

## 验证

- 阶段 3 专测：覆盖包与 Safe Mode 4/4。
- 全量 `npm test`：103/103。
- `npm run build`：成功。
- `cargo check`（`src-tauri`）：成功；仅有既有 dead-code 警告。

## 风险与后续

- 覆盖包当前只接入 Roller 筛选目标和插件管理页选择；其余 optional/replaceable 目标等待对应宿主边界接入。
- Tauri 缺失配置时默认关闭并显示诊断；后续可在设置页提供配置路径说明，但不能提供运行中切换。
