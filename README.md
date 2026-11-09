# KYWOO · Make Space Live

静态落地页，无构建步骤。定位：Evidence-based Placemaking（循证的场所营造），以数据、空间、活动三个方向工作。

## 页面结构

- 定位：让冷清的空间，重新有人气。页脚口号：MAKE SPACE LIVE · 老空间，新人气。（2026-11-08，见 docs/landing-copy-2026-11-08.md）
- 方法：透视3D三角网络。鼠标移动带动镜头，接近节点时该点迎面放大，其余两点退向景深；背景影像与短句同步切换。点击固定，Escape或返回总览清除选择。
- 项目与研究：项目照片环与项目经验、城市更新参考列表（见下文「交互相册已并入首页」）；朱家角研究入口与杭州武林银泰城市关系示例，均不作为已实施的完整委托实绩。每张案例卡顶部是实景照片轮播（`case-photos.js`）：照片缓慢推近并交替，可点、可滑、可暂停，减少动态时静止。照片由 Pexels／Unsplash 免费图库直接加载，作者列在照片下方；杭州照片为城市实景，未找到可授权的武林银泰现场照片，有实拍后可直接替换 `index.html` 里的 `<img>`。
- 合作：诊断、试点、复盘。
- 联络与FAQ：邮箱 openkai@kywoo.com、复制对话提纲；无表单或提交后端。

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

## 交互相册已并入首页（2026-11-09）

原 `alternative.html` 交互相册的内容已并入首页，重复的介绍只保留一份：

- 项目经验（黄大仙中心、黄埔商场、深圳松坪村、澳门新葡京）与城市更新参考（上海上生·新所、首尔路 7017）放在「03 项目与研究」，上方是项目照片环（`project-ring.js`：四边缩图环绕中心说明，可拖动、可暂停，←/→ 与 Enter 可用），下方是完整列表。照片在 `assets/projects/`，作者与许可见各项目下方及 `assets/projects/credits.json`。
- 方法三个方向补入“具体问题”与“洞察支持设计 · 空间承载活动 · 使用观察回馈数据”；合作三步补入可讨论交付与分工；联络补入邮箱 openkai@kywoo.com 与“复制对话提纲”；常见问题合并为 7 条。
- 相册的研究叙事（朱家角、武林银泰的证据→问题→介入→验证）与首页方法、案例重复，且案例不再展示研究数据，未并入。图片风格切换、放大镜取色与合成声音未保留。
- `alternative.html` 现为跳转页：旧链接自动转到首页对应位置（如 `#/cases/whampoa` → `#project-whampoa`）。相册原始来源说明存于 `docs/album-sources-2026-11.md`。
