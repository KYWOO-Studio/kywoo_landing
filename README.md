# KYWOO · Make Space Live

静态落地页，无构建步骤。定位：Data-driven Placemaking，连接数据、空间重塑与创新运营。

## 页面结构

- 定位：让空间，连接生活。
- 方法：透视3D三角网络。鼠标移动带动镜头，接近节点时该点迎面放大，其余两点退向景深；背景影像与短句同步切换。点击固定，Escape或返回总览清除选择。
- 研究案例：朱家角研究入口与杭州武林银泰城市关系示例，均不作为已实施的完整委托实绩。
- 合作：诊断、试点、复盘。
- 联络与FAQ：保留联系按钮；正式公开联系方式尚待确认，无表单或提交后端。

手机用点选；原生按钮支持键盘；暂停和系统减少动态关闭持续动画。WebGL不可用时保留静态三角、图片、说明与操作。旧通用楼层模型保留在可展开区，与真实商场地理明确区分。

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
