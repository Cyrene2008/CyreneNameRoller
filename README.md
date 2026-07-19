# Cyreneの随机点名器

基于 Vue 3 + Electron/Tauri 的随机点名桌面应用，采用 Windows 11 Fluent Design 设计语言。

在线使用→ [立即使用](https://xn--web-t33et1i480d.xn--8hvv1o.cn/)

## 开发计划

- [x] 核心功能转移到Vue
- [x] 重构FluentDesignUI
- [x] 抽取记录
- [x] 更新功能
- [x] 公平平衡算法优化
- [x] 小组管理功能
- [x] 桌面端后台常驻
- [ ] 抽奖模式
- [ ] 插件系统
- [ ] 积分系统
- [ ] 多平台支持
  - [x] Windows10+
  - [x] Web
  - [ ] Android
  - [ ] Linux
- [ ] 罗盘(LeafS825开发中)
- [ ] 更多功能正在路上♪

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

## 页面展示

<img width="1655" height="1021" alt="ScreenShot_2026-07-10_101123_833" src="https://github.com/user-attachments/assets/f7fcb810-3cd0-4d8c-9a6b-69a1a7f7de4d" />
<img width="1655" height="1021" alt="ScreenShot_2026-07-10_100935_090" src="https://github.com/user-attachments/assets/57dc6aa5-8ea6-4a04-9ed1-29cfcc513c50" />
<img width="1655" height="1021" alt="ScreenShot_2026-07-10_100952_359" src="https://github.com/user-attachments/assets/d0bb484f-f474-42b5-b221-eccd35eca42c" />
<img width="1655" height="1021" alt="ScreenShot_2026-07-10_100959_607" src="https://github.com/user-attachments/assets/39c997a5-a801-4a24-bc3b-e9c3b87cab33" />
<img width="1655" height="1021" alt="ScreenShot_2026-07-10_101005_678" src="https://github.com/user-attachments/assets/ea989841-1436-4170-9a3c-4e93fa23224b" />
<img width="1655" height="1021" alt="ScreenShot_2026-07-10_101012_407" src="https://github.com/user-attachments/assets/d012c58f-53a8-47c6-8411-6f31125f5fb0" />
<img width="1655" height="1021" alt="ScreenShot_2026-07-10_101018_167" src="https://github.com/user-attachments/assets/75edb038-89de-42bd-8913-0a65519eaa0b" />
<img width="1655" height="2380" alt="wechat_longscreenshot_2026-07-10_101035_521" src="https://github.com/user-attachments/assets/cbc33cb6-7e86-4c77-9c24-643aa2cc1302" />
<img width="2011" height="958" alt="ScreenShot_2026-07-10_101211_600" src="https://github.com/user-attachments/assets/dc43abf1-ac54-40b6-9833-859386070530" />

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

Vue 3 + Vite + Electron/Tauri + Pinia + Vue Router + @iconify/vue (Fluent UI Icons)

## 许可证

[GPL-3.0](LICENSE)
