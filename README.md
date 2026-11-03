# KYWOO · make space live — 官网落地页

纯静态页面：`index.html` + `assets/` 里的 SVG，不需要构建步骤。

## 部署到 Vercel

1. Vercel → Add New → Project → 导入 `KYWOO-Studio/kywoo_landing`
2. Project Name：`kywoo-make-space-live`
3. Framework Preset：Other；Root Directory 保持默认（仓库根目录）；Build Command 和 Output Directory 留空
4. Deploy

注意：Vercel 免费的 Hobby 账号不能部署 GitHub 组织下的**私有**仓库。可以把本仓库设为公开（仓库里只有对外网页本身），或使用 Vercel Pro。

## 内容与待补资料

当前定位为 Data-driven Placemaking，连接品牌、空间与数据分析、活动策划。协作区介绍集体工作方向，不刊载个人姓名或占位履历。文案依据及待补输入见 `docs/landing-copy-2026-11-02.md`。

公开项目图片、参与角色、公司信息与正式联系方式仍待确认。页面没有预约表单或提交后端；页脚如实标明联系方式待确认。

## 本地预览

```sh
python3 -m http.server 5188 --bind 127.0.0.1
```

设计稿另存于 Claude 画布；网页最初的版本也在 `KYWOO-Studio/kywoo_misc` 的 `make-space-live/` 目录。
