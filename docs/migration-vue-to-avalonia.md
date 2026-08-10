# Cyrene Name Roller：双端统一架构迁移与兼容方案

- 状态：实施中 v1.1（M0 骨架已完成，M1 共享核心抽取进行中）
- 分支：`cyrene2008-csharp`（基于 v26.2.0）
- 目标：核心代码/底层算法/功能代码只写一份；UI 结构由声明契约驱动，样式由 Vue 与 FluentAvalonia 各自持有；未来功能改动 70–80% 落在共享层，只改一次。

---

## 0. 术语表（阅读本方案的必读章节）

| 术语 | 含义 |
|---|---|
| **共享核心** | 以 JS/TS 编写的全部业务逻辑、算法、数据格式与契约，是唯一的"单一事实源"；两端（Vue 浏览器、C#/Jint）运行的是同一份代码 |
| **Tauri + Web 线** | 现有技术栈：Vue 3 + Pinia + vue-fluent-widgets，桌面壳为 Tauri（Rust + WebView） |
| **C# 线** | 目标技术栈：C# (.NET 10) + Avalonia 12 + FluentAvalonia，桌面壳为原生窗口 |
| **双 UI 薄壳** | 两端各自的 UI 层只做"绑定 + 样式"，不含业务逻辑；业务逻辑一律下沉共享核心 |
| **HostBridge（宿主桥）** | 共享核心与运行环境之间的接口契约（§2.2 十项能力），两端各自实现，签名固定、JSON 序列化进出 |
| **Jint** | 纯 C# 实现的 JS 解释引擎（NuGet: Jint），用于 C# 线运行共享核心与 JS 插件逻辑，无原生依赖 |
| **热路径** | 每帧执行的高频代码（抽奖滚动、缓动、节流）。纪律：热路径不允许进 Jint/JS 解释器，两端原生实现 |
| **A/B/C 类插件** | 插件按能力的三级分类，决定兼容性策略（详见 §3） |
| **UI 声明树** | SDK v2 插件描述页面的 JSON 结构声明（控件、布局意图、数据绑定路径），两端各自渲染（详见 §4） |
| **能力门禁（capability gate）** | 插件声明"需要什么能力"，宿主按声明放行；未声明的能力调用一律拒绝（沿袭现有 runtime.js 语义） |
| **安全模式** | 插件连续崩溃后宿主自动禁用全部第三方插件并以最小能力启动，保证核心功能可用 |
| **.cnrp** | 现有插件包格式：带魔数头的 Zip 归档，内含 manifest.json、插件代码、资源 |
| **Shadow-copy（影子加载）** | 插件 dll 先复制到临时目录再从副本加载，使原始目录可随时删除/更新，规避 Windows 文件锁 |
| **编译绑定** | Avalonia 12 默认开启的绑定模式：绑定表达式在编译期检查类型与路径，错误直接编译失败（AVLNxxxx），而非运行期静默失败 |
| **golden 测试** | 快照对照测试：同一输入，断言两端渲染出的结构树一致（只比结构，不比像素） |
| **单一事实源（SSOT）** | 每个业务规则只允许存在一份实现；任何"两端各写一份"都必须有规范+一致性测试约束 |

---

## 1. 目标架构：单一事实源核心 + 双 UI 薄壳

```
┌────────────── Tauri + Web 线（现状，零改动）──────────────┐
│  Vue 组件(薄壳,样式) → Pinia/桥 → 共享 JS 核心 (单一事实源) │
└──────────────────────────────────────────────────────────┘
┌────────────── C# 线（新增）───────────────────────────────┐
│  FluentAvalonia UI(薄壳,样式) → ViewModel → Jint 引擎      │
│                                       └──加载同一份 JS 核心│
└──────────────────────────────────────────────────────────┘
共享核心 = 算法 + 领域模型 + 插件SDK契约 + .cnrp 格式 + catalog + 存储迁移
```

三条不可动摇的原则：

1. **核心只写一份**：所有业务逻辑、算法、格式、契约以 JS/TS 为单一事实源，两端通过宿主适配层调用。
2. **UI 结构共享、样式分离**：页面/控件结构由声明契约（UI 声明树）驱动，两端各自渲染；样式（CSS / Avalonia Styles）完全由两端自己持有，互不干扰。
3. **热路径双端原生实现**：每帧计算（抽奖滚动、缓动、节流）不经过 Jint/JS 解释器，两端各自原生实现，保证帧预算。

---

## 2. 共享核心模块清单与宿主依赖接口

### 2.1 模块划分（全部留在共享核心，单一事实源）

| 模块 | 现状位置（参考） | 宿主依赖 | 共享方式 |
|---|---|---|---|
| 领域模型与序列化 | stores/*、core/* | 无 DOM 依赖 | 直接共享 |
| 平衡算法 / 抽奖决策 / 统计 | .algorithm、stores/statistics | 纯函数 | 直接共享 |
| 存储 schema 与版本迁移 | stores/settings、records | storage + clock | 共享，C# 提供文件存储实现 |
| 插件 SDK 契约 | plugins/runtime.js、package.js | capability bridge | 共享，宿主换桥实现 |
| .cnrp 解包 / 校验 / 动画包规范化 | plugins/package.js | 文件 IO + 解压 | 共享（宿主提供 ZipArchive 能力） |
| catalog / 依赖解析 / 安全模式 | plugins/catalog.js、safeMode.js | http + 宿主状态 | 共享 |

### 2.2 宿主接口契约（HostBridge，两端各自实现，签名固定）

| 能力 | Tauri 线实现 | C# 线实现 |
|---|---|---|
| http/fetch（catalog、更新检查） | 浏览器 fetch | HttpClient |
| storage（KV + 文件） | localStorage + Tauri store | AppData JSON 文件 |
| clock / setTimeout 调度 | 浏览器定时器 | Dispatcher/线程池桥接 |
| clipboard / openUrl / selectFile | Tauri API | 系统集成 |
| audio.select / audio.play | Tauri API | NAudio/系统播放 |
| notifications.show | Tauri 通知 | 原生通知 |
| platformInfo / capabilities | Tauri 元信息 | 运行时元信息 |
| draw.execute 回调（核心抽取） | 现有实现 | 经 Jint 调共享核心决策 |
| ui.render / ui.action（SDK v2，见 §4） | Vue 映射器 | FluentAvalonia 映射器 |

> 契约以 JSON 序列化为边界，保证两端行为一致；任何新能力都必须先写进契约再实现。
> **实施落点**：契约的唯一事实源为 `packages/cyrene-core/src/host-bridge.js`（25 个方法 + 权限映射 + 请求/响应封装校验，M1-4 完成）；Tauri 线实现为 `src/plugins/runtime.js` 的 `handleRpcPrincipal`，C# 线实现为 `Cyrene.Host`（M3）。

---

## 3. 插件分类与兼容性（A / B / C 类定义）

> 本方案多处引用"A 类 / B 类 / C 类插件"，此处给出唯一定义。分类依据：**插件是否触碰 UI**、**触碰方式是声明式还是命令式**。

| 分类 | 定义 | 典型例子（本项目） | C# 线兼容性 |
|---|---|---|---|
| **A 类 · 纯逻辑钩子** | 不产生任何 UI，只监听/参与抽取流程、数据处理、音频播放 | 音效插件（识别抽取事件→播放音效）、抽奖规则增强、数据统计钩子 | ✅ **100% 兼容**：逻辑在 Jint 中原样运行，HostBridge 换实现即可，包无需改动 |
| **B 类 · 声明式动画包** | 通过 manifest 声明动画（engine: gsap/waapi，from/to 关键帧），由宿主代为执行 | 动画包插件（入场/出场/强调动画） | ✅ **兼容**：动画 JSON 契约本就与引擎无关，C# 端映射到 Composition 引擎（映射表见 §6） |
| **C 类 · UI/页面插件** | 创建页面、修改视图、注册自定义组件，依赖 Vue 组件或 DOM 操作 | 自定义面板页、列表增强页、仪表盘插件 | ⚠️ **不兼容旧版**：Vue 组件/DOM 无法在 C# 运行，必须用 SDK v2 UI 声明树重写（§4） |

三条推论：

1. A/B 类是兼容性主力，**不需要插件作者做任何事**就能在 C# 线运行——"SDK 升级"只影响 C 类。
2. C 类插件的兼容通过 **SDK v2 声明式 UI** 解决（写一次声明，两端自动渲染），而不是让 C# 线嵌 WebView 跑 Vue（割裂体验，明确拒绝）。
3. manifest 通过 `sdkVersion` 标记分类：`1.x` = 仅 JS 运行时专用（A/B 类无 UI 可直跑），`2.x` = 双端通用（含 UI 声明段）。

---

## 4. SDK v2 抽象层：UI 声明树（本次迁移的核心新设计）

### 4.1 原则：结构共享、样式分离

插件不再输出 Vue 组件或 DOM，而是输出**结构声明**（JSON 树）。两端各自持有"Schema → 控件"映射器与样式。修改页面外观时：结构改共享声明（一次），样式分别改两端（各一次）。

### 4.2 UI 声明树语义（描述，非实现）

> **实施落点**：schema 与校验器的单一事实源为 `packages/cyrene-core/src/ui-tree-schema.js` + `ui-tree.js`（M2-1 完成）；manifest 侧 `sdkVersion`/`ui` 段由 `plugin-contract.js` 的 `normalizePluginManifest`/`normalizeUiSection` 强校验（M2-2 完成），`.cnrp` 解析时由 `parsePluginPackage` 加载 `ui.pages` 声明树并经 `normalizeUiTree` 校验。
> **渲染一致性由构造保证（M2-3）**：`ui-tree-render-plan.js` 的 `buildRenderPlan(tree, dataContext)` 在共享核心解析绑定值并产出平台中立「渲染计划」；两端映射器（Vue：`src/plugins/ui/treeRenderer.js` → vue-fluent-widgets 组件；Avalonia：`Cyrene.App/Rendering/UiTreeMapper.cs` → FluentAvalonia 控件）只消费同一份计划做最终实例化。golden 样本：`packages/cyrene-core/test/fixtures/sample-render-plan.json`（两端测试共用同一 fixture 断言结构一致）；控件交集清单落为可测试数据：`ui-tree-mappings.js`（真实组件名，Vue 侧已验证库导出）。

- **页面节点**：页面/区块/卡片/表单，声明布局意图（分组、栅格、堆叠方向），不含像素级样式。
- **控件交集**：仅允许两端都有的语义控件（下表），映射器各自落地：
  | 语义控件 | Tauri 线 | FluentAvalonia 线 |
  |---|---|---|
  | 按钮 / 主次按钮 | FluentButton | Button / ButtonAppearance |
  | 文本输入 / 多行 | FluentTextBox | TextBox / AutoCompleteBox |
  | 单选 / 多选 / 开关 | FluentRadio / Checkbox | RadioButton / CheckBox / ToggleSwitch |
  | 下拉选择 | FluentSelect | ComboBox |
  | 列表 / 分页 | FluentList / Pagination | ListBox / ItemsControl |
  | 滑杆 / 数字步进 | FluentSlider / Stepper | Slider / NumericUpDown |
  | 徽章 / 图标 / 进度 | FluentBadge / Icon / Progress | Border/TextBlock / SymbolIcon / ProgressBar |
  | 数据表格 | — | DataGrid（如需，Tauri 线用 FluentDataGrid 对应） |
- **数据绑定协议**：声明树节点引用数据路径（核心快照如 `names.read`、插件自身存储），事件动作映射到 capability 调用（`ui.action`）。交互逻辑仍在共享 JS 中处理，两端只做绑定壳。
- **动画**：沿用现有声明式动画包，C# 端映射 Composition 引擎（§6）。
- **明确拒绝清单**（v2 不支持，防止 schema 失控）：任意 DOM/VisualTree 操作、动态注册组件、注入自定义样式/CSS、原生控件直通。清单在 manifest 校验阶段报错。

### 4.3 manifest 扩展字段

- `sdkVersion`：1.x（JS 运行时专用）/ 2.x（双端通用）
- `ui.schemaVersion`：声明树 schema 版本
- `ui.pages`：页面声明入口
- `capabilities`：沿用现有能力声明，新增 `ui.render`、`ui.action`

### 4.4 版本与升级策略

- C# 宿主加载：`sdkVersion=2` 且 schema 可解析 → 渲染；`sdkVersion=1` 无 UI 段 → 直接运行（A/B 类插件）；带旧式 UI 依赖 → 标"需升级"，目录内提示。
- 存量 C 类插件双通道：Web 线继续用旧包，v2 包两端通用；不引入 WebView 兼容旧插件（割裂体验，拒绝）。
- 升级引导：catalog 提供 v2 迁移指引 + 校验工具（沿用现有 `cnrp validate` 通道）。

---

## 5. 双宿主适配层

### 5.1 Tauri 线（现状，零改动）

- 保留现有 Vue 视图与组件库；新增两件事：UI 声明树 → Vue 控件映射器；核心模块按 §2.1 抽成独立包（复用现有 `packages/cyrene-name-roller` 结构）。

### 5.2 C# 线（新增）

- **Jint 宿主**：`Cyrene.Host/JintCoreHost`（M3-1 完成）——专用线程 + 串行执行队列 + 加密随机数 shim；共享核心经 `index.js` 统一导出并由 esbuild 打包为 `cyrene-core-bundle.js`（csproj 构建时自动生成），JSON 序列化边界调用。
- **能力桥**：`DefaultHostBridge`（M3-2 完成）——storage（AppData 文件存储）/http/open-url 原生实现，剪贴板/选择器/音频/通知以委托注入（UI 线程能力由 App 接线）；核心快照与 draw.execute 经 Jint 共享核心执行。
- **线程模型**：Jint 在后台线程执行；回调回 UI 一律 `Dispatcher.UIThread.Post`（详见风险 R1）。
- **持久化**：AppData 下 JSON 文件，使用与 Web 线同一份 schema 迁移层（§2.1 共享），保证两端数据可互认。
- **故障域**：`SecureHostBridge`（M3-3 完成）——契约表 + 能力门禁 + 15s 超时 + 异常归一化；契约表与 JS 契约对等一致性测试锁定（25 方法权限映射）。

### 5.3 双端一致性保障

- 共享核心单测（算法、包校验、迁移）在 CI 两端共用。
- 声明树 schema 快照测试（golden 文件）：同一声明输入，两端渲染树结构一致（断言结构，不比较像素）。
- 数据夹具：从历史 release 提取真实数据做迁移测试样本。

---

## 6. 动画平替映射：GSAP → Avalonia Composition

原项目 GSAP 使用点（已核实代码）：`NavigationDock`（面板滑入 + 指示器位移）、`SecondarySidebarMenu`（抽屉）、`AppLayout`（stage/ghost 过渡，含 transform/clipPath/filter/boxShadow）、`animationRegistry.js`（插件声明式动画：`gsap.fromTo` + repeat/yoyo/overwrite 语义）。

### 6.1 双引擎策略

| 场景 | 平替方案 |
|---|---|
| 面板滑动、指示器位移（导航类） | Avalonia `Transitions` + RenderTransform（声明式属性动画） |
| 抽奖滚动、高频帧循环、文本切换 | **Composition API**（渲染线程 60fps，不阻塞 UI 线程；`ScalarKeyFrameAnimation` 驱动 Opacity，`Vector3KeyFrameAnimation` 驱动 Offset/Scale） |
| stage/ghost 舞台切换 | transform/opacity 走 Composition；`clipPath`/`filter`/`boxShadow` 在 Avalonia 无等价 GPU 属性 → 用 `ClipGeometry` + `RenderEffect`(DropShadowEffect) 过渡或降级为 CrossFade |
| 插件声明式动画包 | 新引擎 `composition`：from/to 仅允许白名单属性，验证阶段拒绝未知属性并回退默认动画 |

### 6.2 语义映射表（对齐 animationRegistry.js）

| GSAP 语义 | Avalonia 对应 |
|---|---|
| `gsap.set` | 直接赋值属性 / 动画前快照 |
| `gsap.fromTo` + duration/delay | 两关键帧 KeyFrameAnimation + `BeginTime` 实现 delay |
| `ease: power2.out` 等 | 缓动映射表：power1→QuadraticEaseOut、power2→CubicEaseOut、power3→QuarticEaseOut、back→BackEaseOut、elastic/bounce→ElasticEaseOut/BounceEaseOut、linear→LinearEase；未知回退 CubicEase |
| `repeat` / `yoyo` | `IterationCount` + `PlaybackDirection.Alternate`（或手动补反向关键帧） |
| `timeline + defaults` | 顺序编排多动画实例 / 单属性多关键帧串联，用 `BeginTime` 对齐 |
| `killTweensOf` / `overwrite:'auto'` | `AnimationRegistryService`：按目标控件记录活动动画，`Start` 前先 `Stop` 旧的（复刻原 registry 的 WeakMap + running Set 语义）；卸载插件时统一取消 |
| `xPercent: 100` | 无原生百分比 → 由控件 `Bounds` 换算像素偏移，尺寸变化经 `LayoutUpdated` 重算 |
| `context.revert()` | 记录动画前属性快照，取消时恢复 |
| durationScale 全局缩放 | 保留：所有动画创建前乘缩放系数 |

### 6.3 落地建议

- 抽奖核心（名字飞速滚动）必须用 Composition，否则 VM 批量更新与动画竞争帧。
- 插件动画的 `gsap`/`waapi` 两种 engine 统一收敛为一种 `composition` 引擎，manifest 验证器同步升级，旧包明确报"动画引擎不兼容"。

---

## 7. 迁移阶段路线图

| 里程碑 | 内容 | 验收标准 | 状态 |
|---|---|---|---|
| M0 骨架 | C# 解决方案 + FluentAvalonia 外壳 + 导航 | 空壳可启动，窗口/主题正常 | ✅ 完成（见 §10 ADR） |
| M1 共享核心抽取 | 算法/模型/迁移抽为独立 JS 模块，去 DOM 依赖 | 现有 Tauri 线全量回归通过 | 🔄 进行中 |
| M2 SDK v2 schema | UI 声明树 schema + 校验器 + 映射器骨架（两端） | 示例插件声明在两端渲染一致 | ⏳ |
| M3 C# 宿主 | Jint + HostBridge 全部接口 + Dispatcher 约定 | 宿主 API 单测覆盖后台线程路径 | 🔄 M3-1/2/3/4 完成，M4 接线 |
| M4 Avalonia 视图 | 逐页迁移（静态页 → 抽奖核心页，见 §11） | 各页功能与 Web 线等价 | 🔄 M4-1/4-2 完成，M4-3/4-4 待做 |
| M5 插件双端验证 | A/B 类插件在 C# 线跑通；C 类 v2 重写 1 个样例 | 兼容性矩阵全绿（§10 矩阵） | ⏳ |
| M6 性能门禁 | 抽奖帧率、算法耗时基准 + CI 回归 | 帧率 ≥ 60fps、算法耗时阈值 | ⏳ |

---

## 8. 性能论证与门禁

| 执行路径 | 承载者 | 预期量级 |
|---|---|---|
| 低频算法 / 插件逻辑 | Jint（解释执行，无 JIT） | 毫秒级，充裕 |
| 每帧渲染 / 滚动 / 缓动 | 双端原生（C#: Composition / Web: WAAPI） | 60fps |
| 后端 IO / 打包 / 导出 | C# (.NET 10) 或 Rust（Tauri） | 同量级 |

- **结论**：Jint 只在低频路径，性能不是瓶颈；Avalonia 相对 Tauri 的优势在"无 WebView/IPC 的每帧更新"，不在后端。
- **门禁**：M6 起 CI 跑基准；若某算法在 Jint 实测超阈值 → 走"单规格双实现"（同一份 TS 规范 + 两端原生实现 + 一致性测试锁定），不引入 ClearScript/V8 原生依赖。
- **纪律**：共享核心代码不允许出现 DOM/每帧 API 依赖（lint 规则 + CI 检查），防"共享核心"悄悄长回 UI。

---

## 9. 风险清单

| # | 风险 | 影响 | 缓解 |
|---|---|---|---|
| R1 | 跨线程更新（Jint 回调触碰 ObservableCollection） | 运行时崩溃，最高频 | 唯一写入口 Dispatcher 约定 + 宿主 API 后台线程单测 |
| R2 | 插件 ALC 卸载失败 / Windows 文件锁 | 插件无法更新/卸载 | 卸载协议 + Shadow-copy 加载（插件 dll 从 .cache 副本加载） |
| R3 | 持久化类型错位（double/int、NaN、枚举） | 静默脏数据 | 版本化迁移层 + 严格反序列化 + 真实数据夹具单测 |
| R4 | UI 声明树 schema 偏袒某一端 | 另一端映射器不可实现 | schema 双端负责人共同评审 + 映射器骨架先行（M2） |
| R5 | 共享核心混入 DOM/UI 代码 | 单事实源承诺失效 | lint 禁止 + CI 检查 + 代码评审 |
| R6 | Jint 语法超前于引擎能力 | C# 线运行期崩溃 | 锁定 JS 语法特性（ES2020+）+ lint 规则 |
| R7 | 旧 C 类插件在 C# 线不可用 | 用户迁移体验 | 目录标记 + 升级提示 + v2 迁移工具链 |

---

## 10. 兼容性矩阵（目标态）

| 功能 / 插件类型 | Tauri + Web 线 | C# + FluentAvalonia 线 |
|---|---|---|
| 核心算法 / 抽奖 / 统计 | ✅ 共享核心 | ✅ 共享核心（Jint） |
| 存储数据 | ✅ 现有 | ✅ 同 schema，可互认 |
| A 类插件（纯逻辑钩子） | ✅ | ✅ 原样运行 |
| B 类插件（声明式动画包） | ✅ | ✅ 映射 Composition 引擎 |
| C 类插件 v2（UI 声明树） | ✅ 新映射器 | ✅ 新映射器 |
| C 类插件旧版（Vue 组件） | ✅ 现状 | ❌ 标记升级，不兼容 |
| UI 样式 | Vue + vue-fluent-widgets | FluentAvalonia（各持一份） |

---

## 11. 决策记录（ADR，新增决策持续追加）

| # | 决策 | 理由 | 状态 |
|---|---|---|---|
| ADR-1 | 共享核心以 JS/TS 为单一事实源，C# 线用 **Jint** 嵌入运行 | 现 Vue 线零改动；A/B 类插件与算法原样复用；Jint 纯托管无原生依赖 | 已定 |
| ADR-2 | 目标框架 **net10.0**；Avalonia **12.1.1** + FluentAvaloniaUI **3.0.2**（官方支持 net10/AV12）+ CommunityToolkit.Mvvm 8.4.2 + Jint 4.15.3 | 本机 SDK 10.0.110；FA 3.0.2 依赖 Avalonia ≥12.0，版本对齐已实测编译通过 | 已定 |
| ADR-3 | 开启 Avalonia 12 默认**编译绑定**（`AvaloniaUseCompiledBindingsByDefault=true`），所有绑定必须显式 `x:DataType` | 绑定错误编译期暴露（AVLNxxxx），杜绝运行期静默失败 | 已定（M0 踩坑） |
| ADR-4 | 解决方案采用 **.slnx** 新格式（.NET 10 默认） | 官方新格式，向后兼容 .sln 工具链 | 已定 |
| ADR-5 | 插件 dll 一律 **Shadow-copy** 加载（副本于 `.cache/`） | Windows 文件锁；支持热更新/卸载 | 已定 |
| ADR-6 | 不引入 WebView/Blazor 兼容旧 C 类插件 | 割裂体验；C 类走 SDK v2 声明树重写 | 已定 |
| ADR-7 | 插件动画引擎收敛为单一 `composition` 引擎 | 减少两套引擎的维护面；旧包显式报不兼容 | 已定 |
| ADR-8 | HostBridge 契约以 `packages/cyrene-core/src/host-bridge.js` 为单一事实源 | 双端实现共用同一方法/权限/封装校验表（M1-4 落地，25 方法） | 已定 |
| ADR-9 | 共享核心纯净度以自动扫描守门测试强制（新模块必须通过禁 DOM 检查） | 替代 eslint 配置缺失的现状，CI 即 lint | 已定 |
| ADR-10 | UI 声明树 schema 与校验器落地共享核心（`ui-tree.js`，含字段白名单/绑定源/拒绝清单强制） | C 类插件契约双端共用，拒绝字段静态报错 | 已定 |
| ADR-11 | UI 策略（component-style/override/native-view/result-presentation/font 校验）全部入核心 `ui-policies/` | 均为纯函数，使 `normalizePluginManifest` 完全纯化，C# 线可直接调用 | 已定 |

---

## 12. 视图迁移清单（附录：19 个视图 → Avalonia 页）

迁移顺序按 M4 计划分三批；同批内按复杂度排序。

| 原视图（src/views） | Avalonia 页面（建议） | 批次 | 优先级 |
|---|---|---|---|
| SettingsView / SettingsLayoutView | SettingsView（分段布局） | 第一批·静态页 | 高 |
| ListsView / ListManageView / GroupManageView | ListsView（含管理子页） | 第一批·静态页 | 高 |
| PrizeListManageView | PrizesView | 第一批·静态页 | 高 |
| RecordsView / LotteryRecordsView | RecordsView | 第一批·静态页 | 中 |
| StatisticsView | StatisticsView | 第一批·静态页 | 中 |
| AboutView / ContributorsView / AnnouncementView / DownloadView | AboutView（合并信息类页面） | 第一批·静态页 | 低 |
| LotteryView / RollerView / CardView | LotteryView + RollerView（Composition 热路径） | 第二批·核心页 | 高 |
| FloatingLauncherView | FloatingLauncherWindow（独立小窗） | 第二批·核心页 | 中 |
| PluginManagerView | PluginManagerView | 第三批·插件（依赖 M2/M3） | 高 |
| PluginPageView | PluginPageView（声明树宿主容器） | 第三批·插件（依赖 M2/M3） | 高 |

> 映射器细则：同一功能在两端命名为同名 View；导航结构对应现有 NavigationDock 的侧栏入口，M0 骨架中已用占位页建立导航框架，M4 逐批替换占位实现。

---

## 13. 附录：导航侧边栏 UI 设计规范（Left / LeftCompact）

> 状态：已定稿待实现。落地阶段：**M4-3（导航/抽屉动画）首选**；若 M4-3 优先级被抽奖动画挤占，则顺延至 M6 后。实现时需对接 M2 声明树 `page.location = 'dock'` 的宿主渲染。

### 13.1 两种模式

| 模式 | 说明 |
|---|---|
| **Left** | 常规侧边栏：图标 + 文字，二级菜单缩进展开 |
| **LeftCompact** | 紧凑模式：收起为仅图标列，悬停弹出 Tooltip 或临时展开面板 |

### 13.2 视觉与交互规范

- **背景**：半透明 `AcrylicBrush`（亚克力）或 `Mica`（云母），隐约透出桌面壁纸/窗口底层色，营造层次感；无 Acrylic 支持的平台回退半透明实色。
- **选中态**：选中导航项左侧细长圆角矩形**指示条**（Selection Indicator），颜色跟随系统主题色（Accent）；切换时指示条带**平滑垂直滑动动画**（对应原 NavigationDock 的 gsap 指示器位移，实现见 §6.2 映射）。
- **悬停/按下态**：悬停出现轻微浅色高光反馈；按下有明显下沉缩放效果（scale 0.98 级别，Transitions 实现）。
- **二级菜单**：子项以缩进列表形式在侧边栏内直接展开，带**高度过渡动画**（MaxHeight 或 Grid 行高动画）；字号/字重与一级一致，仅通过左侧 Padding 区分层级。
- **紧凑模式**：收起仅显示图标；悬停时弹出 Tooltip 或临时展开面板（FluentAvalonia Flyout），面板内支持完整二级菜单。

### 13.3 技术映射

| 设计点 | Avalonia 实现 |
|---|---|
| Acrylic/Mica 背景 | `FluentAvalonia.Styling` 的 AcrylicBrush / WindowTransparencyFeatures（Mica），含回退 |
| 指示条滑动动画 | Transitions（Offset/TranslateTransform）或 Composition（§6.2） |
| 按下下沉 | Button Pressed 状态样式 + RenderTransform Scale 过渡 |
| 二级展开 | 子列表 ItemsSource 展开 + MaxHeight/Opacity 过渡 |
| 紧凑模式 | 侧栏宽度切换（220→64）+ Tooltip/Flyout；导航状态仅存 VM |

### 13.4 验收要点

- 切换导航项时指示条平滑滑到新位置（≥30fps 低负载）。
- LeftCompact 下图标 Tooltip 悬停即显，面板展开不遮挡内容区操作。
- 背景半透明不破坏可读性（文字对比度 ≥ 4.5:1，复用 §3.2 对比度校验纪律）。
