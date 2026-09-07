+++
draft = false
date = 2026-09-08T01:00:00+08:00
title = "Arduino Nano 桌面小组件：麦金塔时钟"
description = ""
slug = ""
authors = ["Mugee"]
tags = ["Arduino","硬件","DIY"]
categories = ["Coding"]
externalLink = ""
series = []
toc = true
+++

起因很简单：想做一个放在桌面上、一抬眼就能看到的小东西。于是就有了这台「迷你麦金塔」——用 Arduino Nano + 0.96 寸 OLED + DS3231 时钟 + DHT11 温湿度，套上 3D 打印的经典 Macintosh 外壳，开机有麦金塔风格的启动动画，桌面上显示时间和一句分时段的问候语。

{{< figure src="/images/post_img/deskscreen/188.png" title="成品">}}

这个项目从点亮一块屏到最终成型，踩了不少坑，这篇做个完整记录。

---

### 硬件清单

- Arduino Nano（ATmega328P，旧 bootloader）
- 0.96 寸 OLED（SSD1306，I2C 地址 0x3C）
- DS3231 高精度 RTC 模块（带纽扣电池，掉电走时）
- DHT11 温湿度传感器
- TTP223 电容触摸模块（切页用）
- 3D 打印 Macintosh 外壳 + Nano 壳

接线方案：

| 模块 | 引脚 |
| --- | --- |
| OLED（软件 I2C） | SDA→A2，SCL→A3 |
| DS3231（硬件 I2C） | 拓展板 I2C 口 = A4/A5 |
| TTP223 触摸 | SIG→D2 |
| DHT11 | SIG→D4 |

OLED 走软件 I2C 而不是和 RTC 共用硬件 I2C，是为了避免总线上的相互拖累，也让接线更自由。

---

### 第一个坑：屏幕的坑差点劝退我

项目最开始买的那块 OLED 其实是 **SH1106**，典型症状就是屏幕左侧出现一列白线、图像错位——SH1106 是 132 列控制器，按 SSD1306（128 列）驱动就会偏移。换了一块 JMDO 的屏确认是 SSD1306 后才正常。

第二个坑更隐蔽：一开始用 U8g2 的全帧缓冲构造函数，直接把 Nano 仅有的 2KB RAM 吃爆，又是白线又是花屏。最后换成**分页 buffer** 的构造函数，每次只传一页数据，RAM 立刻宽裕了：

```cpp
U8G2_SSD1306_128X64_NONAME_1_SW_I2C display(U8G2_R0, A3, A2, U8X8_PIN_NONE);
//                       ^ "1" = 分页 buffer，省 RAM
```

如果不确定手上的屏是什么驱动、什么地址，先烧一个软件 I2C 扫描器扫一遍最稳妥。

---

### 双页 UI：时间页 + 空气页

主界面分两页，触摸 D2 切换：

**时钟页**：顶部小时间（冒号每秒闪烁）、右上角一个手绘的星空小钟表、日期 + 星期、Day 计数，还有分时段问候语。

**空气页**：顶部小时间 + "Room Air" 标题，下面是温度和湿度读数。

{{< figure src="/images/post_img/deskscreen/IMG_0322.JPG" title="面包板阶段" >}}

**性能上有个重要优化**：软件 I2C 刷一整帧大约要 200ms，如果每圈 loop 都全屏重绘，触摸切页的响应会很慢。解决办法是做了 `renderKey`——把当前页面上所有会变的内容（秒、页码、温湿度读数）拼成一个 key，**只有 key 变化时才真正刷屏**。秒变化时刷新时间，其余时候 loop 空转，触摸立刻就能响应。

---

### RTC 加固：乱码时间问题

DS3231 一度读出乱码时间，排查了很久，最后发现根因是**杜邦线接触不良**——硬件问题。本来都已经装好了，又从头拆了换好线装回去。为了以后出现此问题时快速被发现，软件上也做了一整套兜底：

- 初始化失败重试 5 次
- `timeValid()` 校验，丢弃年月日明显不对的乱码帧
- `Wire.setWireTimeout(25000, true)` 防止总线卡死拖垮主循环
- RTC 时间若落后于编译时间，上传时自动校准（也留了 `SET_TIME_ON_UPLOAD` 手动开关）

自此不管线怎么松，屏幕上都不会再出现 `45:72:88` 这种离谱的时间了。

---

### 开机动画：Hello, Macintosh

开机时屏幕会播放一段经典 Mac 风格的启动动画：一台麦金塔的轮廓逐步浮现，配上 "Welcome to Macintosh"，然后才进入主界面。外壳是照着初代 Macintosh 的造型设计的：正面挖出屏幕窗口，下巴做了软盘驱动的装饰细节，背面留了 Type-C 和传感器开孔，底座还配了个可拆卸的小键盘装饰件。

{{< figure src="/images/post_img/deskscreen/Screenshot%202026-09-08%20at%2012.48.08%20AM.png" title="外壳设计草图" >}}

---

### 外壳：3D 打印的迷你主机

除了装载屏幕的小麦金塔之外，我还设计了一个放nano和扩展板的迷你电脑主机机箱。

{{< figure src="/images/post_img/deskscreen/IMG_0361.JPG" title="调试现场" >}}

{{< figure src="/images/post_img/deskscreen/IMG_0366.JPG" title="3D 打印外壳" >}}

切了 17 次单盘……主要还是因为有些地方设计的太细，好多次需要推翻重新设计。包括小小的背板，都打印了两次，第一次没有做内部卡扣，粘都粘不紧，于是又设计了一版。

---

### 功耗

整机实测电流约 **30mA**（OLED + Nano + 各传感器）。按一周 7×24 小时通电算：

```
0.03A × 5V = 0.15W
0.15W × 168h = 25.2Wh ≈ 0.025 度/周
```

一个月不到 0.1 度电，比手机充电器的零头还少，可以放心让它一直亮着。

---

### 踩坑总结

1. **OLED 驱动型号要确认**：左移白线 = SH1106 按 SSD1306 驱动；花屏白线 = RAM 溢出，改用分页 buffer 构造函数。
2. **软件 I2C 很慢**：全帧约 200ms，必须做「内容变化才刷屏」，否则交互没法用。
3. **乱码时间先查线**：杜邦线接触不良是最大嫌疑，软件超时和校验只是兜底。
4. **TTP223 触摸会锁死**：多次按压后失灵，加去耦电容、调背面的 A/B 焊盘可以改善。
5. **买 Nano 认准旧 bootloader**：新买的 Type-C Nano 一直 `not in sync`，疑似不带 bootloader 或换了兼容芯片（328PB/LGT8F），最后用旧板搞定；救活新板可以用 Arduino as ISP 烧 bootloader。

编译上传命令（旧 bootloader Nano）：

```bash
arduino-cli compile --fqbn arduino:avr:nano:cpu=atmega328old ./deskscreen -u -p /dev/ttyUSB0
```

---

### 小结

这个项目技术含量不算高，Nano 的性能也简陋得可怜，但它可能是我在这个夏天写过的最喜欢的一段代码。它不做什么了不起的事，只是安安静静立在桌面上，走着正确的时间，数着我们一起走过的天数，在深夜屏幕亮起来的时候轻声说一句晚安。
