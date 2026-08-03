+++ 
draft = false
date = 2026-08-02T11:51:46+08:00
title = "后浪NextWave网站开发全流程及维运教程"
description = "面向青少年的文学静态站，从零到上线的完整开发记录"
slug = ""
authors = ["Mugee"]
tags = ["NextWave","Hugo","Website"]
categories = ["Coding"]
externalLink = ""
series = []
+++


> 信仰的后浪，青春的发声。

这段时间我做了一个叫「后浪 NextWave」的小项目，专门给青少年提供一个干净、安静、适合阅读与发表的文学平台。它没有复杂的后台，没有数据库，甚至没有评论系统——就是纯静态站点，用 Markdown 写文章，Git 管理内容，Hugo 生成，Cloudflare Pages 部署。

项目网站：<https://nextwave.mugee.uk>

今天把整个开发全流程和技术实现完整记录下来，方便以后自己复盘，也给想做类似小站的朋友一点参考。

同时也作为给以后负责维运的同学的维护手册，新接手的同学请重点阅读[**第七章「后期管理全流程」**](#七后期管理全流程给零基础维护同学的详细手册)，有问题及时联系项目负责人和开发者。


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

```yaml
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
hugo new non-fiction/my-essay.md
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

```bash
git add .
git commit -m "new post"
git push
```

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

### 4. 搜索[^searchnote]

采用 Pagefind。构建时生成静态索引，前端直接用 PagefindUI，支持中文提示文案。对纯静态站来说，这是目前体验最好的轻量方案之一。

[^searchnote]: 搜索功能正在开发中，敬请期待。

---

## 六、内容与协作方式

目前投稿走邮件，由编辑人工审核后写入仓库。  
内容版权归作者所有，站点代码可自由使用与修改。

---

## 七、后期管理全流程（给零基础维护同学的详细手册）

> 这一节专门写给以后负责日常维护的同学。  
> 假设你是完全零基础：没有写过代码、没用过 Git、不了解 Hugo。  
> 请严格按照下面的步骤操作，遇到问题随时找我。

### 7.1 你需要准备的账号和工具

1. **GitHub 账号**
   - 注册地址：https://github.com
   - 注册后告诉我，我会把你加入仓库的 Collaborator（协作者）。
   - 加入后你就有权限修改和推送代码了。

2. **电脑上需要安装的软件**
   - **Git**：用来管理代码和文章。
     - Windows：https://git-scm.com/download/win 下载安装，一路默认即可。
     - macOS：打开「终端」输入 `git --version`，如果没有会提示安装。
   - **Hugo Extended**（网站生成工具）：
     - 下载地址：https://github.com/gohugoio/hugo/releases
     - 选择带 `extended` 字样的版本（Windows 选 `hugo_extended_xxx_windows-amd64.zip`）。
     - 解压后，把里面的 `hugo.exe`（Windows）或 `hugo`（macOS）放到一个你知道的文件夹，并把这个文件夹加入系统 PATH（不会的话可以直接用下面的「GitHub 网页编辑」方式，不需要本地安装）。
   - **文本编辑器**（推荐）：
     - VS Code：https://code.visualstudio.com/ （免费，最好用）
     - 或者直接用记事本 / 文本编辑都行，但 VS Code 更方便。

3. **Cloudflare 账号**（可选，主要用于查看部署状态）
   - 如果我把你加到 Cloudflare 项目里，你就能看到网站是否构建成功。
   - 正常情况下不需要你手动操作 Cloudflare。

### 7.2 日常最常用的两种工作方式

#### 方式一：在 GitHub 网页上直接改（推荐零基础先用这个）

最简单，不需要在电脑上安装任何东西。

**步骤：**

1. 打开仓库地址：https://github.com/enochliu0318/NextWave
2. 点击你要修改的文件（比如要发新文章，就进入 `content/poetry/` 或对应栏目文件夹）。
3. 点击右上角的铅笔图标（Edit this file）。
4. 修改内容后，拉到页面最下方：
   - 填写简单说明（Commit message），例如「新增诗歌：xxx」
   - 选择「Commit directly to the main branch」
   - 点击绿色按钮「Commit changes」
5. 等待 1～3 分钟，Cloudflare 会自动重新构建网站。
6. 打开网站首页刷新，确认文章已经出现。

**发新文章时的具体操作：**

1. 进入对应栏目文件夹（诗歌 → `content/poetry/`，散文 → `content/prose/`，小说 → `content/fiction/`，纪实 → `content/non-fiction/`）。
2. 点击「Add file」→「Create new file」。
3. 文件名写成：`文章标题的英文或拼音.md`（例如 `spring-rain.md` 或 `chunyu.md`），注意必须是 `.md` 结尾。
4. 在编辑框里粘贴下面的模板，然后改成真实内容：

```yaml
---
title: "文章标题"
author: "作者笔名"
date: 2026-08-03
draft: false
description: "一句话摘要（可选，会显示在列表页）"
---

这里开始写正文。

诗歌建议每一行都换行，站点会自动居中显示。
```

5. 写完后同样提交（Commit）。
6. 等 Cloudflare 构建完成即可上线。

#### 方式二：在自己电脑上本地操作（更专业，推荐学会）

适合需要一次改多篇文章、或需要预览效果的情况。

**第一次设置（只做一次）：**

```bash
# 1. 打开终端（Windows 用 Git Bash，macOS 用「终端」）
# 2. 克隆仓库到本地
git clone https://github.com/enochliu0318/NextWave.git

# 3. 进入项目文件夹
cd NextWave

# 4. 启动本地预览（需要已安装 Hugo）
hugo server -D
```

浏览器打开 http://localhost:1313 就能看到网站效果。

**日常发文章 / 改文章流程：**

```bash
# 1. 进入项目文件夹
cd NextWave

# 2. 先拉取最新内容（很重要！避免冲突）
git pull

# 3. 新建文章（任选一种）
hugo new poetry/文章文件名.md
hugo new prose/文章文件名.md
hugo new fiction/文章文件名.md
hugo new non-fiction/文章文件名.md

# 4. 用 VS Code 或文本编辑器打开刚生成的文件，修改标题、作者、正文，并把 draft: true 改成 draft: false

# 5. 本地预览确认没问题
hugo server -D

# 6. 提交并推送到 GitHub
git add .
git commit -m "新增文章：文章标题"
git push
```

推送成功后，Cloudflare 会自动构建，大约 1～3 分钟后网站更新。

### 7.3 投稿接收与审核流程（维护同学的核心工作）

1. **接收投稿**
   - 投稿邮箱目前是：`Enochliu0318@gmail.com`
   - 每天或每周固定时间查看一次邮箱。
   - 邮件里通常包含：姓名/笔名、文章附件、简介。

2. **审核标准（可自行调整）**
   - 内容积极、健康，符合青少年阅读。
   - 文字基本通顺，无明显错别字。
   - 尊重作者原意，只做必要的格式调整（标点、换行、错别字）。

3. **审核通过后上架**
   - 把文章内容复制到对应栏目的 Markdown 文件。
   - 填写正确的 `title`、`author`、`date`、`description`。
   - 把 `draft: false`。
   - 提交并推送（用上面两种方式任意一种）。

4. **审核不通过时**
   - 礼貌回复作者，说明原因，鼓励修改后再投。
   - 不要公开批评。

### 7.4 常见维护任务清单

| 任务 | 操作位置 | 说明 |
|------|----------|------|
| 发布新文章 | `content/对应栏目/` | 新建 `.md` 文件 |
| 修改已有文章 | 直接编辑对应 `.md` 文件 | 改完提交即可 |
| 删除文章 | 删除对应 `.md` 文件后提交 | 或把 `draft: true` 隐藏 |
| 修改「关于」页面 | `content/about.md` | |
| 修改「投稿」页面 | `content/submit.md` | |
| 修改网站口号/描述 | `hugo.toml` 里的 `slogan` 和 `description` | ⚠️改完要重新构建 |
| 修改导航菜单 | `hugo.toml` 里的 `[[menu.main]]` 部分 | ⚠️谨慎修改 |
| 查看网站是否正常 | 打开线上地址刷新 | 构建失败可在 Cloudflare 看日志 |

### 7.5 出问题时怎么办？

1. **文章提交后网站没更新**
   - 等待 3～5 分钟再刷新。
   - 检查 Cloudflare Pages 构建是否成功（如果有权限）。
   - 检查 GitHub 构建状态。
   - 确认 `draft: false`，且文件放在正确栏目目录下。
   - 确认文件名是 `.md` 结尾。

2. **本地 `hugo server` 报错**
   - 先执行 `git pull` 确保代码是最新的。
   - 检查刚改的 Markdown 文件头部 `---` 是否成对、缩进是否正确。
   - 联系项目负责人。

3. **不小心改错了想恢复**
   - 在 GitHub 网页上，进入该文件 → 点击「History」→ 找到之前的版本 → 点击「Revert」或手动复制回来。
   - 或者本地用 `git checkout -- 文件名` 撤销未提交的修改。

4. **推送时提示权限不足**
   - 确认自己已经被加为仓库 Collaborator。
   - 确认用的是自己的 GitHub 账号登录。

### 7.6 日常维护建议节奏

- **每周**：检查投稿邮箱，处理 1～2 篇新稿。
- **每月**：检查网站首页、各栏目列表是否正常显示，有无错别字或排版问题。
- **每学期**：备份一次整个仓库（GitHub 本身已有历史记录，额外下载一份 zip 更安心）。

### 7.7 重要提醒（请务必遵守）

1. **永远先 `git pull` 再修改**，避免覆盖别人的更新。
2. **不要随意修改 `layouts/`、`static/`、`hugo.toml` 里的复杂配置**，除非你已经理解它们的作用。
3. **文章内容版权归作者所有**，上架前获得作者确认。
4. **遇到不确定的操作，先问，不要盲目尝试**。
5. 网站是给青少年看的，保持内容健康、正面。

只要按照上面的流程走，即使是零基础，也能顺利完成日常维护工作。  
真正需要改代码或大改版时，再找有经验的同学一起处理即可。

---

## 八、一些可继续优化的点

1. 构建命令里加上 Pagefind 自动生成索引
2. 增加暗色模式（CSS Variables 已铺好）
3. 支持更多栏目或标签系统
4. 接入轻量评论（如 Giscus）
5. 增加 RSS / Sitemap 的更细致配置

但现在的版本已经足够稳定、够用。

---

## 写在最后

做这个站点的初衷，是希望给青少年一个安静写字、被认真阅读的地方，同时也是给想要学习管理网站的同学一个实践的机会。技术本身并不复杂，重点是**易上手**和**长期可维护**。

静态站 + Markdown + Git 的组合，在 2026 年依然是个人和小团队内容站最舒服的选择之一。构建快、部署简单、成本接近于零，还能完全掌控内容和呈现。

如果你也在考虑做一个类似的文学、笔记或社区小站，不妨试试这条路线。

这篇文章同时也作为维护手册使用。新接手的同学请重点阅读[**第七章「后期管理全流程」**](#七后期管理全流程给零基础维护同学的详细手册)，按步骤操作即可。

项目地址：[https://github.com/enochliu0318/NextWave](https://github.com/enochliu0318/NextWave)

项目链接：<https://nextwave.mugee.uk>

欢迎提 Issue 、加入管理团队，或直接投稿。

