# Plugin UI 阶段 7 结果

日期：2026-08-08

## 已实现

- Tauri 的 Roller 与插件抽签入口通过 `CoreClient` 调用 Rust `core_draw_execute`，不再使用 Web Core Worker 作为桌面权威事务。
- Rust 对调用方、Principal、grantToken 和抽签输入重新验证；输入结构使用 `deny_unknown_fields`，插件不能提交结果、权重、统计增量、记录正文或算法参数。
- grantToken 由 Rust 进程内随机生成并按 Principal 绑定，不持久化、不写日志；插件禁用、卸载、替换、崩溃或激活失败时撤销对应 Principal。
- `CoreStateEnvelope` 使用版本化结构，包含名单快照、Balance、算法版本、统计、记录、序号、前序摘要和 Receipt 摘要。
- `stateMac` 使用 HMAC-SHA256 覆盖完整核心状态；不是裸 SHA-256 完整性标记。
- 旧 `statistics`、`records`、名单和 Balance 首次进入 Rust 核心时生成 `sequence: 0` 的 genesis 状态。
- 通用 `storage_set` 拒绝写入 `statistics`、`records` 和 `coreStateEnvelope`；Rust 事务提交后，前端 Store 只接收 `persist:false` 的内存快照。
- Rust CAF 3.1.1 直接读取与 JS 相同的共享 JSON 向量，当前全部结果一致。
- 核心写入使用同目录临时文件、`write_all`、`sync_all`、备份、原子替换和目录同步；启动时从主文件、临时文件和备份中选择通过 AES-GCM、HMAC 和链字段验证的最高完整序号。
- 解密失败、HMAC 失败、序号/链字段异常或密钥不可用时，setup 阶段进入只读恢复状态；恢复前不签发令牌、不接受新抽签。

## 验证

- Rust 单测：16/16。
- 共享 JS/Rust 算法向量：7/7。
- 写入故障注入：临时写入、临时同步、备份、替换四个阶段均只能恢复完整旧状态或完整新状态。
- Web 全量回归：114/114。
- `npm run build`：成功。
- `git diff --check`：通过（仅报告仓库既有 CRLF 转换提示）。

## 尚未完成与风险

- 阶段 8 的完整 Tauri 安装运行回归、冻结 API 1.2 插件在真实桌面 WebView 中的安装/启动/抽签/禁用/卸载验证尚未完成。
- 阶段 8 的 SDK、`.d.ts`、CLI、模板、迁移文档和正式发布检查尚未完成。
- 当前 Rust 恢复状态通过命令拒绝和既有宿主恢复入口体现；阶段 8 仍需在真实 Tauri UI 中验证诊断文案、只读提示和恢复操作流程。

在阶段 8 全部发布检查完成前，不得发布稳定 Plugin API 1.3、正式目录条目或正式版标识。
