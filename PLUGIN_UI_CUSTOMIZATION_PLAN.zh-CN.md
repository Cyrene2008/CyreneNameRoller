# CyreneNameRoller 插件化前端定制系统实施计划

> 文档状态：实施草案  
> 编写日期：2026-08-08  
> 目标版本：Plugin API 1.3.0（建议）  
> 适用平台：Web、Tauri Desktop  
> 实施原则：产品自由、核心状态由宿主掌控；插件声明意图，宿主验证并执行

## 1. 文档目的

本文档给出一套可以由开发者或 AI 直接执行的完整实施计划，用于扩展 CyreneNameRoller 的插件系统，使插件能够在受控范围内完成以下工作：

1. 向核心页面插入宿主原生的工具栏、侧边栏、结果下方区域、统计区域等视图。
2. 修改宿主明确开放的功能组件样式，包括尺寸、颜色、字体、间距、圆角、边框、阴影和对齐方式。
3. 隐藏、压缩或替换宿主明确标记为可处理的非权威组件。
4. 自定义抽签、卡牌、Lottery 等流程的视觉呈现，但不能改变宿主选定的权威结果。
5. 在 Tauri 版中通过受限的 Rust 后端事务获得比 Web 版更强的本地操作能力。
6. 在 Web 版中保证插件无法篡改核心算法、名单、统计、记录和宿主提交的结果。
7. 保持现有 Plugin API 1.2.0 插件可继续安装和运行。

本文档不仅描述最终接口，还明确文件职责、数据结构、验证规则、实施阶段、测试矩阵、迁移方式、恢复机制和验收条件。

### 1.1 HR 硬性要求追踪矩阵

以下要求都不是“建议能力”，而是 Plugin API 1.3 正式版的发布阻塞条件。实施者必须把每一项都落实到代码、自动化测试和发布检查；只完成 UI 定制接口而未完成任一要求时，版本只能作为内部开发预览。

| 要求 ID | HR 要求 | 实现边界 | 主要实现阶段 | 必须通过的验收 |
| --- | --- | --- | --- | --- |
| `HR-CORE-001` | 保护核心算法和数据统计部分 | Web 的抽签、统计和记录提交必须由 Core Worker 持有；Tauri 的抽签、统计和记录提交必须由 Rust 权威事务持有。插件和普通前端 Store 只能提交白名单输入或操作意图，不能提交结果、权重、统计增量、历史正文或算法参数 | 阶段 5、6、7 | 核心写入路径审计、伪造 RPC 测试、并发串行测试、失败回滚测试、JS/Rust 算法向量一致性测试全部通过 |
| `HR-COMPAT-001` | 向下兼容旧版 SDK 插件 | API 1.2 插件无需改包即可安装、启动、调用原有 RPC、接收原有事件并获得原有 `DrawReceipt` 必填字段；通过 `legacyPrincipal` 适配器复用同一套授权内核，不复制第二套安全逻辑 | 阶段 1、5、8 | 使用仓库内冻结的 API 1.2 插件样本集，在 Web/Tauri 两端完成安装、启动、抽签、事件、禁用、卸载和升级回归 |
| `HR-CONSISTENCY-001` | 不出现桌面端和 Web 端两种抽取体验 | 两端可以使用不同语言实现，但必须遵守同一算法契约、算法版本、输入字段、过滤语义、随机源语义、结果顺序、错误码和 Receipt 语义；Web 默认保留优化后的 JS Core Worker，不强制使用 WASM | 阶段 6、7、8 | 共享向量、跨端差分测试、边界用例和性能基线全部通过；任一语义差异阻塞正式发布 |
| `HR-TAURI-INTEGRITY-001` | Tauri 核心数据不可被插件或前端静默篡改 | Rust 独占核心写入；正式提交生成序号和摘要链；加载时验证完整性；异常后进入只读恢复状态。这里承诺的是阻止插件/WebView 写入并检测普通外部编辑，不承诺抵抗本机管理员替换程序二进制 | 阶段 7、8 | 绕过写入测试、文件篡改测试、摘要断链测试、密钥不可用降级测试和只读恢复测试全部通过 |

**安全边界说明：**“保护”指插件不能篡改核心算法、名单、统计、记录和宿主提交结果；不等同于防御用户本人通过开发者工具修改浏览器内存、恶意浏览器扩展、被替换的 Web 部署文件或被攻破的操作系统。Tauri 独立后端可以提供更强的本地信任边界，但同样不承诺抵抗拥有本机高权限且能替换程序二进制的攻击者。

## 2. 当前架构基线

项目当前已经具备以下插件基础能力：

- 插件 Worker 隔离运行。
- 自定义 HTML 页面运行于 `sandbox="allow-scripts"` 的 iframe。
- 插件 HTML 页面可以操作自身沙箱 iframe 内部的 DOM，但不能访问宿主 DOM、宿主 `window` 或同源页面状态。
- 插件通过宿主 RPC 请求能力，不能直接访问 Pinia、宿主 DOM 或任意 Tauri API。
- `resources.query` 提供只读资源。
- `transactions.execute` 提供宿主拥有的状态事务。
- `draw.execute` 只接受名单、目标、数量、性别和是否允许重复等过滤条件。
- 插件不能提交权重、结果数组、历史记录正文和算法参数。
- 统计与记录提交支持失败回滚。
- 已有 `pages`、`commands`、`animationPacks`、`visualSurfaces`、`appearancePacks` 扩展点。
- 已有 `platformEntries`、平台能力检测、Web/Tauri 可用性降级。
- 插件包支持完整性清单和可选 Ed25519 发布者签名。

主要相关文件：

| 文件 | 当前职责 |
| --- | --- |
| `src/plugins/constants.js` | 插件 API 版本、权限、事件、动画目标和命令位置 |
| `src/plugins/package.js` | 插件清单、包完整性、贡献项和样式值验证 |
| `src/plugins/runtime.js` | Worker、iframe、视觉 Worker、RPC、资源和事务调度 |
| `src/plugins/store.js` | 插件安装状态、贡献注册、抽签事务接入、页面桥接、动画与外观管理、在线目录和故障恢复 |
| `src/plugins/coreDraw.js` | 抽签参数校验、串行化 Promise 队列和统计/记录原子提交与回滚 |
| `src/plugins/platform.js` | Web/Tauri 平台能力和系统桥接 |
| `src/plugins/animationRegistry.js` | 动画包注册、选择、执行和清理 |
| `src/plugins/catalog.js` | 在线插件目录、发行版信息和下载资产解析 |
| `src/plugins/eventBus.js` | 宿主内部插件事件发布与订阅 |
| `src/views/PluginPageView.vue` | 原生设置页和沙箱 HTML 插件页 |
| `src/components/plugins/PluginVisualSurface.vue` | OffscreenCanvas 视觉层生命周期 |
| `src/components/plugins/PluginVisualLayers.vue` | 全局插件视觉层收集与挂载 |
| `packages/cyrene-name-roller/src/plugin-sdk.mjs` | 公共插件 SDK 运行时代码 |
| `packages/cyrene-name-roller/src/plugin-sdk.d.ts` | 公共插件 SDK 类型声明 |
| `src-tauri/src/lib.rs` | Tauri 存储、数据加解密、系统操作、原生命令、实例与窗口管理；计划新增安全模式和权威核心事务 |

## 3. 目标与非目标

### 3.1 必须实现的目标

- 插件能够显著改变应用界面，但不能获得宿主 DOM 控制权。
- 插件能够隐藏非权威、非必要组件，但不能隐藏结果、错误、权限和恢复入口。
- 插件能够替换部分可替换组件，但替代视图失效时必须恢复宿主默认组件。
- 样式、隐藏和替换必须由宿主解析、验证和应用。
- 新接口必须同时支持 Web 与 Tauri，并允许 Tauri 提供额外能力。
- 所有新增贡献项必须可在插件禁用、卸载、崩溃或版本不兼容时完整撤销。
- 多插件同时安装时必须有确定、可解释的冲突处理方式。
- 用户必须始终拥有不受插件控制的恢复默认界面入口。

### 3.2 明确不做的事情

- 不允许插件把 Vue 组件加载到宿主 JavaScript 上下文。
- 不允许插件访问或修改 Pinia Store。
- 不允许插件提供任意 CSS 选择器或完整 CSS 文件覆盖宿主。
- 不允许插件设置任意 `position`、`z-index`、`display` 或 `pointer-events`。
- 不允许插件直接调用任意 Tauri command。
- 不允许插件写入名单、历史记录、统计数据或公平算法设置。
- 不允许插件指定抽签结果、候选权重、随机数或记录正文。
- 不承诺 Web 能抵抗用户本人、开发者工具、恶意浏览器扩展或被修改的宿主前端。

## 4. 威胁模型与安全承诺

### 4.1 需要防御的对象

1. 恶意或存在漏洞的插件 Worker。
2. 恶意插件 HTML 页面。
3. 恶意视觉 Worker。
4. 伪造 RPC 消息的插件贡献实例。
5. 请求未授权资源或事务的插件。
6. 试图隐藏警告、伪造结果或遮挡恢复入口的样式包。
7. 插件崩溃、超时、禁用、卸载后的残留 UI 状态。
8. 多插件样式和覆盖规则冲突。

### 4.2 Web 版承诺

Web 版必须保证：

- 插件无法直接访问宿主 DOM、Pinia、LocalStorage、IndexedDB 或核心 Worker 引用。
- 插件只能读取其获批的克隆快照。
- 插件只能提交宿主允许的事务意图。
- 插件无法把自定义结果写入权威记录。
- 插件无法隐藏受保护组件。
- 插件无法通过样式值加载网络资源或执行脚本。
- 插件 HTML 页面的脚本只能操作自身沙箱文档；宿主 iframe 配置不得增加 `allow-same-origin`，也不得向页面暴露宿主对象引用。

Web 版不承诺防御：

- 用户通过开发者工具直接修改本地数据。
- 浏览器扩展注入宿主页面。
- 被篡改的 Web 部署文件。
- 操作系统或浏览器本身被控制。

如果产品未来需要“第三方也可验证的 Web 抽签”，必须增加远程签名服务或公开可验证的远程事务；纯离线 Web 无法提供与独立后端等价的信任边界。

### 4.3 Tauri 版承诺

Tauri 版在完成核心事务迁移后应保证：

- 抽签算法、统计更新和记录提交由 Rust 后端执行。
- 前端和插件只能提交受限输入。
- Rust 后端重新验证所有参数，不能信任前端已经验证的结果。
- 记录和统计在同一个后端事务中提交或回滚。
- 核心算法设置、统计和记录文件只能由 Rust 核心事务写入；前端 Store、插件存储和通用 `storage_set` 不得拥有这些文件的写入路径。
- 每次正式提交生成单调递增的 `sequence`、`previousHash` 和 `receiptHash`；启动、读取和导出前验证链完整性，发现断链、重复序号或摘要不匹配时进入只读恢复状态，不继续写入。
- 完整性密钥优先存放在操作系统安全存储中；无法使用时才回退到现有程序派生密钥，并明确其只能检测普通篡改，不能抵御替换程序二进制的本机高权限攻击者。
- 插件只能调用清单声明且用户授权的专用后端能力。

注意：当前数据加密密钥由程序派生并随程序逻辑分发，它能检测普通损坏和未经授权的直接编辑，但不能对拥有本机高权限并能够修改程序二进制的攻击者提供绝对安全保证。

因此，Tauri 的“不可篡改”在本计划中定义为：插件和 WebView 前端无法直接改写核心状态；普通外部编辑会被完整性链检测；检测到异常时拒绝继续提交并保留恢复路径。它不是对拥有本机管理员权限、可替换应用二进制或可控制操作系统的攻击者作绝对保证。

## 5. 总体目标架构

```text
插件包
  |
  +-- Worker / Page / Visual Surface / Native View / Style Pack
  |
  v
扩展实例 Principal
  - pluginId
  - instanceId
  - kind
  - contributionId
  - grants
  - platform
  |
  v
Plugin Runtime Capability Broker
  |
  +-- 只读资源查询
  +-- 宿主事务
  +-- UI 状态更新
  +-- 插件命令
  +-- 平台能力
  |
  +---------------------------+
  |                           |
  v                           v
Web Core Worker          Tauri Rust Core
  |                           |
  +-- 优化 JS CAF              +-- Rust CAF
  +-- 事务队列                +-- 原子提交
  +-- 权威 Receipt            +-- 本地文件/系统能力
  |                           |
  +-------------+-------------+
                |
                v
         Host Native Renderer
         - Component Registry
         - Style Policy
         - Visibility Policy
         - VerifiedResult
         - Recovery Controls
```

## 6. 核心设计原则

### 6.1 插件不能操作 DOM，只能操作稳定组件 ID

插件不得声明：

```css
.roller-result > h1 { display: none; }
```

插件只能声明：

```json
{
  "roller.filters": {
    "visibility": "hidden"
  }
}
```

`roller.filters` 对应当前 Roller 页的点名范围筛选功能。宿主通过组件注册表查找目标、验证策略并决定是否渲染；隐藏后仍由宿主使用当前或默认点名范围。

### 6.2 权限主体必须是扩展实例，而不是整个插件

必须引入内部 Principal：

```ts
interface PluginPrincipal {
  pluginId: string
  instanceId: string
  kind: 'worker' | 'page' | 'visual' | 'native-view' | 'command'
  contributionId: string
  grants: ReadonlySet<PluginPermission>
  platform: 'web' | 'tauri'
  active: boolean
}
```

有效权限计算：

```text
实例权限 = 安装时用户授权
         ∩ 贡献项 uses 声明
         ∩ 当前平台可用能力
         ∩ 宿主运行时策略
```

插件消息中不得再由插件自行提供可信 `pluginId`。宿主应在创建 MessagePort 或 Worker 时绑定 Principal，之后通过端口身份确定调用者。

### 6.3 权威内容由宿主绑定

以下内容必须由宿主生成并传给宿主组件：

- 当前名单身份。
- 抽签提交状态。
- 权威结果姓名和 ID。
- 算法名称与版本。
- 操作 ID 和提交时间。
- 数据完整性错误。
- 权限和插件故障提示。

插件可以改变这些内容的受限样式，但不能提供替代文本、HTML 或数据数组。

### 6.4 所有 UI 覆盖必须原子应用

一个覆盖包在应用前必须完成完整预检：

1. 所有目标存在。
2. 所有属性被目标允许。
3. 所有值通过格式、范围和无障碍校验。
4. 所有隐藏和替换规则不破坏宿主不变量。
5. 所有替代视图均已注册并可用。
6. 当前平台支持所需能力。

任何一步失败时，整个包不得部分应用。

## 7. Plugin API 版本和兼容策略

### 7.1 建议版本

- `PLUGIN_API_VERSION` 从 `1.2.0` 升为 `1.3.0`。
- `manifest.schemaVersion` 暂时保持 `1`，因为新增字段均为可选字段。
- 使用新增能力的插件应声明 `engine.min: "1.3.0"`。
- 不使用新增能力的 1.2 插件保持原行为。

### 7.2 兼容规则

- 旧插件的 Worker 继续获得原插件级权限，标记为 `legacyPrincipal: true`。
- 新增贡献项必须声明 `uses`。
- 对 `engine.min >= 1.3.0` 的页面、视觉层和命令，建议要求显式 `uses`。
- 对旧页面若缺少 `uses`，临时继承插件权限，同时在插件管理页显示“使用旧版宽权限模型”。
- 保留 `handleRpc(pluginId, method, args)` 作为 API 1.2 内部兼容适配器；适配器根据已安装插件创建 `legacyPrincipal`，随后统一调用 `handleRpc(principal, method, args)`，不得维护两套授权实现。
- 新增贡献实例不得调用旧适配器，必须在创建 Worker、MessagePort、命令或原生视图时绑定 Principal。
- 已发布 `DrawReceipt` 字段保持类型和必填性不变；1.3 只能增加可选字段，`draw:result` 与 `draw:item-result` 的旧监听器必须继续工作。
- 未来 Plugin API 2.0 再移除旧版继承行为。

## 8. 新增权限

在 `src/plugins/constants.js` 与 SDK 中新增：

| 权限 | 用途 |
| --- | --- |
| `ui:native-views` | 向宿主插槽贡献声明式原生视图 |
| `ui:component-styles` | 修改允许目标的样式属性 |
| `ui:component-overrides` | 隐藏、压缩或替换允许目标 |
| `ui:result-presentations` | 提供权威结果的宿主渲染呈现方案 |
| `ui:fonts` | 注册并使用经过验证的插件包内 WOFF2 字体 |

实现时必须同步更新：

- `src/plugins/constants.js` 的 `PLUGIN_PERMISSIONS` Set。
- `packages/cyrene-name-roller/src/plugin-sdk.mjs` 的 `PluginPermissions` 对象。
- `packages/cyrene-name-roller/src/plugin-sdk.d.ts` 的 `PluginPermissions` 声明和 `PluginPermission` 联合类型。
- `packages/cyrene-name-roller/bin/cnrp.mjs` 中独立维护的权限白名单。

原则：

- 只读取插件自己的静态贡献数据不需要运行时 RPC 权限。
- 视图需要读取名单或统计时，仍必须额外声明 `names:read`、`statistics:read` 等权限。
- 视图需要发起抽签时，仍必须声明 `draw:execute`。
- UI 权限不得自动授予任何核心数据权限。

## 9. 新增贡献项总览

在 `manifest.contributes` 中新增：

```ts
interface PluginManifestContributes {
  pages?: PluginPageContribution[]
  commands?: PluginCommandContribution[]
  animationPacks?: PluginAnimationPackContribution[]
  visualSurfaces?: PluginVisualSurfaceContribution[]
  appearancePacks?: PluginAppearancePackContribution[]
  fonts?: PluginFontContribution[]
  nativeViews?: PluginNativeViewContribution[]
  componentStylePacks?: PluginComponentStylePackContribution[]
  componentOverridePacks?: PluginComponentOverridePackContribution[]
  resultPresentations?: PluginResultPresentationContribution[]
}
```

所有贡献项必须：

- 使用插件内唯一的稳定 ID。
- 有数量上限。
- 有总序列化大小上限。
- 在安装阶段解析和标准化。
- 运行时只使用标准化后的对象。

## 10. 宿主组件注册表

### 10.1 新增文件

组件注册表的核心文件建议新增：

```text
src/plugins/ui/componentRegistry.js
src/plugins/ui/stylePolicy.js
src/plugins/ui/overridePolicy.js
src/plugins/ui/viewRegistry.js
src/plugins/ui/principal.js
src/plugins/ui/constants.js
src/plugins/ui/schema.js
```

本节只列组件注册表直接依赖。完整且权威的新增模块清单统一以第 26 节为准；实施者不得把本节视为全部文件列表。

### 10.2 组件目标定义

```ts
type VisibilityPolicy = 'protected' | 'required' | 'replaceable' | 'optional'

interface ComponentTargetDefinition {
  id: string
  route?: string
  platform?: 'all' | 'web' | 'tauri'
  visibilityPolicy: VisibilityPolicy
  allowedStyles: readonly ComponentStyleProperty[]
  allowPluginFonts?: boolean
  allowedLayouts?: readonly ('collapse' | 'reserve' | 'compact')[]
  replacementSlots?: readonly string[]
  minimumContrast?: number
  minimumReadableScale?: number
  description: string
}
```

`replacementSlots` 中只能出现以 `slot:` 开头的已冻结插槽 ID，不能引用组件目标 ID 或插件自造字符串。

### 10.3 策略含义

| 策略 | 插件能力 | 典型目标 |
| --- | --- | --- |
| `protected` | 不可隐藏、不可替换，只允许该目标 `allowedStyles` 显式列出的属性；`allowedStyles: []` 表示完全锁定 | 权威结果、错误、权限提示 |
| `required` | 不可隐藏，可修改受限样式 | 当前名单、主要抽签入口 |
| `replaceable` | 有有效替代视图时可以替换 | 筛选器、次要工具栏 |
| `optional` | 可以隐藏、压缩或调整样式 | 帮助文字、历史预览、装饰内容 |

`visibilityPolicy: 'protected'` 与 `allowedStyles: []` 的组合表示完全锁定：插件不能隐藏、替换或修改任何样式。是否完全锁定由每个目标单独声明，不需要增加第五种策略。

### 10.4 组件目标候选池与首批范围

稳定组件 ID 只能在对应宿主功能真实存在后发布。表中的“现有位置”表示功能已经存在，但实现策略边界时仍可能需要增加一个不改变布局的包装节点或显式策略调用。

#### 10.4.1 Plugin API 1.3 首批 13 个目标

| ID | 平台 | 策略 | 当前实现位置 | 允许操作 |
| --- | --- | --- | --- | --- |
| `app.title-bar` | tauri | required | `src/components/layout/TitleBar.vue`，由 `AppLayout.vue` 挂载 | 颜色、字体、密度 |
| `app.version-badge` | all | optional | `src/components/layout/AppLayout.vue` 的 `.version-badge` | 样式、隐藏、保留占位 |
| `navigation.dock` | all | required | `src/components/layout/NavigationDock.vue` 根导航区域 | 尺寸、颜色、字体、密度 |
| `navigation.settings-entry` | all | protected | `NavigationDock.vue` 的设置按钮（当前没有独立稳定类名，阶段 2 需要增加不改变布局的宿主边界包装） | `allowedStyles: []`，完全锁定 |
| `roller.current-list` | all | required | `src/views/RollerView.vue` 的 `.list-selector-bar` | 字体、颜色、尺寸 |
| `roller.filters` | all | optional | `RollerView.vue` 的 `.switches` 与同级 `.multi-settings`（前者包含对象、性别、数量模式和重复规则，后者包含多人数量输入；English Mode 不属于范围筛选） | 样式、隐藏、压缩；隐藏后使用当前或默认点名范围 |
| `roller.primary-action` | all | required | `RollerView.vue` 的 `.start-btn` | 颜色、字体、尺寸、圆角 |
| `roller.result` | all | protected | `RollerView.vue` 的 `.display-container` 与 `.name-display` | 字体、颜色、背景、边框、间距、动画选择；不可隐藏或改写文本 |
| `card.controls` | all | replaceable | `src/views/CardView.vue` 的 `.card-controls` | 样式；有有效原生替代视图时替换 |
| `card.deck` | all | required | `CardView.vue` 的 `.cards-grid` | 尺寸、间距、背景 |
| `card.item` | all | required | `CardView.vue` 的 `.card` / `.card-face` | 卡面颜色、字体、圆角、阴影 |
| `lottery.result` | all | protected | `src/views/LotteryView.vue` 的 `.roller-result` 与 `.wheel-result` | 权威奖品结果的受限样式；不可隐藏或改写文本 |
| `statistics.summary` | all | optional | `src/views/StatisticsView.vue` 的 `.stats-summary` | 样式、隐藏；替换能力后续开放 |

阶段 0 必须逐项确认以上 13 个目标的宿主映射、策略和响应式行为。第 37 节首个交付版本也以这 13 个目标为统一验收口径。

#### 10.4.2 已存在但延后开放的候选目标

| ID | 当前实现位置 | 延后原因 |
| --- | --- | --- |
| `navigation.secondary-items` | `NavigationDock.vue` 次要导航项 | 需先定义哪些入口允许隐藏 |
| `roller.balance-status` | `RollerView.vue` 的 `.balance-status` | 需确认公平状态是否应为 protected |
| `card.history-tray` | `CardView.vue` 的 `.tray` | 需完成隐藏后的布局测试 |
| `lottery.controls` | `LotteryView.vue` 的 `.draw-toolbar` | 奖品抽取流程与点名事务不同 |
| `lottery.preview` | `LotteryView.vue` 的轮盘和预览区域 | 需定义轮盘模式下的替换语义 |
| `records.table` | `src/views/RecordsView.vue` 的 `.records-card` / `.records-list` | 需定义表格密度和空状态 |
| `records.column.source` | `RecordsView.vue` 的 `.rh-source` / `.ri-source` | 需实现列级策略 |
| `statistics.raw-counts` | `StatisticsView.vue` 的 `.stats-list` | 需保护原始计数值 |
| `statistics.column.english-name` | `StatisticsView.vue` 的 `.col-en` | 英文名列实际位于 Statistics，不在 Records |

#### 10.4.3 必须先新建宿主组件才能开放的候选目标

以下 ID 只是路线图，不得在 Plugin API 1.3 的 `componentTargets` 中标记为可用：

```text
app.file-notice
app.integrity-warning
plugins.recovery-entry
roller.secondary-actions
roller.helper-text
roller.history-preview
roller.progress
roller.result-meta
card.helper-text
card.result
lottery.secondary-summary
lottery.commit-state
records.toolbar
records.integrity-state
statistics.chart
```

这些目标必须先建立明确的宿主组件、数据来源、可见性策略和自动化测试，再在后续 API 版本中开放。Host Descriptor 对预留目标可以完全省略，或返回 `available: false`；不得让插件声明后静默无效。

## 11. 组件样式包

### 11.1 清单示例

```json
{
  "permissions": ["ui:component-styles"],
  "contributes": {
    "componentStylePacks": [{
      "id": "large-classroom",
      "title": "大屏课堂样式",
      "targets": {
        "roller.result": {
          "size": "large",
          "fontFamily": "host:display",
          "fontWeight": 700,
          "foreground": "#172033",
          "background": "#ffffff",
          "accent": "#d84c9f",
          "radius": 8,
          "padding": "comfortable",
          "alignment": "center"
        }
      }
    }]
  }
}
```

### 11.2 允许的样式属性

```ts
type ComponentStyleProperty =
  | 'size'
  | 'scale'
  | 'foreground'
  | 'background'
  | 'accent'
  | 'fontFamily'
  | 'fontSize'
  | 'fontWeight'
  | 'lineHeight'
  | 'padding'
  | 'gap'
  | 'radius'
  | 'borderColor'
  | 'borderWidth'
  | 'shadow'
  | 'alignment'
  | 'density'
```

### 11.3 建议范围

| 属性 | 允许值 |
| --- | --- |
| `size` | `small`、`medium`、`large` |
| `scale` | `0.80` 到 `1.50`，目标可进一步收紧 |
| `fontSize` | 目标定义的最小值到最大值，不接受任意 CSS 表达式 |
| `fontWeight` | `400`、`500`、`600`、`700`、`800` |
| `lineHeight` | `1.1` 到 `1.8` |
| `radius` | `0` 到 `16` |
| `borderWidth` | `0` 到 `3` |
| `padding` | `compact`、`normal`、`comfortable` |
| `gap` | `compact`、`normal`、`comfortable` |
| `shadow` | `none`、`small`、`medium`、`large` |
| `alignment` | `start`、`center`、`end` |
| `density` | `compact`、`normal`、`comfortable` |

对比度必须按“最终有效前景色与最终有效背景色”计算，而不是只检查插件同时提供的两个字段：

- 插件只覆盖前景色时，分别与宿主浅色和深色背景组合验证。
- 插件只覆盖背景色时，分别与宿主浅色和深色文字组合验证。
- 透明背景必须继续向上解析到已知宿主背景；无法确定时拒绝该覆盖。
- `protected` 和 `required` 目标统一要求至少 4.5:1，不允许插件通过声明大字号降低阈值。
- 字体系列不参与放宽对比度规则；字体加载失败后的回退组合也必须满足要求。

### 11.4 禁止的样式能力

不得接受：

- 任意 CSS 选择器。
- `display`、`visibility`、`content`。
- `position`、`inset`、`top`、`left`、`right`、`bottom`。
- `z-index`。
- `pointer-events`。
- `overflow`。
- `transform`，除非由现有动画包系统验证和执行。
- `opacity`，避免隐藏权威内容；如未来开放，受保护目标必须有最低值。
- 任意 `url()`、`image-set()`、`@import` 或网络资源。
- 任意 `var()`；只允许宿主解析后的语义 Token 引用。
- `calc()`、`env()`、浏览器私有函数和 CSS 自定义属性名。

### 11.5 应用方式

宿主将标准化样式映射为内部 CSS 变量：

```js
{
  '--plugin-component-foreground': '#172033',
  '--plugin-component-background': '#ffffff',
  '--plugin-component-font-size': '32px'
}
```

变量只能由宿主生成。插件不得提供变量名称。

颜色和语义 Token 必须复用现有 `src/plugins/package.js` 中 `APPEARANCE_TOKENS`、颜色格式与对比度校验规则。组件样式系统可以在此基础上增加目标级限制，但不得维护一套含义不同的平行 Token 白名单。

组件接入示例：

```vue
<ResultPanel
  v-if="policy.visible"
  :style="policy.styleVars"
  :class="policy.classes"
  :receipt="receipt"
/>
```

### 11.6 样式优先级

固定优先级：

```text
宿主安全强制规则
→ 用户无障碍和高对比度设置
→ 用户选择的组件覆盖包
→ 用户选择的组件样式包
→ 当前全局外观包
→ 宿主默认样式
```

禁止通过安装顺序决定最终效果。

## 12. 字体能力

### 12.1 宿主字体

优先允许稳定别名：

```text
host:ui
host:display
host:numeric
```

首批别名分别映射现有 `--font-ui`、`--font-display` 和 `--font-num`。`host:mono` 与 `host:serif` 只有在宿主新增对应字体 Token、回退字体栈和跨平台测试后才能开放。

`host:*` 是宿主固定别名，不是插件可重绑定的变量；解析顺序必须在插件字体和外观包应用后仍指向宿主发布的字体栈。插件不得通过 appearancePacks、componentStylePacks 或自定义字体覆盖这些别名的含义。

### 12.2 插件内置字体

可选支持；`contributes.fonts` 必须要求 `ui:fonts` 权限：

```json
{
  "contributes": {
    "fonts": [{
      "id": "rounded",
      "source": "assets/rounded.woff2",
      "weight": 600,
      "style": "normal"
    }]
  }
}
```

验证规则：

- 仅允许插件包内 `.woff2`。
- 禁止远程字体和系统绝对路径。
- 单字体建议不超过 2 MB。
- 单插件字体总大小建议不超过 8 MB。
- 字体数量建议不超过 8。
- 安装时校验 MIME、文件头、路径和完整性清单。
- 扩展 `src/plugins/runtime.js` 和相关资产函数的 `mimeFor()`，显式把 `.woff2` 映射为 `font/woff2`，不能退化为 `application/octet-stream`。
- 使用命名空间 `plugin:<pluginId>/<fontId>` 引用。
- 插件禁用或卸载后移除对应 `FontFace`。
- 字体加载失败时回退到宿主字体，不得阻塞页面。
- 插件字体不得应用于承载权威姓名、奖品、名单身份、统计原值、完整性状态或错误信息的文本。原因是字体可以重映射、缺失或隐藏字形，即使宿主提供的字符串没有变化，也可能造成视觉伪造。
- `protected` 目标和包含人员姓名/奖品名称的 `required` 目标，其 `fontFamily` 只能使用 `host:ui`、`host:display`、`host:numeric` 等宿主别名；对这些目标使用 `plugin:` 字体必须在清单验证阶段拒绝。
- 插件字体只允许用于明确标记为非权威的辅助文本、插件原生视图和装饰性区域。目标注册表必须显式声明 `allowPluginFonts: true`，不能默认开放。

## 13. 组件覆盖包

### 13.1 清单示例

```json
{
  "permissions": ["ui:component-overrides"],
  "contributes": {
    "componentOverridePacks": [{
      "id": "focus-mode",
      "title": "专注点名模式",
      "targets": {
        "app.version-badge": {
          "visibility": "hidden",
          "layout": "collapse"
        },
        "roller.filters": {
          "visibility": "hidden",
          "layout": "collapse"
        }
      }
    }]
  }
}
```

### 13.2 可用状态

```ts
type ComponentVisibility = 'visible' | 'hidden' | 'replaced'
type HiddenLayout = 'collapse' | 'reserve' | 'compact'
```

含义：

- `visible`：正常显示，可同时应用样式。
- `hidden + collapse`：不渲染组件并释放布局空间。
- `hidden + reserve`：不渲染内容但保留宿主定义的占位。
- `hidden + compact`：宿主显示一个安全的紧凑入口，用于恢复或展开。
- `replaced`：不渲染原组件，改为渲染指定宿主原生替代视图。

隐藏必须通过 Vue 条件渲染或宿主组件逻辑完成，禁止仅使用 `display:none`，以便正确处理焦点、无障碍树、动画和生命周期。

### 13.3 替换规则

```json
{
  "card.controls": {
    "visibility": "replaced",
    "replacement": "focus-mode:compact-card-controls"
  }
}
```

应用替换前必须验证：

1. 目标策略为 `replaceable`。
2. 替代视图已安装、启用且通过清单验证。
3. 替代视图声明的 `slot` 在目标允许列表中。
4. 替代视图拥有完成动作所需的显式权限。
5. 替代视图在当前平台可用。
6. 替代视图渲染失败时可以立即恢复原组件。

### 13.4 始终不可隐藏的内容

- 权威抽签结果。
- 当前名单身份。
- 抽签提交和保存状态。
- 数据完整性错误。
- 插件权限请求。
- 插件崩溃和禁用通知。
- 破坏性操作确认。
- 设置入口和插件恢复入口。
- 无障碍恢复控件。
- 应用无法继续运行时的诊断信息。

### 13.5 全局不变量

每次应用覆盖包前必须检查：

```text
至少存在一个可用的核心抽签入口
当前名单身份可见
权威结果区域可见
数据错误和权限警告可见
设置和插件管理入口可达
键盘可以完成核心流程
用户可以禁用当前覆盖包
当前页面不会因隐藏组件形成不可滚动或零尺寸布局
```

## 14. 原生视图和插槽

### 14.1 首批插槽

```text
slot:app.command-palette
slot:roller.toolbar
slot:roller.side-panel
slot:roller.below-result
slot:card.footer
slot:lottery.side-panel
slot:records.toolbar
slot:statistics.section
slot:settings.plugin-section
```

插槽 ID 与组件目标 ID 属于不同命名空间：所有插槽统一使用 `slot:` 前缀，组件目标不得使用该前缀。`slot:app.command-palette` 依赖尚未实现的宿主命令面板，Plugin API 1.3 只能将其登记为预留且 `available: false`，不能对插件开放。

首个版本只建议真正实现：

```text
slot:roller.side-panel
slot:roller.below-result
slot:records.toolbar
```

完成测试和稳定性验证后再扩大范围。

### 14.2 清单示例

```json
{
  "permissions": ["ui:native-views", "names:read", "draw:execute"],
  "contributes": {
    "nativeViews": [{
      "id": "roller-assistant",
      "title": "点名助手",
      "slot": "slot:roller.side-panel",
      "source": "ui/roller-assistant.json",
      "uses": ["names:read", "draw:execute"],
      "order": 500
    }]
  }
}
```

### 14.3 原生视图 Schema

```json
{
  "schemaVersion": 1,
  "root": {
    "type": "Stack",
    "props": {
      "gap": "normal"
    },
    "children": [
      {
        "type": "Text",
        "props": {
          "variant": "subtitle",
          "text": "今日点名"
        }
      },
      {
        "type": "Text",
        "bindings": {
          "text": "$resource.statistics.totalCount"
        }
      },
      {
        "type": "Button",
        "props": {
          "label": "抽取一人",
          "icon": "draw"
        },
        "action": {
          "command": "draw-one"
        }
      }
    ]
  }
}
```

#### 14.3.1 插件来源标识

每个通用 `PluginNativeView` 必须由宿主渲染不可移除的来源标识，至少显示“由插件提供”和插件显示名；该标识不能由插件样式包、覆盖包或视图 Schema 隐藏、改写或伪装成宿主权威状态。

- 插件视图不得使用与 `VerifiedResult`、成功提交、完整性通过或宿主错误完全相同的视觉角色。
- 插件可以显示只读名单和统计信息，但不得把任意 `Text`、`Badge` 或 `Notice` 声明为权威抽签结果。
- 屏幕阅读器可访问名称必须包含插件来源；宿主应给插件视图容器附加稳定的来源描述。
- `resultPresentations` 不使用通用插件视图来源条，而由宿主 `VerifiedResult` 负责绑定 Receipt 和权威语义。

### 14.4 首批组件白名单

```text
Stack
Grid
Text
Icon
Badge
Button
Toggle
Select
Range
Progress
Divider
List
Table
Notice
```

`VerifiedResult` 不属于通用原生视图节点，不能由插件放入任意侧栏或工具栏。它只能在 `resultPresentations` 上下文中由宿主创建并注入当前 Receipt。

### 14.5 Schema 限制

- 最大节点数：建议 128。
- 最大嵌套深度：建议 12。
- 最大文本长度：普通文本 500，说明文本 2000。
- 禁止 HTML 字符串和 `innerHTML`。
- 禁止表达式执行和 `eval`。
- 绑定只允许路径读取和宿主格式化器。
- 禁止插件指定 CSS 类名。
- 禁止插件指定事件处理函数源码。
- 所有动作只能引用已经声明的插件命令或宿主事务意图。
- `Icon` 只接受宿主发布的语义别名白名单，例如 `draw`、`info`、`warning`、`settings`；宿主把别名映射到在 `src/` 中以字面量登记的 Fluent 图标，确保 `vite.config.js` 的图标子集构建能够收集。
- 未知图标别名必须在清单验证阶段返回 `PLUGIN_UI_ICON_NOT_ALLOWED`，不能运行时静默显示空图标。

### 14.6 数据绑定

允许来源：

```text
$state.*                     插件视图局部状态
$storage.*                   插件命名空间存储
$resource.names.*            获批的名单只读快照
$resource.statistics.*       获批的统计只读快照
$resource.records.*          获批的记录只读快照
$host.theme.*                主题和无障碍状态
$receipt.*                   仅结果呈现上下文
```

不允许：

- 任意 JavaScript 表达式。
- 访问 `window`、`document`、`globalThis`。
- 动态拼接资源 RPC 名称。
- 从路径之外读取宿主对象。

建议提供少量格式化器：

```text
number
percent
date
time
truncate
localizedText
```

### 14.7 动作模型

优先复用现有命令系统：

```json
{
  "action": {
    "command": "draw-one",
    "args": {
      "count": 1
    }
  }
}
```

宿主调用 `invokePluginCommand(pluginId, commandId, args)`，插件 Worker 在 `onCommand` 中处理。命令本身不获得额外权限；命令内部发起的 RPC 仍通过该命令实例 Principal 校验。

## 15. 权威结果呈现

### 15.1 新增 `VerifiedResult`

必须实现宿主原生组件：

```ts
interface VerifiedResultProps {
  receipt: DrawReceipt
  presentation: NormalizedResultPresentation | null
  target: 'roller'
}
```

Plugin API 1.3 首批只支持 Roller。Card 和 Lottery 的数据语义不同，必须在各自拥有宿主事务与类型化 Receipt 后再扩展 `target`，不能仅扩大字符串联合类型。

插件不得传入：

- `results`。
- `name`。
- `personId`。
- `algorithmVersion`。
- `operationId`。
- 任意结果 HTML。

这些属性只能来自宿主提交后的 `DrawReceipt`。

### 15.2 结果呈现贡献

```json
{
  "permissions": ["ui:result-presentations"],
  "contributes": {
    "resultPresentations": [{
      "id": "spotlight",
      "title": "聚光灯结果",
      "targets": ["roller.result"],
      "layout": "spotlight",
      "style": {
        "size": "large",
        "alignment": "center",
        "showAlgorithm": true,
        "showOperationId": true
      }
    }]
  }
}
```

### 15.3 允许定制

- 单结果、列表、网格等宿主预定义布局。
- 字体、颜色、背景、边框、阴影、间距。
- 是否显示英文名。
- 是否显示算法版本和操作 ID；宿主可强制显示。
- 头像、插件包内装饰图片和宿主图标。
- 现有动画包中的结果动画。

### 15.4 禁止定制

- 结果排序，除非宿主明确允许“仅视觉排序”且保留原序号。
- 修改或隐藏姓名。
- 使用伪元素生成额外姓名。
- 用插件数据替换 Receipt 数据。
- 覆盖保存失败、回滚或完整性错误。

## 16. Web 与 Tauri 的重叠接口

### 16.1 两端共有

- 原生视图。
- 组件样式和覆盖包。
- 权威结果呈现。
- 命令、主题、动画、视觉层。
- 只读资源和抽签事务。
- 插件存储。
- 通知、浏览器可用的文件选择和下载。

### 16.2 Tauri 专属

- 目录选择。
- 文件定位和打开。
- 专用导出事务。
- 打印和本地报告生成。
- 后台任务。
- 托盘和专用窗口集成。
- 本地数据库或索引。
- 经过清单和 Rust 双重验证的固定系统操作。

### 16.3 向后兼容扩展已发布的 Host Descriptor

当前 SDK 已发布 `HostExtensionDescriptor`，并包含 `schemaVersion`、`apiVersion`、`model`、`resources`、`transactions`、`contributions`、`extensionPoints` 和 `guarantees`。Plugin API 1.3 必须保留这些字段及其既有语义，只做可选字段和列表成员的向后兼容扩展：

实现时应直接向已发布的 `HostExtensionDescriptor` 类型增加以下可选字段；不得让 `PluginContext.host` 改用一个会丢失旧字段的新类型。如果为了内部迁移测试定义 `HostExtensionDescriptorV1_3 extends HostExtensionDescriptor`，它只能作为临时别名，最终 SDK 导出的主类型仍必须是原名称。

```ts
interface HostExtensionDescriptorV1_3 extends HostExtensionDescriptor {
  platform?: 'web' | 'tauri'
  security?: {
    runtime: 'plugin-isolated' | 'backend-authoritative'
  }
  componentTargets?: Array<{
    id: string
    platform?: 'all' | 'web' | 'tauri'
    available: boolean
    visibilityPolicy: VisibilityPolicy
    allowedStyles: string[]
    allowPluginFonts?: boolean
  }>
  slots?: Array<{
    id: string
    available: boolean
    platform: 'all' | 'web' | 'tauri'
  }>
}
```

不得用 `securityModel` 替换现有 `model: 'product-freedom-core-hosted'`，也不得删除 `extensionPoints` 或 `guarantees`。`describeHost()` 的 `contributions` 数组必须追加 `fonts`、`nativeViews`、`componentStylePacks`、`componentOverridePacks` 和 `resultPresentations`，`extensionPoints` 同步增加对应描述。

所有插槽 ID 都以 `slot:` 开头，确保 `componentTargets` 与 `slots` 两个命名空间不会发生字符串冲突。旧插件会忽略未知字段，因此无需改变既有能力发现流程。

插件必须通过能力描述发现接口，不应只通过 `platform === 'tauri'` 假设某能力一定存在。

## 17. Tauri 后端能力设计

### 17.1 禁止任意原生插件注入

不要把第三方 Rust 动态库加载到 Tauri 主进程。这样会失去进程级隔离并允许任意本机访问。

推荐两种模式：

1. 宿主实现的专用 Tauri transaction。
2. 将来需要复杂插件后端时，使用独立受限进程或 WASI 沙箱，而不是动态链接库。

### 17.2 专用事务示例

```text
reports.export
files.write-user-selected
files.reveal-user-selected
printing.print-report
background.schedule-plugin-job
window.open-plugin-tool
```

每个事务必须定义：

- 权限 ID。
- 输入 JSON Schema。
- 输出 JSON Schema。
- 平台可用性。
- 最大输入大小。
- 超时时间。
- 是否需要用户即时确认。
- 是否允许后台执行。
- 审计字段。

### 17.3 Rust 端重新验证

Rust command 必须检查：

- 插件 ID 和实例 ID 是否仍有效。
- 权限是否由宿主会话签发。
- 文件路径是否来自用户选择或插件专属目录。
- 参数长度、类型、范围和数量。
- 是否包含路径穿越、Shell 拼接或绝对路径绕过。
- 操作是否需要当前前台用户手势。

## 18. Web 核心隔离计划

### 18.1 目标

将 Web 版核心抽签逻辑与普通 Vue UI、插件运行时进一步分离，防止插件通过宿主 UI 漏洞间接接触核心状态。

### 18.2 建议文件

```text
src/core/protocol.js
src/core/client.js
src/core/web/core.worker.js
src/core/web/coreService.js
src/core/adapters/webPersistence.js
src/core/adapters/tauriPersistence.js
```

### 18.3 消息协议

```ts
type CoreRequest =
  | { type: 'draw.execute'; requestId: string; input: DrawRequest }
  | { type: 'resources.query'; requestId: string; resource: string; query: object }

type CoreResponse =
  | { type: 'success'; requestId: string; value: unknown }
  | { type: 'error'; requestId: string; code: string; message: string }
```

只有宿主 Core Client 持有 Worker 引用。插件不能获得 Worker、MessagePort 或内部请求 ID。

### 18.4 Web 持久化

- 第一阶段可以继续使用现有存储适配器，重点先实现插件隔离。
- 第二阶段可将核心数据迁至 IndexedDB，以获得更好的事务和容量支持。
- 可以增加记录哈希链以检测普通意外修改。
- 不得把本地哈希链描述为能够抵抗控制浏览器的攻击者。

## 19. Tauri 核心事务迁移计划

### 19.1 目标命令

```text
core_resource_query
core_draw_execute
core_records_verify
```

### 19.2 `core_draw_execute` 输入

```ts
interface CoreDrawInput {
  listId: string
  target: 'people' | 'groups'
  count: number
  gender: 'all' | 'male' | 'female'
  allowDuplicates: boolean
}

interface CoreDrawCallerContext {
  source: {
    kind: 'core-ui' | 'plugin'
    pluginId: string
    instanceId: string
    grantToken: string
  }
}
```

插件可提交的参数仍严格限定为 `CoreDrawInput`，与现有 `DRAW_ARGUMENTS` 白名单一致。`source`、`pluginId`、`instanceId` 和 `grantToken` 由宿主 Broker 根据当前 Principal 注入，不属于插件输入，不能由插件覆盖。

Tauri Rust 端必须使用 `grantToken` 在进程内 `State` 中反查有效会话 Principal；前端传入的 `pluginId` 和 `instanceId` 只作审计字段，不能单独作为授权依据。宿主核心 UI 使用内部 Principal，例如 `pluginId: 'core'`。

不得包含：

- 结果数组。
- 权重表。
- 统计更新值。
- 历史记录正文。
- 算法参数覆盖。

### 19.3 输出 Receipt

```ts
interface DrawReceipt {
  operationId: string
  pluginId: string
  listId: string
  target: 'people' | 'groups'
  count: number
  allowDuplicates: boolean
  gender: 'all' | 'male' | 'female'
  algorithm: string
  algorithmVersion: string
  committedAt: number
  sequence?: number
  previousHash?: string
  receiptHash?: string
  results: readonly DrawResultItem[]
}
```

这是对 Plugin API 1.2 已发布 `DrawReceipt` 的向后兼容扩展：`pluginId` 必须继续为必填字符串；`sequence`、`previousHash` 和 `receiptHash` 全部是可选新增字段。首批 Web 与 Tauri 实现可以暂不返回这些可选字段。宿主核心 UI 产生的 Receipt 使用 `pluginId: 'core'`，避免改变已发布字段类型。

API 对外保持可选字段兼容，但 Tauri 正式版内部核心事务必须生成并持久化 `sequence`、`previousHash`、`receiptHash`，不得因为旧插件未读取这些字段而省略完整性记录。Web 可先使用同一字段语义进行审计，但不能把本地哈希链宣传为能抵抗被控制的浏览器或被替换的部署文件。

### 19.4 算法迁移要求

- 建立语言无关的算法契约，至少固定：候选集合排序、过滤条件、重复规则、抽取数量、随机源读取顺序、结果顺序、空集合行为、错误码和 `algorithmVersion`。
- 将固定输入、固定随机源和期望输出保存为共享 JSON 测试向量；Web JS 与 Tauri Rust 都必须直接运行这组向量。
- Web 正式版默认继续使用优化后的 JS Core Worker。不得为了代码复用强制引入 WASM；只有基准测试证明 WASM 不造成可接受的性能回退时，才允许将其作为可选实现。
- Tauri 使用 Rust 实现同一算法契约，并由 Rust 后端持有权威事务；前端不能选择另一套算法或覆盖 `algorithmVersion`。
- 在算法版本不变时，JS 与 Rust 对同一输入和随机流必须产生完全相同的结果、顺序、错误和 Receipt 语义。
- 增加边界用例、随机差分测试和回归向量；任一差异都必须阻塞发布，或显式升级算法版本并记录迁移说明，禁止静默改变行为。
- 以当前 Web JS 实现建立性能基线，抽签核心的正式版 p95 延迟不得因跨端一致性改造而劣化超过 10%；性能测试应覆盖大名单、重复抽取、空结果和并发请求排队。
- 性能门槛必须采用同一机器、同一浏览器版本、同一构建模式下的同轮对照，不能拿不同设备的绝对毫秒数直接比较。阶段 0 保存现有 JS 基线实现或冻结基准结果；每组先预热，再至少执行 1000 次，覆盖约 100、10000、100000 个候选以及单次/批量抽取。
- 分别记录纯算法耗时和 Core Client 到 Worker 返回的端到端耗时；10% p95 门槛适用于端到端路径。Worker 首次创建耗时单独报告，不混入稳态抽签结果，也不能因此被忽略于首屏性能验收。

### 19.5 Tauri 原子持久化与完整性协议

“代码在 Rust 中执行”不自动等于原子提交或不可篡改。Tauri 正式版必须实现以下持久化协议：

1. 使用进程内互斥锁或单线程事务队列串行化核心写入。
2. 读取并验证当前核心状态；完整性失败时立即进入只读恢复状态。
3. 在内存中同时计算新记录、统计、Receipt、序号和摘要，不先修改对外可见 Store。
4. 将算法设置、记录、统计和链头写入同一个版本化 `CoreStateEnvelope`；如果必须拆文件，则使用写前日志保证它们只能整体提交或整体回滚。
5. 把新状态写入同目录临时文件，完成刷新和同步后使用平台支持的原子替换；Windows 必须使用可靠的替换语义，不得采用“先删除旧文件再重命名”的窗口期方案。
6. 原子替换成功后才更新内存状态并返回 Receipt；任何失败都删除或隔离临时文件并保留旧状态。
7. 启动时检测未完成的临时文件或写前日志，按校验结果恢复旧版本或完成提交，禁止把半写入文件当成有效状态。

内部状态建议至少包含：

```ts
interface CoreStateEnvelope {
  schemaVersion: number
  sequence: number
  algorithmVersion: string
  records: readonly CoreRecord[]
  statistics: CoreStatisticsSnapshot
  headReceiptHash: string
  previousStateMac?: string
  stateMac: string
}
```

完整性要求：

- `stateMac` 必须覆盖规范化后的整份核心状态，而不只是 Receipt；否则单独修改统计聚合仍无法被发现。
- `receiptHash`/`stateMac` 必须使用带密钥的消息认证码或等价的认证加密能力，禁止把裸 SHA-256 哈希描述为恶意篡改防护。
- 规范化序列化必须固定字段顺序、字符串编码、数字范围和映射键顺序；Rust 测试必须验证同一状态始终产生相同认证输入字节。
- 不手写密码学实现。优先复用已经审查的认证加密能力；如增加成熟 HMAC crate，必须经过依赖评审并锁定版本。
- 完整性密钥不得写入核心数据文件、日志、Receipt 或前端状态。密钥不可用时必须返回明确的降级级别；正式保护模式下不能静默退化成无密钥哈希。
- 首次迁移旧数据时生成明确的 genesis 状态和 `sequence: 0`；迁移后的第一笔事务从 `sequence: 1` 开始，旧数据不得伪造为已经经过新链认证的历史提交。

## 20. RPC 和实例通信加固

### 20.1 iframe

当前全局 `window.postMessage` 桥接建议迁移到 `MessageChannel`：

1. 宿主创建 iframe。
2. iframe 加载完成后，宿主创建 `MessageChannel`。
3. 宿主把 `port2` 发送给 iframe。
4. 宿主把 `port1` 与 Principal 绑定。
5. 后续请求不再携带可信 `pluginId`。
6. 插件禁用时关闭 MessagePort 并使 Principal 失效。

`src/plugins/store.js` 的 `handlePluginMessage` 必须重构：API 1.2 iframe 暂时保留 `window.message + event.source` 兼容路径；API 1.3 页面通过绑定 Principal 的 `MessagePort` 收发请求和响应。两条路径最终都进入同一个 Principal-aware RPC 实现。

### 20.2 Worker

- Worker 对象天然绑定到插件实例，但仍需把调用交给 Principal-aware `handleRpc`。
- 视觉 Worker、主 Worker 和命令调用必须分别创建或选择对应 Principal。
- 不得继续仅以插件 ID 作为授权依据。
- `grantToken` 必须是宿主生成的高熵、不透明、仅当前进程有效的随机值，并绑定 `pluginId`、`instanceId`、权限集合和平台。
- `grantToken` 不得持久化、写日志、发送给插件脚本或作为事件数据广播；只能由 Broker 在调用 Rust command 前注入。
- 插件禁用、卸载、崩溃、权限撤销或应用重启时，Rust `State` 中对应令牌必须立即失效。
- Rust 校验令牌后仍要重新检查调用参数和权限，不能把令牌视为跳过参数验证的通行证。

### 20.3 限额

建议默认：

| 项目 | 默认限制 |
| --- | --- |
| 单 RPC 输入 | 256 KB |
| 新增 UI 类 RPC 输出 | 2 MB |
| 每实例并发请求 | 16 |
| 每实例每秒请求 | 60 |
| 命令超时 | 15 秒，与现有 `RUNTIME_COMMAND_TIMEOUT_MS` 保持一致 |
| UI 状态更新 | 每秒 30 次 |
| UI 状态总大小 | 256 KB |
| 原生视图节点 | 以第 14.5 节为唯一事实来源 |

现有 `storage.read`、`storage.write` 和资源快照不能直接套用 2 MB UI 输出限制：插件存储已有 96 MB 总配额，API 1.2 的 `records.read` 等接口也可能返回大快照。旧接口保持兼容；新 `resources.query` 应逐步增加过滤、游标和分页，避免继续依赖无限增长的全量输出。

超过限制时返回结构化错误，不应让整个应用崩溃。

## 21. UI 状态存储

分为三类：

1. **插件包静态声明**：样式包、覆盖包、视图 Schema。
2. **用户选择状态**：当前启用的样式包、覆盖包、结果呈现。
3. **插件运行状态**：插件自己的设置和视图局部状态。

建议宿主存储结构：

```ts
interface PluginUiSelections {
  activeGlobalStylePack: string
  activeGlobalOverridePack: string
  activeResultPresentations: Record<string, string>
  activePagePacks: Record<string, {
    stylePack?: string
    overridePack?: string
  }>
}
```

用户选择由宿主保存，插件不能强制启用自己的包。插件安装、更新或启用时只能注册可选项。

## 22. 冲突处理

### 22.1 选择策略

- 同一作用域最多启用一个组件覆盖包。
- 同一作用域最多启用一个组件样式包。
- 结果呈现按目标分别选择一个。
- 原生视图可以多个共存，按 `order` 排序。
- 插件不能通过更大的 `order` 覆盖受保护宿主内容。

### 22.2 作用域

```text
global
route:roller
route:card
route:lottery
route:records
route:statistics
```

页面作用域覆盖全局作用域，但仍受宿主安全规则和无障碍规则约束。

### 22.3 插件更新

如果更新后选中的包或目标消失：

- 自动回退宿主默认值。
- 清除失效选择。
- 显示一次非阻塞通知。
- 不保留指向不存在贡献项的悬空配置。

## 23. 恢复和故障处理

必须提供：

- 插件管理页中的“恢复默认界面”。
- 启动安全模式后不加载任何插件代码、插件页面或插件贡献项。
- 插件异常时撤销该插件的样式、覆盖、视图和字体。
- 替代视图渲染失败时恢复原组件。
- 页面路由切换时清理页面级策略。
- Web 和 Tauri 都能进入不依赖插件的设置页。
- 提供配置文件驱动的安全模式；安全模式不能由插件、URL 参数或普通设置页开启或关闭。

恢复操作本身必须由宿主实现，不能由插件隐藏、替换或拦截。

### 23.1 文件驱动安全模式

安全模式是一个宿主启动前的恢复开关。它的唯一切换方式是修改宿主配置文件并重启应用；运行中的插件、插件页面、命令、UI 覆盖和普通设置页都不能修改该状态。

#### 23.1.1 配置文件位置

| 平台 | 配置文件 | 说明 |
| --- | --- | --- |
| Tauri | `<appConfigDir>/safemode.json` | 用户级配置目录；不要放在安装目录，也不要放入插件命名空间 |
| Web | 部署根目录 `./safemode.json` | 由站点部署者或管理员修改；浏览器用户不能通过插件创建或写入该文件 |

Tauri 首次启动时可以自动创建默认文件：

```json
{
  "enable": false
}
```

Web 部署应提供同样内容的 `public/safemode.json`。如果部署者需要进入安全模式，只需将 `enable` 改为 `true`，保存文件后重新启动 Tauri 应用，或重新加载 Web 应用。

#### 23.1.2 最小配置格式

用户只需要修改 `enable`：

```json
{
  "enable": true
}
```

解析规则：

- 文件不存在：安全模式关闭。
- 文件是合法 JSON 对象且 `enable === false`：安全模式关闭。
- 文件是合法 JSON 对象且 `enable === true`：安全模式开启。
- `enable` 不是布尔值、JSON 不是对象或文件无法解析：安全模式开启，并记录 `SAFE_MODE_CONFIG_INVALID`。
- 可选 `schemaVersion` 只允许正整数；缺失时按版本 `1` 处理。
- 未知字段不得改变安全模式含义，可以忽略并在诊断信息中提示。
- 文件修改在应用运行中不热更新，必须重启或重新加载后生效。

解析器应返回结构化状态，而不是只返回布尔值：

```ts
interface SafeModeStatus {
  enabled: boolean
  source: 'missing' | 'file' | 'invalid' | 'stale' | 'unavailable'
  path?: string
  errorCode?: 'SAFE_MODE_CONFIG_INVALID' | 'SAFE_MODE_CONFIG_UNAVAILABLE'
  loadedAt?: number
}
```

#### 23.1.3 启动顺序

安全模式检查必须发生在任何插件加载之前：

```text
启动宿主
  -> 读取 safemode.json
  -> 标准化 SafeModeStatus
  -> 初始化核心数据和内置 UI
  -> enabled === true ? 跳过插件初始化 : 初始化插件系统
  -> 渲染宿主安全模式提示
```

必须跳过以下动作：

- 插件目录和在线目录下载。
- 插件包解密、解析和 Worker 打包执行。
- 插件 Worker 激活。
- 插件 iframe 页面挂载。
- 插件命令注册。
- 动画包注册和选择恢复。
- 视觉 Canvas/WebGL Worker 创建。
- 外观包、组件样式包和组件覆盖包注册。
- 原生视图、结果呈现和插件字体注册。
- 插件存储读取、迁移和 `plugin:storage-changed` 分发。

“不加载任何插件”的判定应以运行时行为为准：安全模式启动过程中不得执行插件包内 JavaScript，也不得把插件贡献项注册到宿主 UI。

允许读取宿主自己的配置和核心数据，以便点名、记录、统计和设置等内置功能继续工作。若插件管理页需要显示状态，只能显示宿主保存的数量或 ID 索引，不能为显示名称而解码和执行插件包。

#### 23.1.4 Tauri 实现要求

1. 在 `src-tauri/src/lib.rs` 中实现 `read_safe_mode_config`。
2. 在 Tauri `setup` 阶段确定安全模式状态，并将只读状态注入前端。
3. 文件目录不存在时创建配置目录和默认 `enable:false` 文件；创建失败不应阻止应用启动。
4. 文件存在但读取或解析失败时进入安全模式，避免插件崩溃循环继续发生。
5. 前端插件 Store 初始化前读取宿主注入的状态，不允许先初始化插件再检查。
6. 提供只读 `safe_mode_status` 命令用于诊断；`read_safe_mode_config` 负责读取解析，`safe_mode_status` 只返回启动时已确定的状态；不提供任何写入命令。
7. 插件不能使用文件选择、系统操作或通用存储接口写入该路径。
8. “打开配置目录”可以是宿主自己的操作，但不能提供“启用/关闭安全模式”按钮。

建议的 Rust 数据结构：

```rust
struct SafeModeStatus {
    enabled: bool,
    source: String,
    path: Option<String>,
    error_code: Option<String>,
}
```

#### 23.1.5 Web 实现要求

1. 在插件初始化前使用 `import.meta.env.BASE_URL` 构造部署子路径安全的 URL，并通过 `fetch(url, { cache: 'no-store' })` 读取配置，不能硬编码裸 `./safemode.json`。
2. `404` 视为文件不存在，安全模式关闭。
3. 成功取得响应但 JSON 损坏、格式不合法或 `enable` 类型错误时，安全模式开启，标记 `source: 'invalid'`。
4. 纯网络不可达时沿用最近一次成功读取的状态并标记 `source: 'stale'`；如果从未成功读取过，则默认关闭安全模式并记录 `SAFE_MODE_CONFIG_UNAVAILABLE`，避免离线 PWA 首次启动永久禁用插件。
   - 最近一次成功状态只允许写入宿主命名空间的本地缓存键（例如 `cyrene.host.safe-mode.last-known.v1`），插件 iframe、插件 Worker 和插件 RPC 不得读取或写入该键。
   - 缓存值只保存 `enabled`、读取时间和部署来源摘要，不保存插件数据；缓存损坏、版本不匹配或来源摘要不一致时按“无历史状态”处理。
5. 只允许部署文件控制状态，插件 iframe 的 CSP 不得允许其访问或修改配置。
6. 现有 `public/sw.js` 会缓存成功 GET 响应，必须在 fetch 处理器中显式排除 `safemode.json`，不能让通用静态缓存覆盖本节策略。
7. 最近一次有效状态只能在网络不可达时使用；UI 必须显示它来自旧状态，连接恢复后重新加载才能确认新配置。
8. 浏览器端只显示“重新加载 Web 应用”说明，不显示本地文件编辑按钮。

`stale` 状态只是离线可用性的回退，不是新的安全权威来源；浏览器扩展或用户可以修改本地缓存这一点属于 Web 版既有威胁边界。需要 fail-closed 的受管部署必须保证首屏能够读取部署文件，不能依赖 `stale` 状态承担安全认证。

Web 端的“修改配置文件”适用于站点部署者、开发服务器或管理员；普通浏览器用户不能像 Tauri 用户一样直接在本地应用目录新建文件，这是浏览器沙箱的正常限制。对于 GitHub Pages、Vercel 等不可直接编辑产物的静态托管，管理员必须修改仓库中的 `public/safemode.json` 并重新部署；不得增加 URL 参数、LocalStorage 开关或普通设置项作为替代入口。

#### 23.1.6 安全模式 UI

安全模式提示必须由宿主内置组件渲染：

```text
安全模式已启用
插件未加载。核心点名、记录和统计功能仍可使用。
请将 safemode.json 中的 enable 改为 false，然后重启或重新加载应用。
```

提示要求：

- 不依赖任何插件组件、主题、字体、动画或命令。
- 不能被组件覆盖包隐藏。
- 显示平台对应的配置位置或部署说明。
- 配置文件无效时显示“已因配置错误进入安全模式”和错误代码。
- 不提供直接修改开关。
- 不阻止核心点名、记录、统计和数据导出功能。

#### 23.1.7 安全模式下的宿主状态

```ts
interface HostRuntimeState {
  safeMode: SafeModeStatus
  pluginsLoaded: false
  pluginContributionsLoaded: false
  pluginWorkersActive: false
}
```

在安全模式下：

- `enabledPlugins` 应为空。
- `contributedPages`、`contributedCommands`、`contributedVisualSurfaces` 和所有新增 UI 贡献项应为空。
- 插件安装、启用、更新和 UI 选择操作应禁用或显示“安全模式下不可用”。
- 核心路由不能依赖插件页面存在。
- 内置 Peach/Fluent 默认主题和宿主默认动画继续工作。
- 退出安全模式必须通过配置文件和重启完成。

#### 23.1.8 安全模式测试

必须新增 `scripts/safe-mode.test.mjs`，至少覆盖：

1. 文件不存在时安全模式关闭。
2. `{"enable":false}` 时安全模式关闭。
3. `{"enable":true}` 时安全模式开启。
4. `enable` 为字符串、数字或 `null` 时安全模式开启并返回配置错误。
5. 非对象 JSON、空文件和损坏 JSON 时安全模式开启。
6. 配置修改后当前运行实例状态不变化。
7. 重启后新状态生效。
8. 安全模式初始化期间插件 Worker 激活次数为零。
9. 安全模式下页面、命令、视觉层、主题、动画、字体和覆盖项均未注册。
10. 安全模式下核心抽签和记录功能仍然可用。
11. Tauri 配置路径不在安装目录和插件存储目录。
12. Web Service Worker 不长期缓存 `safemode.json`。
13. 插件无法通过任何 RPC 修改安全模式文件或状态。
14. 配置解析错误后，应用可以进入安全模式提示页而不是崩溃循环。
15. Web 网络不可达时沿用最近一次有效状态并标记 `source:'stale'`；没有历史状态时默认关闭且显示不可用诊断，不应因普通离线启动误入安全模式。
16. 使用非根路径部署时，安全模式 URL 正确包含 `import.meta.env.BASE_URL`。

## 24. 无障碍要求

- 文本与背景对比度默认至少 4.5:1。
- 大字号文本可以按 WCAG 规则使用 3:1，但受保护信息建议仍保持 4.5:1。
- 权威结果不能缩小到宿主设定的最低可读字号以下。
- 隐藏组件后必须从 Tab 顺序和无障碍树移除。
- `compact` 模式必须提供可访问名称和展开方式。
- 替代视图必须提供与原功能等价的键盘操作。
- 高对比度、用户字体缩放和减少动画偏好优先于插件样式。
- 插件不得修改错误、警告、成功等语义角色。

## 25. 性能要求

- 样式包在安装或启用时标准化，渲染阶段不重复解析 JSON。
- `resolveComponentPolicy(targetId)` 应为近似 O(1) 查询。
- 使用计算后的扁平映射，而不是每次渲染遍历所有插件。
- UI 状态更新按动画帧或微任务合并。
- 插件字体和视图资源按需加载。
- 插件禁用时释放 FontFace、Worker、MessagePort、ResizeObserver 和动画。
- 组件策略变化不应触发整个 Pinia 树或全部路由重新渲染。
- Web Core Worker 的大快照应支持查询过滤和分页，避免频繁传输完整记录。

## 26. 建议新增宿主模块

```text
src/plugins/ui/
  constants.js
  schema.js
  componentRegistry.js
  stylePolicy.js
  overridePolicy.js
  viewRegistry.js
  resultPresentationRegistry.js
  fontRegistry.js
  principal.js
  rpcLimits.js
  recovery.js

src/utils/
  safeMode.js

src/components/plugins/
  PluginNativeView.vue
  PluginNativeNode.vue
  PluginSlot.vue
  VerifiedResult.vue
  PluginCompactPlaceholder.vue

src/core/
  protocol.js
  client.js
  web/core.worker.js
  web/coreService.js

public/
  safemode.json
```

不要创建单个包含全部职责的巨大 `pluginUi.js`。注册、验证、解析、渲染和恢复需要明确分层，但也不要为每个属性创建单独文件。

## 27. 现有文件修改清单

### `src/plugins/constants.js`

- 升级 API 版本。
- 在 `PLUGIN_PERMISSIONS` 中新增 `ui:native-views`、`ui:component-styles`、`ui:component-overrides`、`ui:result-presentations` 和 `ui:fonts`。
- 新增插槽、组件目标和贡献类型常量。
- 建立宿主语义图标别名到 Fluent 图标字面量的固定映射。
- 保持旧权限字符串不变。

### `src/plugins/package.js`

- 新增字体、原生视图、样式包、覆盖包、结果呈现验证。
- 校验 `uses` 是插件权限子集。
- 校验目标 ID、属性白名单、值范围和对比度。
- 校验替代视图引用。
- 将贡献数据标准化为运行时安全对象。
- 字体路径验证后要求运行时 MIME 映射支持 `font/woff2`。
- 将现有 `APPEARANCE_TOKENS`、颜色格式和对比度函数提取为可复用验证模块，CLI 与组件样式包复用同一语义来源。
- 确保 CLI 与应用解析器使用同一验证逻辑或共享等价测试。

### `src/plugins/runtime.js`

- 引入 Principal-aware RPC。
- iframe 改为 MessageChannel。
- 主 Worker、视觉 Worker、页面和命令分别绑定实例权限。
- 保留已发布 Host Descriptor 字段，在 `contributions` 数组追加 `fonts`、`nativeViews`、`componentStylePacks`、`componentOverridePacks`、`resultPresentations`，并在 `extensionPoints` 增加对应描述。
- 扩展 `mimeFor()`，显式支持 `.woff2 -> font/woff2`。
- 增加 RPC 限额和撤销。
- 保持旧插件兼容路径和现有中文错误 `message`。

### `src/plugins/store.js`

- 注册和撤销新贡献类型。
- 管理用户选择的样式包、覆盖包和结果呈现。
- 提供组件策略计算结果。
- 插件禁用或卸载时清理所有 UI 贡献。
- 在安全模式下完全跳过插件初始化、贡献注册、插件存储读取和在线目录请求。
- 重构 `handlePluginMessage`：API 1.2 保留 `window.message + event.source` 兼容路径，API 1.3 使用绑定 Principal 的 MessagePort。
- 扩展本文件内的 `mimeFor()`，确保插件字体资产生成正确 `font/woff2` Data URL。
- 后续将核心抽签调用切换到 Core Client。

### `src/plugins/catalog.js`

- 保持目录解析职责不变。
- 确保安全模式在调用目录请求前已经短路，安全模式下不得执行发行版解析或网络下载。

### `src/main.js`

- 在 `bootstrap()` 的最前部初始化 `SafeModeStatus`，早于应用挂载和插件 Store 生命周期。
- Web 使用 `import.meta.env.BASE_URL` 构造 `safemode.json` URL。
- Tauri 读取 Rust 启动阶段确定的只读状态。
- 将状态通过宿主依赖注入、只读 Store 或初始化参数传给 `AppLayout`，不得写入插件可访问上下文。

### `src/components/layout/AppLayout.vue`

- 在现有 `pluginsStore.initialize()` 和 `activateEnabled()` 之前检查安全模式。
- 安全模式下完全跳过这两个调用及插件事件桥接注册。
- 把当前全局 `handlePluginMessage` 监听迁移为 API 1.2 兼容路径，新页面使用 MessageChannel。
- 挂载宿主内置安全模式横幅。
- 为 `.version-badge`、TitleBar 和首批页面目标接入组件策略。

### `src/views/PluginManagerView.vue`

- 显示安全模式只读状态和配置文件位置。
- 安全模式下禁用安装、更新、启用和 UI 包选择操作。
- 提供“恢复默认界面”和“打开配置目录”宿主操作，但不提供安全模式开关。
- 显示旧版宽权限模型兼容警告。

### `public/sw.js`

- 在现有通用 GET 缓存逻辑中显式排除 `safemode.json`。
- 保留应用离线能力；安全模式网络失败时由最近一次有效状态处理，不依赖 Service Worker 的普通静态缓存。

### `vite.config.js`

- 验证 Fluent 图标子集扫描能够看到 `src/plugins/ui/constants.js` 中所有语义图标映射字面量。
- 如果现有扫描范围无法覆盖该文件，再最小修改扫描逻辑；不得允许插件在运行时请求任意未打包图标。

### `packages/cyrene-name-roller/bin/cnrp.mjs`

- 将独立维护的 `API_VERSION` 升级为 `1.3.0`。
- 同步新增权限、贡献项和验证规则；CLI 与应用当前是两份实现，必须用共享测试保证一致。

### `src/views/PluginPageView.vue`

- 迁移 iframe 桥接初始化。
- 为插件页面显示实例级权限信息。
- 不把新原生视图塞入现有设置页逻辑，应由独立渲染组件负责。

### 核心页面 Vue 文件

- 逐个接入稳定组件 ID。
- 使用 `v-if` 或宿主策略处理隐藏。
- 使用 `PluginSlot` 渲染原生视图。
- Roller 首先使用 `VerifiedResult` 绑定 Receipt；Card 和 Lottery 等待各自的 Receipt 类型和事务入口完成后再接入。
- 不做无关布局重构。

### SDK

- 增加所有新贡献类型。
- 在 `PluginPermissions` 运行时对象和 `.d.ts` 中同步新增五个权限。
- 增加 `PluginPrincipalDescriptor` 的只读公开信息。
- 以可选字段方式扩展现有 Host Descriptor，不删除或重命名旧字段。
- 增加原生视图 Schema 类型。
- 提供创建和校验辅助函数，但不要让 SDK 在插件端执行宿主安全判断。

### `src-tauri/src/lib.rs`

- 在前端初始化前读取并标准化 `safemode.json`。
- 暴露只读安全模式状态，不暴露运行时修改命令。
- 后期新增核心资源和抽签命令。
- 增加原子事务和测试向量。
- 保留现有存储接口用于非核心设置，逐步限制核心数据写入口。

## 28. 分阶段实施计划

### 阶段 0：基线和契约冻结

目标：在改代码前确定稳定 ID、接口和现有行为。

任务：

1. 记录现有 Plugin API 1.2.0 行为。
2. 为当前插件 SDK、抽签事务、页面沙箱和视觉层运行现有测试。
3. 确认第 10.4.1 节首批 13 个组件目标均对应真实宿主功能；需要新增的仅允许是策略边界包装，不得顺手创造计划外功能。
4. 冻结第 10.4.1 节列出的 13 个首批目标，不一次性开放候选池中的其他目标。
5. 冻结 Plugin API 1.3.0 清单字段和错误码。
6. 建立安全不变量测试文件。
7. 冻结 `safemode.json` 文件位置、解析规则、错误码和 Web/Tauri 启动顺序。
8. 冻结第 14.1 节全部 `slot:` ID；未实现的插槽在 Host Descriptor 中返回 `available:false`，不得静默接受贡献。
9. 为每个首批组件目标冻结平台可用性；例如 Web 不渲染 `app.title-bar`，其 Host Descriptor 必须返回 `available:false`，而不是让插件提交后静默无效。

完成标准：

- 接口草案通过评审。
- 现有测试全部通过。
- 第 10.4.1 节逐项对应实际页面，第 10.4.3 节只作为待建登记，不进入可用目标列表。

### 阶段 1：Principal 与通信加固

目标：在开放 UI 操作前完成实例级授权。

任务：

1. 实现 `PluginPrincipal`。
2. 为主 Worker、视觉 Worker、页面、命令创建不同实例。
3. 将 `handleRpc(pluginId, method, args)` 改为内部 `handleRpc(principal, method, args)`。
4. 保留旧入口作为兼容适配器，但新代码不得直接使用插件 ID 授权。
5. iframe 使用 MessageChannel。
6. 添加实例撤销、请求限额和负载限制。
7. Host Descriptor 返回当前实例允许能力。
8. 既有错误保持中文 `message` 不变，只附加稳定 `code`；新增路径同时提供 `code` 和 `message`。

测试：

- 视觉 Worker 无法使用未在其 `uses` 中声明的 `draw:execute`。
- 页面不能伪造另一个插件 ID。
- 已关闭端口不能继续调用 RPC。
- 禁用插件后所有实例请求返回撤销错误。
- 旧插件仍能运行。

完成标准：

- 所有新贡献点只能使用 Principal-aware RPC。
- 不存在仅凭插件传入字符串授权的新增路径。

### 阶段 2：组件注册表与样式包

目标：实现大小、颜色、字体等受限样式修改。

任务：

1. 实现组件目标注册表。
2. 实现样式值标准化、范围校验和对比度检查。
3. 实现样式包注册、选择、撤销和持久化。
4. 在 Roller 的 3 到 5 个目标接入样式策略。
5. 在插件管理页增加样式包预览和选择。
6. 增加默认回退。

测试：

- 未知目标、未知属性和超范围值被拒绝。
- `url()`、选择器和任意变量名被拒绝。
- 低对比度组合被拒绝或由宿主修正。
- 插件字体应用到 `roller.result`、名单身份、统计原值、完整性状态或错误文本时，被 `PLUGIN_UI_FONT_NOT_ALLOWED_FOR_TARGET` 拒绝。
- 插件禁用后恢复默认样式。
- 窄屏和高 DPI 下布局不溢出。

完成标准：

- 插件可以明显修改 Roller 外观。
- 插件不能移动、隐藏或覆盖功能组件。

### 阶段 3：覆盖包与隐藏能力

目标：允许隐藏、压缩非权威组件。

任务：

1. 实现 Visibility Policy。
2. 实现覆盖包完整预检和原子应用。
3. 接入 `optional` 和 `required` 目标。
4. 实现 `collapse`、`reserve`、`compact`。
5. 增加恢复默认界面入口。
6. 实现 `safemode.json` 解析器和只读 `SafeModeStatus`。
7. 确保安全模式检查早于插件 Store 初始化和在线目录请求。
8. 安全模式下跳过全部插件包、Worker、页面、命令、动画、视觉层、字体和 UI 贡献注册。
9. 增加宿主内置安全模式提示和配置位置说明。
10. 为 Web Service Worker 增加 `safemode.json` 非长期缓存规则。
11. Web 网络不可达时沿用最近一次有效安全模式状态，并明确标记 `stale`。

测试：

- `protected` 和 `required` 目标不能隐藏。
- 隐藏后焦点不会落到不可见元素。
- `compact` 入口可键盘操作。
- 一个非法目标使整个覆盖包拒绝应用。
- 插件崩溃时所有隐藏状态撤销。
- `enable:true` 重启后插件激活次数为零。
- `enable:false` 重启后插件系统恢复正常初始化。
- 损坏配置文件进入安全模式并显示结构化错误，而不是继续加载插件。
- Web 离线启动不会仅因网络不可达而误入安全模式。
- 运行中修改文件不改变当前状态。

完成标准：

- 可以实现专注模式和极简模式。
- 设置、结果、错误和恢复入口始终可达。

### 阶段 4：原生视图和插槽

目标：允许插件嵌入宿主页面而不注入 Vue 或 DOM。

任务：

1. 实现原生视图 Schema 验证。
2. 实现 `PluginNativeView` 和递归节点渲染器。
3. 实现 `PluginSlot`。
4. 首批接入 `slot:roller.side-panel`、`slot:roller.below-result`、`slot:records.toolbar`。
5. 复用插件命令作为动作处理。
6. 实现只读资源绑定和局部状态。
7. 实现宿主语义图标别名白名单并验证构建产物包含所有映射图标。

测试：

- 超过节点和深度限制的视图被拒绝。
- HTML、脚本和表达式无法进入宿主。
- 没有权限的资源绑定不可用。
- 视图卸载后无事件和状态残留。
- 多个视图按稳定顺序渲染。
- 未知图标别名在安装阶段被拒绝，不出现运行时空白图标。
- 通用插件视图始终显示宿主生成的插件来源标识，插件无法通过 Schema、样式或覆盖包隐藏。
- 插件视图尝试冒充权威结果、完整性通过或宿主错误视觉角色时被拒绝。

完成标准：

- 插件可以构建宿主风格的辅助面板。
- 视图不能访问宿主对象或绕过命令权限。

### 阶段 5：替换和 VerifiedResult

目标：允许安全替换次要工作流组件，并提供不可伪造的结果呈现。

任务：

1. 先把 Roller 宿主 UI 与插件抽签统一到同一个 JS 抽签提交入口，使统计和记录通过 `commitCoreDrawTransaction` 提交并生成向后兼容的 Receipt。
2. 实现仅服务 Roller 当前权威结果的 `VerifiedResult`。
3. 将 Roller 宿主与插件抽签结果改为同一 Receipt 驱动的显示路径。
4. 增加结果呈现注册表。
5. 实现 `replaceable` 目标和替代视图验证。
6. 替代视图失败时立即恢复原组件。
7. Card 和 Lottery 只有在分别定义兼容的数据事务与 Receipt 类型后才能接入，不能直接复用人员 `DrawReceipt` 假装完成。

测试：

- 插件无法传入姓名或结果数组。
- Receipt 与记录中的 `operationId` 一致。
- 保存失败时不显示已提交成功的权威状态。
- 替代视图禁用后原组件恢复。
- 结果区域始终可见且可访问。
- Roller 宿主抽签与插件抽签都产生结构兼容的 Receipt。
- API 1.2 插件继续收到原有必填字段和既有事件名称；可选审计字段缺失时行为不变。

完成标准：

- 插件可以做出明显不同的结果布局。
- 权威结果内容仍完全由宿主控制。

### 阶段 6：Web Core Worker

**发布属性：Plugin API 1.3 正式版阻塞门槛 A。未完成本阶段不得发布 Web 正式版插件接口。**

目标：让 Web 核心算法和插件/UI 运行时进一步隔离。

任务：

1. 提取抽签服务接口。
2. 将现有优化后的 JS CAF、事务队列和 Receipt 生成移入 Core Worker；不得默认改成 WASM。
3. 将宿主 UI 改为通过 Core Client 调用。
4. 插件事务通过 Broker 转发，不获得 Worker 端口。
5. 按第 19.4 节算法契约补齐共享向量和跨端对照测试。
6. 保持现有记录和统计行为一致，并建立 Web 性能基线。

测试：

- Core Worker 拒绝未知字段。
- 并发插件抽签仍严格串行。
- 事务失败后统计和记录都回滚。
- 插件无法直接向 Core Worker 发消息。
- 与现有 JS 结果和统计行为回归一致。

完成标准：

- Web 插件不能接触核心状态容器。
- 所有抽签入口统一走 Core Client。
- Web 正式版构建不存在绕过 Core Client 直接提交统计或记录的宿主抽签路径。
- 阶段 6 的安全、回滚、兼容和离线测试全部通过后，才允许解除 Web 的开发预览标记。

### 阶段 7：Tauri Rust 核心事务

**发布属性：Plugin API 1.3 正式版阻塞门槛 B。未完成本阶段不得发布 Tauri 正式版插件接口。**

目标：让桌面端后端成为权威状态所有者。

任务：

1. 建立并冻结共享算法契约和测试向量。
2. 在 Rust 中按算法契约实现 CAF；不得复制 Web 的 UI 或状态逻辑。
3. 实现 `core_draw_execute`。
4. 在 Rust 中原子提交统计和记录。
5. 前端 Tauri 路径改为调用 Rust，Web 保持 Core Worker。
6. 增加记录哈希或序号审计字段。
7. 限制通用 `storage_set` 对核心数据的使用。
8. 使用同一组随机流和输入执行 JS/Rust 差分测试；差异时阻止 Tauri 正式版标记。
9. 按第 19.5 节实现版本化 `CoreStateEnvelope`、带密钥完整性、同目录临时文件和崩溃恢复协议。
10. 实现 `grantToken` 的生成、Rust `State` 绑定、撤销和重启失效，不向插件或日志暴露令牌。
11. 明确完整性密钥提供者：优先操作系统安全存储；不可用时进入显式降级或只读策略，并完成对应诊断和恢复测试。

测试：

- JS/Rust 算法测试向量一致。
- Rust 参数验证不依赖前端。
- 中途持久化失败后完整回滚。
- 插件不能调用未授权原生命令。
- Web/Tauri Receipt 字段语义一致。
- Web 与 Tauri 对同一算法版本和随机流产生相同结果顺序，不因实现语言不同而改变用户体验。
- Web Core Worker 性能相对改造前基线无超过 10% 的 p95 回退；未达标时不得以 WASM 作为默认替代方案。
- 修改核心状态正文、统计、算法版本、序号、链头或认证值均能在启动时被检测。
- 在临时文件写入、刷新、同步和原子替换前后注入失败，重启后只能看到完整旧状态或完整新状态，不能出现部分提交。
- 权限撤销或插件禁用后，旧 `grantToken` 调用立即失败且不会泄露令牌值。

完成标准：

- Tauri 抽签、统计和记录不再由前端直接写入。
- 插件只能提交过滤条件和操作意图。
- Tauri 正式版构建不存在通过通用 `storage_set` 或前端 Store 绕过 Rust 核心事务写入统计、记录和算法设置的路径。
- 阶段 7 的算法一致性、整状态完整性、崩溃恢复、原子提交、令牌撤销、权限和兼容测试全部通过后，才允许解除 Tauri 的开发预览标记。

### 阶段 8：SDK、模板、文档和发布

任务：

1. 确认阶段 6 和阶段 7 均达到完成标准；任一平台未通过时不得创建正式版标签、目录条目或稳定 SDK 包。
2. 更新 SDK JS 和 `.d.ts`。
3. 更新 CLI 清单验证。
4. 增加样式包、覆盖包、原生视图示例插件。
5. 更新插件开发文档。
6. 更新安装权限说明和兼容警告。
7. 增加 API 1.2 到 1.3 迁移指南。
8. 固定至少一个真实的 API 1.2 插件包作为兼容性样本；不得为了测试而重新构建成 1.3 包。
9. 完成 Web/Tauri 安装、启动、启用、禁用、更新、卸载、崩溃恢复和安全模式测试。
10. 对正式版构建执行核心写入路径审计：除 Core Worker、Tauri Rust 权威事务和明确的迁移工具外，禁止任何前端 Store、通用存储命令或插件 RPC 写入算法设置、统计和记录。

## 29. 测试文件建议

```text
scripts/plugin-principal.test.mjs
scripts/plugin-message-channel.test.mjs
scripts/plugin-component-style.test.mjs
scripts/plugin-component-override.test.mjs
scripts/plugin-native-view-schema.test.mjs
scripts/plugin-native-view-runtime.test.mjs
scripts/plugin-icon-alias.test.mjs
scripts/plugin-font-registry.test.mjs
scripts/plugin-host-descriptor.test.mjs
scripts/plugin-result-presentation.test.mjs
scripts/plugin-ui-recovery.test.mjs
scripts/plugin-ui-conflict.test.mjs
scripts/plugin-event-bus.test.mjs
scripts/plugin-catalog-safe-mode.test.mjs
scripts/safe-mode.test.mjs
scripts/plugin-web-core-worker.test.mjs
scripts/plugin-tauri-core-contract.test.mjs
scripts/plugin-core-integrity.test.mjs
scripts/plugin-core-entrypoint-audit.test.mjs
scripts/plugin-legacy-compat.test.mjs
scripts/core-algorithm-conformance.test.mjs
scripts/core-algorithm-benchmark.test.mjs
scripts/plugin-authoritative-font.test.mjs
scripts/plugin-native-view-provenance.test.mjs
scripts/plugin-tauri-core-recovery.test.mjs
```

## 30. 必测安全场景

1. 插件尝试隐藏 `roller.result`。
2. 插件尝试隐藏设置入口。
3. 插件尝试把结果字号设置为 0。
4. 插件尝试设置透明结果文字。
5. 插件颜色组合对比度不足。
6. 插件提交 `background: url(https://...)`。
7. 插件提交未知 CSS 属性。
8. 插件页面伪造另一插件 ID。
9. 视觉 Worker 使用主 Worker 的权限。
10. 禁用插件后旧 MessagePort 继续请求。
11. 替代视图崩溃。
12. 多插件争夺同一覆盖目标。
13. 覆盖包只部分合法。
14. 权威结果呈现尝试提供自定义姓名。
15. 插件抽签请求包含 `results`、`weights` 或 `history`。
16. Web Core Worker 收到未知请求字段。
17. Tauri Rust command 收到伪造路径或 Shell 参数。
18. 插件伪造 `pluginId`、`instanceId`、`grantToken` 或把结果、权重、统计增量、历史正文塞入抽签请求。
19. 通过前端 Store、通用 `storage_set` 或旧版 RPC 适配器绕过 Core Worker/Rust 权威事务。
20. Core Worker/Rust 事务在统计或记录持久化失败后留下部分提交。
21. API 1.2 插件在未重新打包的情况下安装失败、启动失败、旧事件丢失或旧 `DrawReceipt` 必填字段缺失。
22. 应用重启后所选插件已被卸载。
23. `safemode.json` 的 `enable:true` 重启后仍有任何插件 Worker、页面或贡献项被加载。
24. `safemode.json` 缺失、损坏、字段类型错误、Web 离线 stale 和首次离线无历史状态时的差异化行为。
25. 高对比度模式下插件颜色覆盖宿主强制规则。
26. 插件字体通过字形重映射、空字形或异常字体度量影响权威结果文本。
27. 通用插件视图使用结果、成功、完整性或错误语义冒充宿主权威组件。
28. Tauri 核心状态中只修改统计、记录、算法版本、序号、链头或认证值。
29. Tauri 在临时文件写入、刷新、同步和原子替换各阶段崩溃或返回错误。
30. 插件禁用、卸载、崩溃或权限撤销后重放旧 `grantToken`。
31. Web Host Descriptor 把 Tauri 专属 `app.title-bar` 标记为不可用，并拒绝插件对不可用目标的样式或覆盖声明。

## 31. UI 和响应式测试矩阵

至少验证：

| 平台 | 视口/状态 |
| --- | --- |
| Web Chromium | 360x800、768x1024、1440x900 |
| Tauri Windows | 100%、125%、150%、200% DPI |
| 主题 | 浅色、深色、高对比度 |
| 动画 | 开启、关闭、减少动画偏好 |
| 字体 | 默认、放大、插件字体加载失败 |
| 插件状态 | 启用、禁用、崩溃、更新、卸载、安全模式 |
| 页面状态 | 空名单、大名单、无记录、大量记录 |

检查：

- 文本不溢出按钮和面板。
- 隐藏后布局没有空洞或重叠。
- 插槽内容不会推走权威结果。
- 键盘焦点顺序正确。
- 屏幕阅读器不会读取隐藏内容。
- 插件字体失败后布局稳定。

## 32. 错误码建议

```text
PLUGIN_INSTANCE_REVOKED
PLUGIN_PERMISSION_DENIED
PLUGIN_RPC_RATE_LIMITED
PLUGIN_RPC_PAYLOAD_TOO_LARGE
PLUGIN_UI_UNKNOWN_TARGET
PLUGIN_UI_PROPERTY_NOT_ALLOWED
PLUGIN_UI_VALUE_OUT_OF_RANGE
PLUGIN_UI_CONTRAST_TOO_LOW
PLUGIN_UI_PROTECTED_TARGET
PLUGIN_UI_REQUIRED_TARGET
PLUGIN_UI_REPLACEMENT_UNAVAILABLE
PLUGIN_UI_INVARIANT_FAILED
PLUGIN_UI_SCHEMA_INVALID
PLUGIN_UI_ICON_NOT_ALLOWED
PLUGIN_UI_FONT_NOT_ALLOWED_FOR_TARGET
PLUGIN_UI_RESOURCE_BINDING_DENIED
PLUGIN_UI_RENDER_FAILED
SAFE_MODE_CONFIG_INVALID
SAFE_MODE_CONFIG_UNAVAILABLE
CORE_TRANSACTION_REJECTED
CORE_TRANSACTION_ROLLED_BACK
CORE_INTEGRITY_CHECK_FAILED
CORE_INTEGRITY_KEY_UNAVAILABLE
UNSUPPORTED_PLATFORM
```

错误返回应包含稳定 `code`、可显示 `message` 和必要的 `details`。迁移期间，现有 API 1.2 错误必须保持中文 `message` 不变，只附加 `code`，以保证现有插件和测试继续工作；新增路径必须同时提供 `code` 与 `message`。新测试应优先断言 `code`，旧测试可以继续断言既有文案，之后分阶段迁移。

## 33. 发布和迁移

### 33.1 灰度开关

内部开发预览阶段建议增加宿主实验开关：

```text
pluginNativeViews
pluginComponentStyles
pluginComponentOverrides
pluginVerifiedResults
```

默认只对开发模式或本地插件开放。阶段 6、7 未全部完成前：

- 版本必须标记为 `alpha`、`preview` 或等价的非稳定状态。
- 不得发布 Plugin API 1.3 稳定 SDK。
- 不得把依赖新接口的插件加入正式目录。
- 不得宣称核心算法和统计数据已经具备正式版保护边界。

只有 Web Core Worker 与 Tauri Rust 核心事务两个发布门槛都通过后，才允许对目录插件开放并发布正式版。

### 33.2 插件安装提示

安装时明确展示：

- 插件可修改哪些页面样式。
- 插件可隐藏哪些组件。
- 插件是否包含替代视图。
- 插件在 Tauri 下申请哪些本地能力。
- 插件不能修改权威结果和核心数据。

### 33.3 回滚

如果新 UI 系统出现问题：

- 通过宿主功能开关停用全部新增贡献项。
- 保留旧页面、动画、外观和视觉层能力。
- 清除活动覆盖选择但不删除插件自己的数据。
- 不需要降级插件包格式。

## 34. 风险与缓解

| 风险 | 缓解措施 |
| --- | --- |
| 稳定组件 ID 太多导致维护负担 | 首批只开放高价值目标；ID 一旦发布不得随意改名 |
| 多插件规则冲突 | 单作用域单覆盖包；切换前提供宿主预览和确认，宿主确定优先级 |
| 插件隐藏后用户无法恢复 | 设置和恢复入口 protected；仅配置文件可切换的安全模式 |
| 安全模式配置损坏或 Web 配置不可用 | 有效响应损坏时禁用插件；纯网络失败沿用最近有效状态并标记 stale |
| 原生视图 Schema 逐渐变成第二套 Vue | 首批组件白名单固定；新增节点类型必须经过 Plugin API 评审、Schema 版本评估和安全测试 |
| 插件字体伪造权威文本 | protected/权威文本禁止 `plugin:` 字体；仅允许固定 `host:*` 别名，并测试异常字形、空字形和字体度量 |
| 样式值导致无障碍退化 | 对比度、最小字号和宿主无障碍优先级 |
| Tauri 能力扩大攻击面 | 专用事务、Rust 重验、用户选择路径、禁止任意原生库 |
| Tauri 写入过程崩溃留下半状态 | 单一 `CoreStateEnvelope` 或写前日志、同目录临时文件、刷新同步、原子替换和启动恢复测试 |
| Web 被误宣传为绝对防篡改 | 文档明确只防插件；更强保证需要远程签名 |
| 核心迁移导致算法差异 | 共享测试向量和算法版本升级规则 |
| 大量视图导致性能下降 | 节点、事件、负载、频率和字体限额 |

## 35. 验收标准

功能验收：

- 至少一个示例插件能修改 Roller 结果和按钮的大小、颜色、字号/字重与宿主字体别名；不得使用插件字体伪造权威姓名。
- 至少一个示例插件能隐藏现有 `app.version-badge` 与 Roller 点名范围筛选器，且宿主仍使用当前或默认点名范围完成抽签。
- 至少一个示例插件能在 `slot:roller.side-panel` 显示只读统计并触发宿主抽签。
- 同一插件在 Web 和 Tauri 中使用相同 UI 贡献，在 Tauri 中额外使用一个专用本地事务。

安全验收：

- 插件不能隐藏权威结果、当前名单、错误和恢复入口。
- 插件不能向权威结果组件提供姓名或结果数组。
- 插件不能通过 CSS、字体或图片加载网络资源。
- 插件字体不能应用于权威结果、名单身份、统计原值、完整性状态或错误文本。
- 插件贡献实例不能使用未声明权限。
- 插件禁用或崩溃后所有 UI 修改完全撤销。
- `safemode.json` 为 `enable:true` 时，重启后不加载任何插件代码或贡献项，核心功能仍可使用。
- 安全模式只能通过修改配置文件并重启或重新加载切换。
- Web 插件不能直接访问核心 Worker。
- Tauri 插件不能绕过 Rust 参数验证。
- Web 的所有宿主和插件抽签入口均通过 Core Client，由 Core Worker 串行执行算法并原子提交统计与记录。
- Tauri 的算法、统计和记录由 Rust 权威事务执行，前端 Store 和通用存储命令不能绕过该事务。

兼容验收：

- 现有 API 1.2 插件测试继续通过。
- 冻结的 API 1.2 插件样本无需修改清单、重新打包或声明 `uses`，即可在 Web 和 Tauri 安装并运行。
- API 1.2 插件仍可通过 `handleRpc(pluginId, method, args)` 进入兼容适配器，但适配器最终必须落到同一个 Principal-aware 授权内核。
- 现有 `DrawReceipt` 字段、中文错误文案和 `draw:result` / `draw:item-result` 监听行为保持兼容。
- 现有 sound-effects 和 basic 模板仍可验证和打包。
- 没有新依赖时不修改锁文件。
- Web 和 Tauri 构建均成功。

核心保护验收：

- 对 Web 正式构建执行静态入口审计和运行时拦截；任何绕过 Core Client/Core Worker 的抽签、统计或记录写入都使构建验收失败。
- 对 Tauri 正式构建执行命令面审计和运行时拦截；任何绕过 Rust 权威事务的前端 Store、通用存储命令或插件调用都使构建验收失败。
- 用固定随机源、固定输入和共享 JSON 向量验证 JS/Rust 算法结果、算法版本和 Receipt 语义一致；差异必须显式升级算法版本，禁止静默兼容。
- 模拟统计写入成功但记录写入失败、记录写入成功但统计写入失败、进程重启和并发抽签，均不得留下部分提交或重复统计。
- 使用代表性大名单和并发请求对 Web Core Worker 做性能回归；若 p95 超过现有 JS 基线 10%，跨端一致性改造不通过。
- Tauri 启动时篡改记录正文、序号、前一摘要或摘要值必须被检测并进入只读恢复状态；恢复前不得接受新的抽签提交。
- Tauri 核心状态采用带密钥的整状态认证与崩溃安全原子替换；故障注入后只能恢复完整旧状态或完整新状态。

## 36. Definition of Done

只有同时满足以下条件，功能才算完成：

- 清单和 SDK 类型已经发布。
- 应用解析器和 CLI 验证结果一致。
- Principal-aware RPC 已覆盖所有新增贡献实例。
- 组件目标注册表有文档和测试。
- 样式包、覆盖包、原生视图和结果呈现均可安装、启用、切换、禁用和卸载。
- protected/required/replaceable/optional 策略全部有自动化测试。
- Web/Tauri 差异通过 Host Descriptor 暴露。
- 关键页面完成桌面、窄屏、高 DPI、深浅色和无障碍检查。
- 配置文件驱动的安全模式和恢复默认界面可用，并且安全模式下不会加载插件代码。
- 阶段 6 Web Core Worker 已达到发布完成标准。
- 阶段 7 Tauri Rust 核心事务已达到发布完成标准。
- Tauri 核心状态完整性、原子替换、崩溃恢复和令牌撤销测试全部通过。
- 插件开发文档、模板和迁移指南完成。
- 所有相关测试通过，没有依赖手工清理的残留状态。

## 37. 内部开发预览与正式版发布门槛

### 37.1 内部开发预览里程碑

为了控制单次实施范围，可以先形成以下仅供开发验证的预览闭环：

1. Principal-aware RPC 和 MessageChannel。
2. `ui:component-styles`。
3. `ui:component-overrides`。
4. 第 10.4.1 节明确列出的 13 个稳定组件目标。
5. `slot:roller.side-panel` 原生视图插槽，并冻结全部预留 `slot:` ID。
6. Roller 宿主与插件抽签共用 Receipt 后接入 `VerifiedResult`。
7. 仅由 `safemode.json` 控制的恢复默认界面和安全模式。
8. 一个“大屏课堂”示例插件。
9. 一个“专注点名模式”示例插件。
10. 完整解析、运行时、安全和 UI 测试。

该里程碑不包含完整 Web Core Worker 和 Tauri Rust 权威事务，因此只能用于本地开发、架构验证和安全测试，不能作为正式版发布，也不能发布稳定 SDK 或正式插件目录条目。

### 37.2 Plugin API 1.3 正式版强制门槛

正式版必须在 37.1 的基础上继续完成：

11. 阶段 6：Web 所有抽签入口统一走 Core Client，算法、统计和记录提交位于 Core Worker。
12. 阶段 7：Tauri 所有抽签入口统一走 Rust 权威事务，前端无法直接写核心统计和记录。
13. JS 与 Rust 使用共享算法测试向量，算法版本和结果语义一致。
14. Web/Tauri 原子提交、失败回滚、权限绕过和兼容测试全部通过。
15. API 1.2 插件、Receipt、事件和错误文案兼容测试全部通过。
16. 阶段 8 的 SDK、CLI、模板、迁移文档和完整发布检查完成。

任一门槛未满足时，版本只能保持开发预览状态，不得使用稳定版标识。

## 38. 实施检查清单

### 接口

- [ ] 冻结 API 1.3 清单字段。
- [ ] 定义稳定组件目标 ID。
- [ ] 定义带 `slot:` 前缀的插槽 ID，并标记未实现插槽为 unavailable。
- [ ] 定义错误码。
- [ ] 更新 SDK JS 和类型声明。

### 安全

- [ ] 实现扩展实例 Principal。
- [ ] iframe 使用 MessageChannel。
- [ ] Worker RPC 使用实例权限。
- [ ] 增加请求大小、并发和频率限制。
- [ ] 实现 `safemode.json` 解析、只读状态和启动前检查。
- [ ] 安全模式下跳过所有插件加载与贡献注册。
- [ ] 增加不受插件控制的安全模式提示和恢复入口。

### 样式与覆盖

- [ ] 实现样式包验证。
- [ ] 实现颜色对比度验证。
- [ ] 实现字体注册和清理。
- [ ] 实现隐藏策略。
- [ ] 实现替代视图回退。
- [ ] 实现冲突和选择规则。

### 原生视图

- [ ] 实现 Schema 验证。
- [ ] 实现节点渲染器。
- [ ] 实现语义图标别名白名单和构建产物校验。
- [ ] 实现资源绑定。
- [ ] 复用命令动作。
- [ ] 实现首批三个 `slot:` 插槽。

### 核心

- [ ] 实现 `VerifiedResult`。
- [ ] 让 Roller 宿主和插件抽签共用统一 JS 事务与 Receipt。
- [ ] 【正式版阻塞】Web 所有宿主与插件抽签统一走 Core Client 和 Core Worker。
- [ ] 建立 JS/Rust 算法测试向量。
- [ ] 冻结语言无关的算法契约：输入、过滤、随机源、结果顺序、错误和 Receipt 语义。
- [ ] 完成 Web JS 与 Tauri Rust 的差分测试和性能基线测试。
- [ ] 【正式版阻塞】Tauri 算法、统计和记录提交迁入 Rust 权威事务。
- [ ] 【正式版阻塞】删除或封锁所有绕过 Core Worker/Rust 事务的核心写入路径。
- [ ] 【正式版阻塞】冻结并运行未经重打包的 API 1.2 插件兼容样本集。
- [ ] 【正式版阻塞】完成核心写入路径静态审计与运行时拒绝测试。

### 测试与发布

- [ ] 完成安全场景测试。
- [ ] 完成响应式和无障碍测试。
- [ ] 完成 Web/Tauri 测试。
- [ ] 更新模板和开发文档。
- [ ] 提供 API 1.2 到 1.3 迁移指南。
- [ ] 验证插件禁用、卸载和崩溃后的完整恢复。
- [ ] 阶段 6、7 的所有发布门槛测试通过。
- [ ] 未完成阶段 6、7 时阻止稳定 SDK、正式目录和正式版本发布。
