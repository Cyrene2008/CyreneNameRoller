# Cyreneの随机点名器

基于 Vue 3 + Electron 的随机点名桌面应用，采用 Windows 11 Fluent Design 设计语言。

## 功能

**随机点名**
- 单人/多人模式，禁止重复（不放回抽取）
- 平衡算法：被抽中次数越少，下次概率越高
- 彩虹名称动画、English Mode

**翻牌点名**
- 3D 翻转卡牌动画
- 一键多抽（自动洗牌+翻牌）
- 收牌历史持久化、名单实时切换

**数据管理**
- 数据统计：抽取次数、概率、平衡概率
- 抽取记录：姓名、名单、来源、时间
- 名单管理：CRUD、批量删除（10秒撤销）、导入导出
- SHA-256 密码保护

**个性化**
- UI 缩放（75%-200%）、名字字体大小调整
- 深色/浅色模式、中/英文切换

## 快速开始

```bash
git clone https://github.com/Cyrene2008/CyreneNameRoller.git
cd CyreneNameRoller
npm install
npm run dev
```

## 构建 Electron 客户端

```bash
npm run electron:build
```

打包产物在 `release/` 目录下。

## 技术栈

Vue 3 + Vite + Electron + Pinia + Vue Router + @iconify/vue (Fluent UI Icons)

## 许可证

[GPL-3.0](LICENSE)
