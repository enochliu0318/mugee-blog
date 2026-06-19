+++ 
draft = false
date = 2026-06-20T05:40:47+08:00
title = "Java入门"
description = ""
toc = true
slug = ""
authors = ["Mugee"]
tags = ["Java"]
categories = ["Coding"]
externalLink = ""
series = []
+++

## 第一章 Java概述

Java——最常用的编程语言，1995年由SUN公司（2009年被Oracle公司收购）开发。显著特性——**跨平台运行：“一次编写，到处运行”**

### 1.1 简介
  
#### 1.1.1 起源与发展
  
起源于Green项目，前身为Oak语言，目的为占领智能消费性电子产品的市场份额，初衷为开发嵌入式家用电器的分布式软件系统。为此，开发的一种可移植的、独立于平台的语言，可以运行在不同环境、不同CPU芯片上。

发展历程：

---

| 年份 | 发展 |
| :--- | :--- |
| 1993 | 万维网和因特网开始发展，但仅有静态网页，所以SUN公司决定将Java应用方向转向互联网。 |
| 1996 | 推出Java1.0 (Java Development Kit1.0, JDK1.0) ，开发动态网页更加容易。 |
| 1998 | 推出Java1.2 (JDK1.2) ，后更名为Java2 (Java Two) ，强化了Java的图形处理能力，增加大量类。 |
| 1999 | 发布Java SE标准版 (J2SE) ，Java EE企业版 (J2EE) ，Java ME微型版 (J2ME) 。 |

---

版本区别：

---

| 版本 | 描述 |
| :--- | :--- |
| Java SE | 重在开发图形用户界面（GUI）、复杂高性能桌面应用程序。 |
| Java EE | 安全可靠，易于管理，多层体系结构。 |
| Java ME | 有限连接，包含SE中部分类库，移动类、嵌入式开发。 |

---

#### 1.1.2 优点

Java最大优点是与平台无关，此外还有精炼——更少代码量。

六大优点：

1. 容易入门
2. 代码编写数量更少，比C++少约四分之一
3. 代码编写质量更高，避免内存泄漏
4. 开发程序速度更快，比C++短约三分之二
5. 一次编写到处运行，避免平台依赖性
6. 更方便的分配软件

### 1.2 语言与平台

Java技术既可以指Java语言，也可以指Java平台。

#### 1.2.1 Java语言

Java语言是一种面向对象dee高级语言，第一时间把源代码写成`.java`为拓展名的纯文本文件，紧接着被javac编译器编译为`.class`文件，该文件不包含本地处理器的代码，而包含字节码（bytecodes）—Java虚拟机（Java Virtual Machine, JVM）的机器语言。

一般的操作系统（如Windows, Solaris, Linux, MacOs）上都有可用的JVM。

#### 1.2.2 Java平台

平台：一个程序运行时所处的硬件和软件环境，基本可以描述为一个操作系统与其基础硬件的组合体。Java平台是纯软件平台。

Java平台分为两部分，Java虚拟机和Java应用程序设计接口（API）。所谓API是指一个已经实现好的现成软件组件的大集合。此外，还被组织成相关类和接口的库，这就是“包”。

### 1.3 搭建Java程序开发平台

_(以Windows系统示例)_

#### 1.3.1 系统要求

1. 操作系统：Windors7以上
2. Java SE开发工具箱：不同版本的JDK差别不大
3. 文本编辑器：可以直接使用Windows自带的记事本

#### 1.3.2 下载JDK

官网下载链接：<https://www.oracle.com/java/technologies/downloads/>

下载成功后的JDK是一个可执行文件

### 1.4 开发第一个Java应用程序

开发Java程序需经过三个步骤：

1. 创建源文件
2. 将源文件编译成`.class`文件
3. 运行程序

#### 1.4.1 创建源文件

1. 打开记事本，在新打开的文本文档中输入代码。

---
```
//使用Java输出"hello world!"
public class HelloJava {
    public static void main (String[] args) {
        //输出
        System.out.println("hello world!");
    }
}
```
---

2. 将代码保存到以`HelloJava.java`命名的文件中。在记事本中，选择【文件】->【另存为】。

  1. 使用【保存】组合框，指定目录。
  2. 在【文件名】文本框中输入`HelloJava.java`。
  3. 在【保存类型】下拉列表框中，选择文本文档。
  4. 在【编码】下拉列表框中，保持编码`ANSI`。