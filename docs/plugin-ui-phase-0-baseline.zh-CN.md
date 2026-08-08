# CyreneNameRoller 插件化前端定制系统：阶段 0 检查结果

记录日期：2026-08-08  
检查范围：基线、旧 API 1.2.0、组件目标、插槽、安全模式启动点、算法契约和性能基线。  
结论：**阶段 0 已完成冻结；阶段 1-8 尚未实现，不得据此宣称 Plugin API 1.3 已完成。**

## 已确认事实

### API 1.2 和旧行为

- 宿主 `src/plugins/constants.js`、SDK `plugin-sdk.mjs`/`plugin-sdk.d.ts` 和 CLI `cnrp.mjs` 当前均为 `1.2.0`。
- `DrawReceipt` 的现有必填字段为：`operationId`、`pluginId`、`listId`、`target`、`count`、`allowDuplicates`、`gender`、`algorithm`、`algorithmVersion`、`committedAt`、`results`。当前没有 `sequence`、`previousHash`、`receiptHash`。
- 已冻结旧事件：`draw:item-result`、`draw:result`；Roller 宿主继续发送 `roller:item-result`、`roller:result`。旧中文错误文案仍由现有测试断言，阶段 1 只能追加稳定 `code`。
- 已冻结两个未经重新打包的 API 1.2.0 样本：`scripts/fixtures/plugin-api-1.2/basic-1.0.0.cnrp` 和 `sound-effects-1.1.1.cnrp`。哈希见同目录 README，阶段 8 必须在 Web/Tauri 两端安装、启动、抽签、事件、禁用和卸载回归。

### 当前抽签路径

- 插件抽签已通过 `src/plugins/coreDraw.js` 的串行队列和统计/记录回滚事务，输入仅接受 `listId`、`target`、`count`、`allowDuplicates`、`gender`；结果、权重、历史正文和算法参数会被拒绝。
- 插件 Receipt 由宿主生成，`pluginId` 必填；当前对外没有链式可选字段。
- Roller 宿主仍在 `src/views/RollerView.vue:502` 的 `finishRoll()` 中直接调用 CAF/`Math.random()`，随后直接写入统计和记录（约 537 行），尚未走与插件相同的 Receipt 事务入口，且没有失败回滚。这是阶段 5/6 的明确迁移项。
- Card 和 Lottery 仍使用各自的随机流程，不能冒用人员 `DrawReceipt`。

### 首批 13 个组件目标

13 个目标的契约、平台、策略和当前映射已冻结在 `scripts/fixtures/plugin-ui-api-1.3-contract.json`。当前真实映射如下：

| 目标 | 当前事实与响应式行为 | 阶段 0 结论 |
| --- | --- | --- |
| `app.title-bar` | `TitleBar.vue` 根 `.titlebar`，`isTauri()` 为真时渲染；Web 不可用 | 可登记，Web 必须 `available:false` |
| `app.version-badge` | `AppLayout.vue` 的固定 `.version-badge` | 可登记，允许隐藏/保留占位 |
| `navigation.dock` | `NavigationDock.vue` 根 `.dock`，支持折叠和二级菜单 | 可登记 |
| `navigation.settings-entry` | 设置按钮位于 `.dock-bottom`，当前没有独立稳定类名 | 需阶段 2 增加宿主边界包装；`allowedStyles: []` |
| `roller.current-list` | Roller `.list-selector-bar`，随控制区宽度变化 | 可登记 |
| `roller.filters` | `.switches` 加同级 `.multi-settings`；包含对象/性别/数量模式/重复规则和多人数量输入，English Mode 不属于范围筛选 | 必须保持 `optional`；隐藏后宿主保留当前或默认范围 |
| `roller.primary-action` | `.start-btn`，最小宽度 280px、最小高度 48px | 可登记 |
| `roller.result` | `.display-container`/`.name-display`；当前文本来自宿主本地抽签，不是 Receipt | 目标可登记，Receipt 绑定留到阶段 5/6 |
| `card.controls` | `.card-controls` | 可登记为 `replaceable`，替代视图尚未实现 |
| `card.deck` | `.cards-grid`，CSS grid `auto-fit` | 可登记 |
| `card.item` | `.card`/`.card-face`，固定 140x200px 卡片 | 可登记 |
| `lottery.result` | `.roller-result`/`.wheel-result`，含独立奖品随机流程 | 仅冻结样式边界，Receipt 留到奖品事务完成后 |
| `statistics.summary` | `.stats-summary`，总计和候选人数摘要 | 可登记为 `optional` |

### 插槽、安全模式和通信插入点

- 全部 9 个插槽 ID 已冻结为 `slot:` 命名空间；首批计划开放 `slot:roller.side-panel`、`slot:roller.below-result`、`slot:records.toolbar`，`slot:app.command-palette` 因宿主命令面板尚未实现必须保持 `available:false`，其他插槽目前预留。
- Web 插件初始化实际发生在 `AppLayout.vue` 的 `pluginsStore.initialize()`/`activateEnabled()`；全局 iframe 兼容桥在同文件的 `handlePluginMessage` 监听点调用。`main.js:bootstrap()` 是安全模式读取应提前插入的位置。
- Tauri 入口在 `src-tauri/src/lib.rs` 的 `setup` 闭包；当前 setup 没有读取 `safemode.json`，也没有核心抽签 Rust command。阶段 3/7 必须在此处补齐，不能把现状写成已实现。
- `public/sw.js` 当前通用缓存所有成功 GET，尚未排除 `safemode.json`。

### JS/Rust 算法契约和性能

- 语言无关契约冻结在 `scripts/fixtures/core-algorithm-v3.1.1.json`，覆盖候选顺序、身份键、随机流读取、重复规则、白名单计数和空集合行为；当前 JS 一致性测试为 7/7。
- 当前 CAF 版本为 `cyrenenameroller-balance/v3` / `3.1.1`。
- 基线结果见 `docs/baselines/core-algorithm-js-2026-08-08.json`：同一 Windows x64 / Node v24.11.1，1000 次、预热 1 次。100 候选单次抽取 p95 为 0.131ms，多人不重复 p95 为 0.302ms；10,000 和 100,000 候选两种用例均在 5 秒单用例限时内超时。
- 超时根因已定位到 `src/utils/cyrene-balance.js:128` 的每候选 `counts.slice()`，形成 O(n²) 投影计算。阶段 0 不改算法；阶段 6 必须在共享向量不变的前提下优化或明确发布阻塞。

## 发现的代码与计划差异

1. `roller.filters` 原计划只写 `.switches`，但数量输入在同级 `.multi-settings`；已将计划改为两者共同组成稳定目标，English Mode 明确排除。
2. `navigation.settings-entry` 没有独立类名，原计划的“设置入口”不能直接映射为 `.dock-item`；已将计划改为阶段 2 增加不改变布局的宿主边界包装。
3. 计划的安全模式启动顺序目前只是插入点，实际 Web/Tauri 均未实现安全模式读取；阶段 3 前不得宣称安全模式可用。
4. 宿主 Roller 尚无权威 Receipt 和事务回滚；阶段 5 必须先统一 Roller 宿主与插件抽签入口，阶段 6 再迁移到 Core Worker。
5. 当前 Rust 依赖已有 `aes-gcm`，但没有 `CoreStateEnvelope`、带密钥状态 MAC 或核心事务命令；阶段 7 是正式版阻塞门槛 B。
6. 完整测试基线在补齐 `npm ci` 后通过；此前失败仅因本地 `node_modules` 缺失 `vue-fluent-widgets` 包，不是源码回归。

## 已修正的计划内容

- §10.4.1 的 `navigation.settings-entry` 已注明需要宿主边界包装。
- §10.4.1 的 `roller.filters` 已明确为 `.switches` + `.multi-settings`，并排除 English Mode。
- 其余 `issues.md` 中的字体权限、`slot:` 前缀、Web stale、VerifiedResult 白名单、AppLayout/main.js 插入点等问题已在当前计划版本中体现，阶段实施仍需测试验证。

## 后续实现文件清单

- 阶段 1：`src/plugins/ui/principal.js`、RPC 限额/实例通信、`src/plugins/runtime.js`、`src/plugins/store.js`、`PluginPageView.vue`、`AppLayout.vue`。
- 阶段 2/3：`src/plugins/ui/componentRegistry.js`、`stylePolicy.js`、`overridePolicy.js`、`fontRegistry.js`，组件注册边界和 `src/utils/safeMode.js`，以及核心页面最小包装。
- 阶段 4/5：`viewRegistry.js`、`schema.js`、`PluginNativeView.vue`、`PluginNativeNode.vue`、`PluginSlot.vue`、`VerifiedResult.vue`、结果呈现注册表。
- 阶段 6：`src/core/protocol.js`、`client.js`、`web/core.worker.js`、`web/coreService.js`、持久化适配器；并把共享向量扩展为 JS/Rust 差分测试。
- 阶段 7：`src-tauri/src/lib.rs` 的安全模式、授权令牌、`CoreStateEnvelope`、Rust 算法/统计/记录事务和原子恢复测试。
- 阶段 8：SDK JS/`.d.ts`、CLI 白名单与验证、模板、迁移文档、冻结 1.2 样本的 Web/Tauri 安装回归。

## 阶段 0 验证记录

- `node --test scripts/plugin-sdk.test.mjs scripts/plugin-draw-transaction.test.mjs scripts/plugin-ui-resilience.test.mjs scripts/cyrene-balance.test.mjs`：37/37 通过。
- `node --test scripts/plugin-phase0-contract.test.mjs scripts/core-algorithm-conformance.test.mjs`：11/11 通过。
- `npm ci`：按现有 `package-lock.json` 重建依赖；未修改锁文件。
- 尚未实现阶段 1-8；尤其 Principal、样式/覆盖、原生视图、Safe Mode、VerifiedResult、Core Worker、Rust 核心事务均仍是待办，不能标记为功能完成。
