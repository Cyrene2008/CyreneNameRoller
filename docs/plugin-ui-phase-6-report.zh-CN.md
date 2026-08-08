# Plugin UI 阶段 6 结果

日期：2026-08-08

## 已实现

- Web 抽签入口统一经过 `CoreClient`，Worker 端以 `state.sync` 和 `draw.execute` 两类消息工作。
- Core Worker 持有算法执行、统计/记录下一状态和 `DrawReceipt` 生成；请求通过单一 Promise 队列串行处理。
- 主线程只负责 Store 状态提交，并在 `CoreClient` 内再次串行化统计/记录持久化，保存失败时回滚两类 Store。
- `draw.execute` 只接受宿主字段：`listId`、`target`、`count`、`allowDuplicates`、`gender`；未知字段返回 `CORE_TRANSACTION_REJECTED`。
- 插件调用方只能提交意图和筛选条件，Receipt 的姓名、结果数组、算法和提交时间由宿主核心生成。
- 插件 Store 不暴露 Worker、端口或内部请求 ID。
- CAF O(候选数) gap 投影已替换等价的候选数组复制，避免大名单抽签超时。

## 验证

- 阶段 6 专测：7/7。
- 全量回归：113/113。
- `npm run build`：成功，产物包含独立 `core.worker` chunk。
- `git diff --check`：通过（仅报告仓库既有 CRLF 转换提示）。
- 端到端协议基线：[`docs/baselines/core-worker-2026-08-08.json`](baselines/core-worker-2026-08-08.json)。1000 次/场景，覆盖 100、10,000、100,000 候选及单次/批量抽签；100,000 候选 p95 分别约 143.189ms、205.181ms。该基线包含 `state.sync`、请求 ID、Worker 串行队列和结果回传，不含真实浏览器 Worker 创建成本。
- 共享 CAF 向量继续由 `scripts/core-algorithm-conformance.test.mjs` 驱动；阶段 7 完成后再接入 Rust 差分向量。

## 尚未完成与风险

- 阶段 7 Tauri Rust 权威事务、`CoreStateEnvelope`、带密钥 MAC、原子替换、启动恢复和只读恢复尚未实现，因此正式版阻塞门槛 B 未通过。
- 阶段 8 SDK/CLI 发布同步、冻结 API 1.2 插件的 Web/Tauri 运行回归和正式发布检查尚未完成。
- 当前基准是 Node 中的 Worker 协议处理器，正式发布前仍需在目标 Chromium 构建中补真实 Worker 创建与端到端 p95 测试。

在阶段 7/8 完成前，项目仍保持内部开发预览状态，不得宣称 Plugin API 1.3 稳定发布。
