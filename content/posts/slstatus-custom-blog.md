+++ 
draft = false
date = 2026-08-22T12:39:49+08:00
title = "slstatus定制：实时年龄、日子计数与蓝牙状态显示"
description = ""
slug = ""
authors = ["Mugee"]
tags = ["Linux","slstatus"]
categories = ["Coding"]
externalLink = ""
series = []
+++

slstatus 是 suckless 风格的轻量状态栏工具，默认通过 EWMH 属性或 stdout 输出系统信息，常配合 dwm 使用。它本身已经很精简高效，但真正好玩的地方在于**自己写组件**。

本文重点不谈官方自带的 battery、cpu、wifi 等常规模块，而是分享我添加的三个个人化组件：

1. **实时年龄计算**（`age_cal`）
2. **重要日子精确天数计数**（`days_since`）
3. **蓝牙连接设备名 + 电量**（`bluetooth_conn` / `bluetooth_batt`）

这些组件让状态栏变成了真正“属于我”的东西。

---

### 1. 实时年龄显示（精确到小数点后 8 位）

状态栏里最显眼的一项是：

```c
{ age_cal, "me@[%s]  ‖  ", "20100318" },
```

效果类似：`me@[16.43210987] ‖`

实现非常直接（`components/age.c`）：

```c
#define YEAR 31557600.0   /* 平均年长度（考虑闰年） */

const char *
age_cal(const char *birth)
{
    static char age_buf[16];
    int year, month, day;
    sscanf(birth, "%4d%2d%2d", &year, &month, &day);

    struct tm birth_time = {0};
    birth_time.tm_year = year - 1900;
    birth_time.tm_mon  = month - 1;
    birth_time.tm_mday = day;

    time_t birth_timestamp = mktime(&birth_time);
    time_t current_timestamp = time(NULL);

    double seconds_difference = difftime(current_timestamp, birth_timestamp);
    double super_age = seconds_difference / YEAR;

    snprintf(age_buf, sizeof(age_buf), "%.8lf", super_age);
    return age_buf;
}
```

**设计要点：**

- 使用 `31557600.0`（365.25 × 86400）作为年平均秒数，能较好地处理闰年。
- 输出精度到小数点后 8 位，状态栏每 300ms 刷新一次时，数字会缓慢跳动，有种“生命在流逝”的感觉。
- 参数直接写出生日期 `YYYYMMDD`，无需额外配置文件。

---

### 2. 重要日子精确天数计数

我最喜欢的组件：

```c
{ days_since, "📅 %s  ‖  ", "2026-07-01" },
```

输出类似：`📅 51.23456d ‖`

对应代码（`components/days.c`）：

```c
const char *
days_since(const char *date_str)
{
    struct tm target_tm = { 0 };
    time_t now, target;
    double diff_sec, days;

    if (sscanf(date_str, "%d-%d-%d",
               &target_tm.tm_year, &target_tm.tm_mon, &target_tm.tm_mday) != 3)
        return NULL;

    target_tm.tm_year -= 1900;
    target_tm.tm_mon  -= 1;
    target_tm.tm_isdst = -1;   /* 让 mktime 自动处理夏令时 */

    target = mktime(&target_tm);
    if (target == -1)
        return NULL;

    time(&now);
    diff_sec = difftime(now, target);
    days = diff_sec / (60 * 60 * 24);

    return bprintf("%.5fd", days);
}
```

**亮点：**

- 支持任意 `YYYY-MM-DD` 日期，可以轻松换成纪念日、项目启动日、考试日等。
- 精确到小数点后 5 位（约 0.86 秒分辨率），配合 300ms 刷新，视觉上是实时跳动的。
- 使用 `difftime` + `mktime` 正确处理时区和夏令时。

想换日期只需要改 `config.h` 里的字符串即可，重新 `make` 就行。

---

### 3. 蓝牙设备名 + 电量显示

蓝牙相关我写了三个函数（目前用了两个）：

```c
{ bluetooth_conn, "B[%s]",           "" },
{ bluetooth_batt, "[%s]  ‖  ",        "" },
```

典型输出：`B[AirPods Pro][87%] ‖` 或 `B[WH-1000XM5, Keyboard][62%, 100%] ‖`

核心实现依赖 `bluetoothctl`（`components/bluetooth.c`）：

- **`bluetooth_conn`**：执行 `bluetoothctl devices Connected`，解析设备名称，多个设备用 `, ` 分隔。
- **`bluetooth_batt`**：对每个已连接设备再执行 `bluetoothctl info <MAC>`，用正则提取 `Battery Percentage: 0x?? (NN)`，同样用逗号拼接。

关键解析逻辑示例：

```c
/* 提取设备名 */
if (strncmp(buf, "Device ", 7) != 0) continue;
name = strchr(buf + 7, ' ');
if (!name) continue;
name++;   /* 跳过 MAC 后的空格 */

/* 提取电量 */
sscanf(buf, " Battery Percentage: %*x (%d)", &perc)
```

**优点：**

- 无需额外 daemon，直接调用系统自带的 `bluetoothctl`。
- 支持多设备同时显示名称和电量。
- 没有连接设备时返回 `NULL`，状态栏会干净地跳过该项。

---

### 最终状态栏配置片段

```c
static const struct arg args[] = {
    { hostname,       " @%s  ‖  ",           "" },
    /* 音量、亮度、电池等常规项... */
    { bluetooth_conn, "B[%s]",               "" },
    { bluetooth_batt, "[%s]  ‖  ",           "" },
    { wifi_essid,     "W[%s]",               "wlp0s20f3" },
    { wifi_perc,      "[%s]  ‖  ",           "wlp0s20f3" },
    { age_cal,        "me@[%s]  ‖  ",        "20100318" },
    { days_since,     "📅 %s  ‖  ",          "2026-07-01" },
    { datetime,       "[ %s ] ",             "%F %T" },
};
```

刷新间隔设为 300ms，既保证数字跳动流畅，又不会带来明显的 CPU 开销。

---

## 小结

通过三个很小的组件，状态栏从“系统信息显示器”变成了**个人时间胶囊**：

- 实时年龄让人时刻意识到时间流逝
- 日子计数让我感恩和她走过的一路
- 蓝牙信息则解决了耳机/键盘电量需要频繁查看手机的痛点

这正是 suckless 哲学最迷人的地方——代码足够小，你完全可以按照自己的生活节奏去扩展它。

如果你也想加这些功能，直接把 `age.c`、`days.c`、`bluetooth.c` 丢进 `components/`，在 `slstatus.h` 声明函数，改好 `config.h` 后 `make clean install` 即可。
