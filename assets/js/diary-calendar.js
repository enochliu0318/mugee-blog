(function () {
  "use strict";

  /* ----------------------------------------------------------------
   * 日记小日历目录
   * 扫描正文里 "2026年7月27日" 这类日期标题，生成一个可悬浮呼出的
   * 月历面板：有日记的日期高亮，点击跳转到对应段落。
   * 只在存在日记日期标题的页面上启用（目前即保险箱里的日记文章）。
   * ---------------------------------------------------------------- */

  const DATE_RE = /^\s*(\d{4})年(\d{1,2})月(\d{1,2})日/;
  const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"]; // 周一开头
  const FLASH_MS = 2000;

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  // 收集正文中的日期标题，返回 Map<"YYYY-MM-DD", heading元素>
  function collectEntries() {
    const content = document.querySelector(".vault-post .post-content");
    if (!content) return null;

    const byDate = new Map();
    content.querySelectorAll("h3").forEach((heading) => {
      const m = (heading.textContent || "").match(DATE_RE);
      if (!m) return;
      const key = `${m[1]}-${pad2(Number(m[2]))}-${pad2(Number(m[3]))}`;
      if (!byDate.has(key)) byDate.set(key, heading);
    });

    return byDate.size ? byDate : null;
  }

  function monthIndex(year, month) {
    return year * 12 + month; // month 为 0-11
  }

  function dateKey(year, month, day) {
    return `${year}-${pad2(month + 1)}-${pad2(day)}`;
  }

  function createButton() {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "diary-calendar-btn";
    btn.title = "日记日历";
    btn.setAttribute("aria-label", "打开日记日历");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = '<i class="fa-regular fa-calendar" aria-hidden="true"></i>';
    return btn;
  }

  function createPanel() {
    const panel = document.createElement("div");
    panel.className = "diary-calendar-panel";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "日记日历");
    return panel;
  }

  function init() {
    const byDate = collectEntries();
    if (!byDate) return;

    // 有日记的月份范围（用 0-11 的月份）
    let minMonth = Infinity;
    let maxMonth = -Infinity;
    byDate.forEach((_heading, key) => {
      const [y, m] = key.split("-").map(Number);
      const idx = monthIndex(y, m - 1);
      if (idx < minMonth) minMonth = idx;
      if (idx > maxMonth) maxMonth = idx;
    });

    // 打开面板时默认停在"最近一篇日记"所在月份
    let view = maxMonth;
    let open = false;

    const btn = createButton();
    const panel = createPanel();

    function renderMonth() {
      const year = Math.floor(view / 12);
      const month = view % 12;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      // 周一开头的空位偏移：getDay() 周日=0 → (0+6)%7=6
      const leadBlanks = (new Date(year, month, 1).getDay() + 6) % 7;
      const now = new Date();
      const todayKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate());

      panel.textContent = "";

      const head = document.createElement("div");
      head.className = "diary-cal-head";

      const prev = document.createElement("button");
      prev.type = "button";
      prev.className = "diary-cal-nav";
      prev.innerHTML = '<i class="fa-solid fa-chevron-left" aria-hidden="true"></i>';
      prev.setAttribute("aria-label", "上一个月");
      prev.disabled = view <= minMonth;
      prev.addEventListener("click", () => {
        view -= 1;
        renderMonth();
      });

      const label = document.createElement("span");
      label.className = "diary-cal-title";
      label.textContent = `${year}年${month + 1}月`;

      const next = document.createElement("button");
      next.type = "button";
      next.className = "diary-cal-nav";
      next.innerHTML = '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i>';
      next.setAttribute("aria-label", "下一个月");
      next.disabled = view >= maxMonth;
      next.addEventListener("click", () => {
        view += 1;
        renderMonth();
      });

      head.append(prev, label, next);
      panel.appendChild(head);

      const weekdays = document.createElement("div");
      weekdays.className = "diary-cal-grid diary-cal-weekdays";
      WEEKDAYS.forEach((name) => {
        const cell = document.createElement("span");
        cell.textContent = name;
        weekdays.appendChild(cell);
      });
      panel.appendChild(weekdays);

      const grid = document.createElement("div");
      grid.className = "diary-cal-grid";
      for (let i = 0; i < leadBlanks; i += 1) {
        grid.appendChild(document.createElement("span"));
      }
      for (let day = 1; day <= daysInMonth; day += 1) {
        const key = dateKey(year, month, day);
        const heading = byDate.get(key);
        const cell = document.createElement(heading ? "button" : "span");
        cell.className = "diary-cal-day";
        cell.textContent = String(day);
        if (key === todayKey) cell.classList.add("is-today");

        if (heading) {
          cell.type = "button";
          cell.classList.add("has-entry");
          cell.title = "跳转到这一天的日记";
          cell.addEventListener("click", () => jumpTo(heading));
        } else {
          cell.setAttribute("aria-disabled", "true");
        }
        grid.appendChild(cell);
      }
      panel.appendChild(grid);
    }

    function jumpTo(heading) {
      setOpen(false);
      heading.scrollIntoView({ behavior: "smooth", block: "center" });
      heading.classList.remove("diary-heading-flash");
      void heading.offsetWidth; // 强制重排以重启动画
      heading.classList.add("diary-heading-flash");
      setTimeout(() => heading.classList.remove("diary-heading-flash"), FLASH_MS);
    }

    function setOpen(next) {
      open = next;
      panel.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      if (open) {
        view = maxMonth; // 每次打开都停到最新的日记月份
        renderMonth();
      }
    }

    btn.addEventListener("click", () => setOpen(!open));

    // 点击面板/按钮以外的区域或按 Esc 关闭
    document.addEventListener("click", (event) => {
      if (!open) return;
      if (panel.contains(event.target) || btn.contains(event.target)) return;
      setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && open) setOpen(false);
    });

    // 保险箱未解锁时不显示日历按钮，锁定时顺手收起面板
    const vaultBody = document.getElementById("vault-body");
    if (vaultBody) {
      const syncLock = () => {
        const locked = vaultBody.hidden;
        btn.hidden = locked;
        if (locked && open) setOpen(false);
      };
      if (typeof MutationObserver === "function") {
        new MutationObserver(syncLock).observe(vaultBody, {
          attributes: true,
          attributeFilter: ["hidden"],
        });
      }
      syncLock();
    }

    // 挂到右下角悬浮按钮区（返回顶部 / 深浅色切换旁边）
    const floatContainer = document.querySelector(".float-container");
    if (floatContainer) {
      floatContainer.insertBefore(btn, floatContainer.firstChild);
    } else {
      const wrapper = document.createElement("div");
      wrapper.className = "float-container";
      wrapper.appendChild(btn);
      document.body.appendChild(wrapper);
    }
    document.body.appendChild(panel);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
