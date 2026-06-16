+++
draft = false
date = 2026-06-16T09:44:38+08:00
title = "blog.mugee.uk上线！🎉"
description = "使用Arch Linux搭建Hugo博客"
slug = ""
authors = ["Mugee"]
tags = ["Linux","Hugo","Website"]
categories = ["Coding"]
externalLink = ""
series = []
+++

### hello, world!

成功使用 **Hugo** + **GitHub** + **Cloudflare Pages** 搭建个人博客 [blog.mugee.uk](http://blog.mugee.uk)。

当你看到这篇blog的时候，说明mugee的个人网站已经搭建成功了！

#### 网站创建原因及背景

早在一年前我就开始创建各种网站，当时大多用的二级域名和本地HTML文件，后来也帮朋友买过域名搭过网站，但是一直没有创建完全属于自己的网站，主要原因其实是不想花钱买域名哈哈哈哈。前段时间一直在自己准备SAT考试，还是挺孤独的，时不时就想写写东西解解闷，正巧这段时间也在捣鼓老电脑玩[飞牛系统](https://www.fnnas.com/)的docker，突然就想给自己一个可以写写blog的空间，再三考虑之下就选择了用github+cf搭一个静态网站。所以~这个网站里会有一些非常有用的文章，可以引发你思考；会有一些我的学习笔记，可以帮助你理解；但是也会有一些没啥用的扯东扯西闲谈哈哈哈哈。作为开发者，我也不知道这个网站以后会有怎样“宏伟”的发展，让我们一起期待一下吧！

#### 搭建方案
采用Jamstack架构：

1. **_本地开发环境_**：Arch Linux + Hugo框架 + Vim编辑器
2. **_版本控制与源码管理_**：GitHub仓库(mugee-blog)
3. **_云端构建和全球部署*：Cloudflare Pages
4. **_专属域名_**：[blog.mugee.uk](http://blog.mugee.uk)

#### 为什么选择这个方案？
1. **费用较低**：不需要购买昂贵的云服务器，只需要买私人域名。（我为了省事直接在 cf 上直接购买的，费用会稍微比在其他平台高一点点，像我这个域名的话是一年5美金左右。）
2. **速度极快**：静态页面配合 Cf CDN 简直飞起。
3. **极客范儿**：在 Arch 终端里写 Markdown 提交，优雅，所有都可以在终端内完成。
