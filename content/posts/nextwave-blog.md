+++
draft = false
date = 2026-08-04T17:00:00+08:00
title = "后浪 NextWave 网站简介与维运指南"
description = "面向青少年的文学静态站：网站简介 + 零基础维运完整手册"
slug = ""
authors = ["Mugee"]
tags = ["NextWave", "Hugo", "Website"]
categories = ["Coding"]
externalLink = ""
series = []
+++

> 信仰的后浪，青春的发声。

[**后浪NextWave**](https://nextwave.mugee.uk)（https://nextwave.mugee.uk）是一个专为青少年打造的文学阅读与创作表达平台。它没有复杂的后台、没有数据库，用 Markdown 写文章、Git 管理内容、Hugo 生成静态页面、Cloudflare Pages 自动部署。

目前已支持：

- 诗歌 / 散文 / 小说 / 纪实 四大栏目
- 首页通知弹窗（可随时更新公告）
- 文章底部评论（基于 GitHub Discussions 的 giscus）
- 投稿指引与关于页面

今天把整个开发全流程和技术实现完整记录下来，方便以后自己复盘，也给想做类似小站的朋友一点参考。

本文同时作为**网站简介**和**零基础维运手册**。新接手的同学请重点阅读「后期管理全流程」章节，有问题及时联系项目负责人和开发者。

项目仓库：<https://github.com/enochliu0318/NextWave>

---

## 目录

- [一、网站简介](#一网站简介)
  - [1.1 定位与目标](#11-定位与目标)
  - [1.2 当前功能一览](#12-当前功能一览)
  - [1.3 技术栈（简要）](#13-技术栈简要)
  - [1.4 项目结构（当前）](#14-项目结构当前)
- [二、后期管理全流程（零基础维运手册）](#二后期管理全流程零基础维运手册)
  - [2.1 你需要准备的账号和工具](#21-你需要准备的账号和工具)
  - [2.2 日常两种工作方式](#22-日常两种工作方式)
    - [方式一：GitHub 网页直接改](#方式一github-网页直接改)
    - [方式二：本地操作](#方式二本地操作)
  - [2.3 发布新文章](#23-发布新文章)
  - [2.4 管理首页通知弹窗](#24-管理首页通知弹窗)
  - [2.5 评论功能说明](#25-评论功能说明)
  - [2.6 投稿接收与审核流程](#26-投稿接收与审核流程)
  - [2.7 常见维护任务清单](#27-常见维护任务清单)
  - [2.8 出问题时怎么办？](#28-出问题时怎么办)
  - [2.9 日常维护节奏建议](#29-日常维护节奏建议)
  - [2.10 重要提醒](#210-重要提醒)
- [三、开发相关快速参考](#三开发相关快速参考)
  - [本地开发](#本地开发)
  - [构建](#构建)
  - [Cloudflare Pages 配置](#cloudflare-pages-配置)
  - [评论配置位置](#评论配置位置)
- [四、可继续优化的方向](#四可继续优化的方向)
- [写在最后](#写在最后)

---

## 一、网站简介

### 1.1 定位与目标

- 面向青少年的文学发表与阅读平台
- 阅读体验优先：中文排版友好、移动端适配良好
- 内容管理极简：Git + Markdown，无需传统后台
- 零运维成本、稳定安全、可长期维护

口号：**信仰的后浪，青春的发声**

### 1.2 当前功能一览

| 功能 | 说明 |
|------|------|
| 四大栏目 | 诗歌、散文、小说、纪实 |
| 首页通知弹窗 | 可配置标题、正文、版本号，访客关闭后同一版本不再弹出 |
| 文章评论 | 使用 giscus（GitHub Discussions），每篇文章独立讨论串 |
| 投稿 | 邮件投稿，人工审核后上架 |
| 搜索 | 预留（Pagefind，当前标注为开发中） |
| 响应式设计 | 桌面 + 移动端完整适配，毛玻璃导航、诗歌居中排版 |

### 1.3 技术栈（简要）

- 静态生成器：Hugo Extended
- 内容：Markdown + YAML Front Matter
- 样式：原生 CSS + CSS Variables
- 字体：霞鹜文楷（LXGW WenKai）
- 评论：giscus（GitHub Discussions）
- 通知：`data/notice.yaml` + 前端 localStorage
- 部署：Cloudflare Pages（推送即自动构建）

### 1.4 项目结构（当前）

```
NextWave/
├── archetypes/default.md          # 新建文章模板
├── content/
│   ├── poetry/                    # 诗歌
│   ├── prose/                     # 散文
│   ├── fiction/                   # 小说
│   ├── non-fiction/               # 纪实
│   ├── about.md                   # 关于
│   ├── submit.md                  # 投稿
│   └── _index.md                  # 首页文案
├── data/
│   └── notice.yaml                # 首页通知弹窗配置
├── layouts/
│   ├── index.html
│   ├── _default/                  # baseof / list / single / search
│   └── partials/
│       ├── notice.html            # 通知弹窗模板
│       ├── comments.html          # giscus 评论
│       ├── head.html / header.html / footer.html
├── static/
│   ├── css/
│   │   ├── style.css
│   │   └── giscus-theme.css       # 评论主题样式
│   └── js/
│       ├── header-scroll.js
│       └── notice.js              # 通知弹窗逻辑
├── hugo.toml
└── README.md
```

---

## 二、后期管理全流程（零基础维运手册）

> 假设你是完全零基础：没写过代码、没用过 Git、不了解 Hugo。  
> 请严格按照下面步骤操作。遇到问题随时找项目负责人。

### 2.1 你需要准备的账号和工具

1. **GitHub 账号**
   - 注册：<https://github.com>
   - 注册后告诉负责人，把你加入仓库 Collaborator。
   - 加入后即可修改和推送代码。

2. **电脑软件（推荐安装，但不是必须）**
   - **Git**
     - Windows：<https://git-scm.com/download/win> （一路默认安装）
     - macOS：终端输入 `git --version`，没有会提示安装
   - **Hugo Extended**（本地预览用）
     - 下载：<https://github.com/gohugoio/hugo/releases>
     - 选带 `extended` 的版本
   - **文本编辑器**
     - 推荐 VS Code：<https://code.visualstudio.com/>
     - 记事本也可以

3. **Cloudflare 账号**（可选）
   - 用于查看构建是否成功，正常情况无需手动操作。

> 零基础同学可以全程只用「GitHub 网页编辑」，不需要安装任何软件。

### 2.2 日常两种工作方式

#### 方式一：GitHub 网页直接改

1. 打开 <https://github.com/enochliu0318/NextWave>
2. 进入要改的文件或文件夹
3. 点击右上角铅笔图标（Edit）或「Add file」→「Create new file」
4. 修改后拉到页面底部：
   - 填写 Commit message（例如「新增诗歌：xxx」）
   - 选择 Commit directly to the main branch
   - 点击绿色 Commit changes
5. 等待 1～3 分钟，Cloudflare 自动构建
6. 打开 <https://nextwave.mugee.uk> 刷新确认

#### 方式二：本地操作

**第一次设置：**

```bash
git clone https://github.com/enochliu0318/NextWave.git
cd NextWave
hugo server -D
```

浏览器打开 <http://localhost:1313> 预览。

**日常发文章 / 改文章：**

```bash
cd NextWave
git pull                          # 先拉最新，很重要！避免覆盖其他协作者的修改
hugo new poetry/文章文件名.md     # 或其他栏目：prose, fiction, non-fiction
# 用编辑器打开文件，改标题、作者、正文，把 draft: true 改成 false
hugo server -D                    # 本地预览
git add .
git commit -m "新增文章：文章标题"
git push
```

### 2.3 发布新文章

1. 进入对应栏目目录：
   - 诗歌 → `content/poetry/`
   - 散文 → `content/prose/`
   - 小说 → `content/fiction/`
   - 纪实 → `content/non-fiction/`

2. 新建文件，文件名用英文或拼音 + `.md`（例如 `chunyu.md`）

3. 粘贴以下模板并修改：

```yaml
---
title: "文章标题"
author: "作者笔名"
date: 2026-08-04
draft: false
description: "一句话摘要（可选，显示在列表页）"
---

这里开始写正文。

诗歌建议每一行都换行，站点会自动居中显示。
```

4. 提交并推送，等待自动上线。

**注意：**
- `draft: false` 才会正式发布
- 栏目由目录决定，无需额外字段
- 文章底部会自动出现评论区（诗歌、散文、小说、纪实均支持）

### 2.4 管理首页通知弹窗

通知内容全部写在 **`data/notice.yaml`**，不需要改代码。

当前文件结构示意：

```yaml
enabled: true
version: "2026-08-03v2"
title: "欢迎来到后浪 NextWave"
body: |
  网站近期上线了评论功能，欢迎大家在文章下方留言交流。

  欢迎各位同学们，叔叔阿姨们投稿……
button_text: "关闭"
```

**操作说明：**

| 字段 | 作用 | 怎么改 |
|------|------|--------|
| `enabled` | 是否显示通知 | `true` 显示，`false` 关闭（内容可保留） |
| `version` | 通知版本号 | **每次改完 title 或 body 后，必须改成新值**（如当天日期 `"2026-08-10"`），这样之前关闭过的访客也会重新看到新通知 |
| `title` | 弹窗标题 | 一行简短文字 |
| `body` | 正文 | 支持多段落，段落之间空一行 |
| `button_text` | 关闭按钮文字 | 默认「关闭」 |

**重要规则：**
- 只想改内容并让所有人重新看到 → 改 `title`/`body` **并同时改 `version`**
- 只想让已经看过的人不再弹出 → 不要动 `version`
- 临时关闭通知 → 把 `enabled` 改成 `false`

修改后提交推送即可，首页会自动生效。

### 2.5 评论功能说明

- 使用 **giscus**，评论实际存储在 GitHub 仓库的 **Discussions → Announcements** 分类下
- 每篇文章按页面路径自动对应一个独立讨论串
- 仅在诗歌、散文、小说、纪实文章页显示（关于页、投稿页不显示）
- 访客需要登录 GitHub 账号才能发表评论
- 主题样式文件：`static/css/giscus-theme.css`

**维护同学需要知道的：**
- 正常情况无需配置
- 如果评论不显示，检查网络或 GitHub 是否可访问
- 需要审核/删除不当评论时，去仓库的 Discussions 里操作
- 仓库地址：<https://github.com/enochliu0318/NextWave/discussions>

### 2.6 投稿接收与审核流程

1. **接收投稿**
   - 邮箱：`Enochliu0318@gmail.com`
   - 建议每天或每周固定查看

2. **审核标准**
   - 内容积极健康，适合青少年
   - 文字基本通顺
   - 尊重原意，只做必要格式调整

3. **通过后上架**
   - 按「发布新文章」流程创建 Markdown 文件
   - 填写正确 title、author、date、description
   - `draft: false` 后提交推送

4. **不通过时**
   - 礼貌回复作者并说明原因，鼓励修改后再投

### 2.7 常见维护任务清单

| 任务 | 操作位置 | 说明 |
|------|----------|------|
| 发布新文章 | `content/对应栏目/` | 新建 `.md` 文件 |
| 修改已有文章 | 对应 `.md` 文件 | 改完提交即可 |
| 删除/隐藏文章 | 删除文件 或 `draft: true` | |
| 更新首页通知 | `data/notice.yaml` | 改内容后记得更新 `version` |
| 修改「关于」页 | `content/about.md` | |
| 修改「投稿」页 | `content/submit.md` | |
| 修改口号/描述 | `hugo.toml` 的 `slogan`、`description` | 谨慎修改 |
| 修改导航菜单 | `hugo.toml` 的 `[[menu.main]]` | 谨慎修改 |
| 管理评论 | GitHub Discussions | 审核、删除不当内容 |
| 查看网站状态 | 打开线上地址刷新 | 构建失败可在 Cloudflare 看日志 |

### 2.8 出问题时怎么办？

1. **文章提交后网站没更新**
   - 等 3～5 分钟再刷新
   - Control+f5 强制刷新
   - 确认 `draft: false`、文件在正确目录、文件名以 `.md` 结尾
   - 检查 Cloudflare / GitHub 构建状态

2. **通知弹窗不出现或一直出现**
   - 检查 `data/notice.yaml` 的 `enabled` 是否为 `true`
   - 想让所有人重新看到 → 必须改 `version`
   - 浏览器隐私模式可能每次都弹，正常现象

3. **评论区不显示**
   - 确认是文章页（非关于/投稿页）
   - 检查网络能否访问 GitHub
   - 可到仓库 Discussions 确认分类是否正常

4. **不小心改错想恢复**
   - GitHub 网页进入文件 → History → 找回旧版本
   - 本地可用 `git checkout -- 文件名` 撤销未提交修改
   - 联系网站负责人

5. **推送提示权限不足**
   - 确认已被加为 Collaborator
   - 确认登录的是自己的 GitHub 账号

### 2.9 日常维护节奏建议

- **每周**：检查投稿邮箱，处理 1～2 篇新稿；必要时更新通知弹窗
- **每月**：检查首页、各栏目列表、评论区是否正常
- **每学期**：备份仓库（GitHub 下载 ZIP 一份更安心）
- **交接时**：把本手册 + GitHub 权限 + 邮箱权限一并交给下一位同学

### 2.10 重要提醒

1. **永远先 `git pull` 再修改**，避免覆盖别人的更新
2. **不要随意修改 `layouts/`、`static/`、`hugo.toml` 里的复杂配置**
3. **文章版权归作者所有**，上架前需获得确认
4. **遇到不确定的操作，先问，不要盲目尝试**
5. 更新通知时记得同步修改 `version`，否则老访客看不到新公告

只要按以上流程操作，即使是零基础也能顺利完成日常维护。真正需要改代码或大改版时，再找有经验的同学一起处理。

---

## 三、开发相关快速参考

### 本地开发

```bash
git clone https://github.com/enochliu0318/NextWave.git
cd NextWave
hugo server -D
```

### 构建

```bash
hugo --minify
```

### Cloudflare Pages 配置

| 设置项 | 值 |
|--------|-----|
| Framework preset | Hugo |
| Build command | `hugo --minify` |
| Build output directory | `public` |
| 环境变量 | `HUGO_VERSION=0.128.0` |

### 评论配置位置

`layouts/partials/comments.html`（一般不需要动）  
如需更换仓库或分类，可到 <https://giscus.app> 重新生成配置。

---

## 四、可继续优化的方向

1. 完善 Pagefind 搜索并正式上线
2. 暗色模式（CSS Variables 已铺好）
3. 更多栏目或标签系统

当前版本已足够稳定，适合长期日常使用。

---

## 写在最后

后浪 NextWave 的初衷，是给青少年一个安静写字、被认真阅读的地方，同时也给想学习网站管理的同学一个实践机会。

技术本身并不复杂，重点是**易上手**和**长期可维护**。静态站 + Markdown + Git 的组合，在 2026 年依然是个人和小团队内容站最舒服的选择之一。

新接手的同学请把本文「后期管理全流程」当作操作手册，按步骤执行即可。

- 网站：<https://nextwave.mugee.uk>
- 仓库：<https://github.com/enochliu0318/NextWave>
- 投稿邮箱：<Enochliu0318@gmail.com>

欢迎提 Issue、加入管理团队，或直接投稿。
