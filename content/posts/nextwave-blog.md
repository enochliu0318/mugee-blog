+++ 
draft = false
date = 2026-08-02T11:51:46+08:00
title = "后浪NextWave网站开发全流程"
description = "面向青少年的文学静态站，从零到上线的完整开发记录"
slug = ""
authors = ["Mugee"]
tags = ["NextWave"]
categories = ["Coding"]
externalLink = ""
series = []
+++


> 信仰的后浪，青春的发声。

前段时间我做了一个叫「后浪 NextWave」的小项目，专门给青少年提供一个干净、安静、适合阅读与发表的文学平台。它没有复杂的后台，没有数据库，甚至没有评论系统——就是纯静态站点，用 Markdown 写文章，Git 管理内容，Hugo 生成，Cloudflare Pages 部署。

今天把整个开发全流程和技术实现完整记录下来，方便以后自己复盘，也给想做类似小站的朋友一点参考。

---

## 一、项目定位

目标很简单：

- 面向青少年的诗歌、散文、小说、纪实发表平台
- 阅读体验优先（中文排版、移动端友好）
- 内容管理尽可能轻量（Git + Markdown）
- 零运维成本，稳定、安全、够用

最终上线地址示例：`https://nextwave.mugee.uk/`

栏目目前有：诗歌、散文、小说、纪实，外加投稿指引和关于页。

---

## 二、技术选型

| 层级 | 选择 | 理由 |
|------|------|------|
| 静态生成器 | Hugo Extended | 构建极快、Markdown 原生支持好、模板灵活 |
| 内容格式 | Markdown + YAML Front Matter | 写作门槛低，版本可控 |
| 样式 | 原生 CSS + CSS Variables | 无构建步骤，维护简单 |
| 字体 | 霞鹜文楷（LXGW WenKai） | 中文阅读体验优秀 |
| 交互 | 原生 JavaScript | 仅做移动端导航，够用就好 |
| 搜索 | Pagefind | 构建时生成索引，纯前端搜索 |
| 部署 | Cloudflare Pages | 自动构建 + 全球 CDN + 自定义域名 |

整体原则：**够用、轻量、可长期维护**。

---

## 三、项目结构

```
NextWave/
├── archetypes/default.md      # 新建文章模板
├── content/
│   ├── poetry/                # 诗歌
│   ├── prose/                 # 散文
│   ├── fiction/               # 小说
│   ├── non-fiction/           # 纪实
│   ├── about.md
│   ├── submit.md
│   └── _index.md
├── layouts/
│   ├── index.html             # 首页
│   ├── _default/
│   │   ├── baseof.html
│   │   ├── list.html
│   │   ├── single.html
│   │   └── search.html
│   └── partials/              # head / header / footer
├── static/
│   ├── css/style.css
│   └── js/header-scroll.js
├── hugo.toml
└── README.md
```

结构清晰，职责明确。

---

## 四、开发全流程

### 1. 本地环境

安装 Hugo Extended（建议 ≥ 0.128.0），然后：

```bash
git clone https://github.com/enochliu0318/NextWave.git
cd NextWave
hugo server -D
```

浏览器打开 `http://localhost:1313` 即可实时预览。

### 2. 新建文章

```bash
hugo new poetry/my-poem.md
hugo new prose/my-essay.md
hugo new fiction/my-story.md
```

Front Matter 大致如下：

```yaml
---
title: "文章标题"
author: "作者笔名"
date: 2026-07-28
draft: false
description: "摘要（可选）"
---
```

`draft: false` 才会正式发布。栏目由目录决定，不需要额外字段。诗歌建议用短句换行，模板会自动居中排版。

### 3. 构建与部署

```bash
hugo --minify
```

输出到 `public/`。

Cloudflare Pages 配置很简单：

- Framework preset：Hugo
- Build command：`hugo --minify`
- Output directory：`public`
- 环境变量：`HUGO_VERSION=0.128.0`

推送到 GitHub 后，Cloudflare 自动构建并部署。绑定自定义域名，再把 `hugo.toml` 里的 `baseURL` 改成真实域名即可。

日常发布流程就是：**写 Markdown → 提交 → 推送 → 自动上线**。

---

## 五、关键技术实现

### 1. 模板设计

- `baseof.html` 作为统一骨架
- 首页按栏目展示最新 3 篇文章
- 列表页支持摘要或自动截取
- 详情页对诗歌单独加了居中样式类
- 搜索页集成 Pagefind UI，并做了中文翻译

### 2. 样式与体验

使用 CSS Variables 定义主题色（主色 `#1e88a8`）、字体、圆角、阴影等。

- Sticky 毛玻璃 Header
- 卡片式文章列表 + 轻微 Hover 动效
- 诗歌专用居中、行高优化
- 移动端汉堡菜单 + 滚动时自动收起导航
- 霞鹜文楷作为正文字体，无衬线用于导航和元信息

整体风格干净、克制，适合长时间阅读。

### 3. 移动端交互

`header-scroll.js` 做了几件事：

- 汉堡菜单开关
- 滚动超过一定距离后 Header 进入紧凑态
- 回到顶部自动展开导航
- 点击链接后自动收起菜单
- 使用 `requestAnimationFrame` 优化滚动性能

代码量不大，但体验完整。

### 4. 搜索

采用 Pagefind。构建时生成静态索引，前端直接用 PagefindUI，支持中文提示文案。对纯静态站来说，这是目前体验最好的轻量方案之一。

---

## 六、内容与协作方式

目前投稿走邮件，由编辑人工审核后写入仓库。  
内容版权归作者所有，站点代码可自由使用与修改。

如果以后想更规范，可以用 GitHub Pull Request + CODEOWNERS 实现审核流，或者再接入简单的表单。

---

## 七、一些可继续优化的点

1. 构建命令里加上 Pagefind 自动生成索引
2. 增加暗色模式（CSS Variables 已铺好）
3. 支持更多栏目或标签系统
4. 接入轻量评论（如 Giscus）
5. 增加 RSS / Sitemap 的更细致配置

但现在的版本已经足够稳定、够用。

---

## 写在最后

做这个站点的初衷，是希望给青少年一个安静写字、被认真阅读的地方。技术本身并不复杂，重点是**克制**和**长期可维护**。

静态站 + Markdown + Git 的组合，在 2026 年依然是个人和小团队内容站最舒服的选择之一。构建快、部署简单、成本接近于零，还能完全掌控内容和呈现。

如果你也在考虑做一个类似的文学、笔记或社区小站，不妨试试这条路线。

项目地址：[https://github.com/enochliu0318/NextWave](https://github.com/enochliu0318/NextWave)

欢迎提 Issue 或直接投稿。
