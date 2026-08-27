# 全省慢病管理仪表盘

这是从 Figma Make 下载的代码包，已整理为可本地运行、可推送 GitHub、可部署到 Netlify 的 React + Vite 项目。

## 本地运行

```bash
pnpm install
pnpm run dev
```

默认本地地址为 `http://localhost:8443/`。

## 生产构建

```bash
pnpm run build
```

构建产物输出到 `dist/`。

## Netlify

仓库连接 Netlify 后使用：

- Build command: `pnpm run build`
- Publish directory: `dist`

项目已包含 `netlify.toml`，通常无需手动填写。
