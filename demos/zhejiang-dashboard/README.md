# 浙江省慢病一体化管理监管平台 Demo

静态入口：`demo.html`。所有指标值均为模拟数据。

本地预览：`python3 -m http.server 8768`，打开 `http://127.0.0.1:8768/demo.html`。

Netlify 新站点配置：连接 `zy-lorna/AIMB`，分支 `zhejiang-dashboard-demo`，Base directory 设为 `demos/zhejiang-dashboard`，Build command 留空，Publish directory 设为 `.`。`_redirects` 会让站点根路径打开 Demo。

静态托管不提供 `/api/analysis` 接口；页面内的智能分析请求需要另行配置后端服务和密钥。
