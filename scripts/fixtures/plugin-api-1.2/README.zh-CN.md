# API 1.2 冻结样本

这里的 `.cnrp` 文件由当前 `1.2.0` CLI 在 2026 年 8 月 8 日生成，仅用于向下兼容回归。进入 API 1.3 阶段后不得重新打包、修改清单或补充 `uses`，否则会失去旧插件兼容性证据。

| 文件 | 插件 ID | SHA-256 |
| --- | --- | --- |
| `basic-1.0.0.cnrp` | `cn.example.cyrene.plugin` | `927376ccaa59ba4ca46c26597f13582ff8a96db52e6b9f9051b963e6df8be778` |
| `sound-effects-1.1.1.cnrp` | `cn.cyrene2008.sound-effects` | `8e48702b19442606beb1fba3795a943292642c3e6beee32b4bad41d52b742d2a` |

样本不包含发布者签名，属于本地测试样本；正式目录兼容测试仍需使用仓库冻结的已签名样本。
