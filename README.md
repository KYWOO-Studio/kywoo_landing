# KYWOO · make space live — 官网落地页

纯静态页面：`index.html` + `assets/` 里的 SVG，不需要构建步骤。

## 部署到 Vercel

1. Vercel → Add New → Project → 导入 `KYWOO-Studio/kywoo_landing`
2. Project Name：`kywoo-make-space-live`
3. Framework Preset：Other；Root Directory 保持默认（仓库根目录）；Build Command 和 Output Directory 留空
4. Deploy

注意：Vercel 免费的 Hobby 账号不能部署 GitHub 组织下的**私有**仓库。可以把本仓库设为公开（仓库里只有对外网页本身），或使用 Vercel Pro。

## 待补内容

页面上用 `[ ]` 标出的内容：团队成员、三档价格与服务周期、联系邮箱 / 微信 / 城市、备案号与公司主体、保密协议说明。
预约表单目前只在页面上提示“在线提交还没有接通”，没有后端。

## 本地预览

```sh
npx serve .
```

设计稿另存于 Claude 画布；网页最初的版本也在 `KYWOO-Studio/kywoo_misc` 的 `make-space-live/` 目录。
