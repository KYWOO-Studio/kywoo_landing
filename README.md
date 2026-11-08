# KYWOO · Make Space Live

静态落地页，无构建步骤。定位：Evidence-based Placemaking（循证的场所营造），连接数据、空间重塑与创新运营。

## 页面结构

- 定位：让冷清的空间，重新有人气。页脚口号：MAKE SPACE LIVE · 老空间，新人气。（2026-11-08，见 docs/landing-copy-2026-11-08.md）
- 方法：透视3D三角网络。鼠标移动带动镜头，接近节点时该点迎面放大，其余两点退向景深；背景影像与短句同步切换。点击固定，Escape或返回总览清除选择。
- 研究案例：朱家角研究入口与杭州武林银泰城市关系示例，均不作为已实施的完整委托实绩。
- 合作：诊断、试点、复盘。
- 联络与FAQ：保留联系按钮；正式公开联系方式尚待确认，无表单或提交后端。

手机用点选；原生按钮支持键盘；暂停和系统减少动态关闭持续动画。WebGL不可用时保留静态三角、图片、说明与操作。案例内以同一个导览串联城市、空间与决策：城市画面使用真实地理资料，后两章为通用楼层与方法示范，不对应武林银泰实际建筑。桌面随滚动切换；手机和减少动态模式手动选章。查看地图或选择楼层时可暂停导览并返回。

## 本地预览

```sh
python3 scripts/serve-preview.py
```

打开 http://127.0.0.1:5189/ 。预览服务器支持PMTiles所需的HTTP Range。运行脚本前在仓库根目录。

`app.js`、`scene.js` 管理首屏视频及通用楼层；`living-loop.js`、`living-loop-scene.js` 管理方法网络；`place-story.js` 管理真实地理地图与滚动导览。Three.js r170通过CDN按需加载，MapLibre与PMTiles运行库及许可保留在spatial/。

## 地图状态与来源

真实交互地图仍限定localhost预览；公开域名保留静态地理画面及来源说明。此限制尚未作为本次推送的一部分解除。

独立地图图砖位于assets/tiles/wulin-intime/2026-09-23.1/，由官方Overture GeoParquet生成，不依赖Explorer检查端点。原始有界GeoJSON、清单、ODbL许可及生成脚本一并提供。建筑和高度是来源估计，缺失高度不补算。商场标记为近似公共POI，不是测绘边界、入口或客流。

方法场景的数据背景由同一批GeoJSON生成：`python3 scripts/build-method-preview.py`。署名见assets/method/ATTRIBUTION.md；地图署名见assets/tiles/wulin-intime/2026-09-23.1/ATTRIBUTION.md。

## 图像与内容

网上参考影像为CC BY2.0，非KYWOO项目或客户背书。当前场景下方显示对应作者、来源、许可和裁切说明；完整记录见assets/reference-photos/CREDITS.md。页面使用裁切和视觉遮罩。

简体内容基准见docs/landing-content-2026-11-04.md。真实项目图片、参与角色、公司资料和正式联系方式仍待确认；研究、参考影像及通用示意各自标示。

## 备选首页：交互相册

`alternative.html` 是独立备选首页，运行资源位于 `alternative/`，无需构建。原首页首屏的「体验交互相册」可进入，备选页提供返回原首页的链接。Vercel 的 cleanUrls 配置将该页面呈现为 `/alternative`。本地静态预览访问 `/alternative.html`。

包含四边混排缩图、全屏悬停三角、项目与研究内容及已确认邮箱。摄影来源与许可见 `alternative/SOURCES.md`；图片仅作为场所背景，不代表团队作品摄影。
