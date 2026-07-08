+++
title = "保险箱使用说明"
date = 2026-07-08T22:00:00+08:00
draft = false
outputs = ["HTML"]
sitemap = { disable = true }
+++

欢迎来到私人文章分区。

## 如何添加新文章

在 `content/vault/` 目录下新建 Markdown 文件即可，例如：

```text
content/vault/my-private-note.md
```

建议每篇私人文章都加上：

```toml
outputs = ["HTML"]
sitemap = { disable = true }
```

这样不会出现在 RSS、站点地图和公开列表中。

## 修改密码

在 `hugo.toml` 的 `[params.vault]` 中修改 `passwordHash`。生成新哈希：

```bash
echo -n '你的新密码' | sha256sum
```

将输出的哈希值填入 `passwordHash` 字段。

## 安全说明

这是静态站点的客户端密码门，主要防止随意浏览。文章 HTML 仍会随站点一起发布，技术用户仍可能通过查看源码获取内容。如需更高安全性，请使用服务端鉴权或加密存储。
