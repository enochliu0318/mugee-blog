(function () {
  "use strict";

  /* ----------------------------------------------------------------
   * 日记悬浮日期导航：底部居中胶囊
   *   [ 📅 ] [ 2026年 ] [ 7月 ] [ 27日 ]
   * - 📅：弹出带高亮的迷你月历（有日记的日期点亮，可翻月）
   * - 年/月/日：各自弹出单独一列的列表供选择
   * - 胶囊实时显示当前读到的日记日期（滚动跟随）
   * - 选中日期后跳转，标题对齐到视口顶端
   * ---------------------------------------------------------------- */

  const DATE_RE = /^\s*(\d{4})年(\d{1,2})月(\d{1,2})日/;
  const FLASH_MS = 4000; // 与 diary-heading-flash 动画时长保持一致
  const SPY_PROBE = 0.85; // 标题越过视口 85% 线即认为"读到了"这篇日记

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

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

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function safeScrollIntoView(node, options) {
    if (node && typeof node.scrollIntoView === "function") {
      node.scrollIntoView(options);
    }
  }

  function init() {
    const byDate = collectEntries();
    if (!byDate) return;

    const sortedKeys = Array.from(byDate.keys()).sort();

    // 索引：year -> 有日记的月份(0-11)集合；"YYYY-MM" -> 有日记的日期数组
    const yearMonths = new Map();
    const monthDays = new Map();
    sortedKeys.forEach((key) => {
      const [y, m, d] = key.split("-").map(Number);
      if (!yearMonths.has(y)) yearMonths.set(y, new Set());
      yearMonths.get(y).add(m - 1);
      const mk = `${y}-${pad2(m)}`;
      if (!monthDays.has(mk)) monthDays.set(mk, []);
      monthDays.get(mk).push(d);
    });

    const years = Array.from(yearMonths.keys()).sort((a, b) => a - b);

    // 有日记的月份范围（供迷你月历翻页边界用）
    let minMonth = Infinity;
    let maxMonth = -Infinity;
    yearMonths.forEach((set, y) => {
      set.forEach((m) => {
        const idx = y * 12 + m;
        if (idx < minMonth) minMonth = idx;
        if (idx > maxMonth) maxMonth = idx;
      });
    });

    const hasMonth = (y, m) => {
      const set = yearMonths.get(y);
      return Boolean(set && set.has(m));
    };
    const daysOf = (y, m) => monthDays.get(`${y}-${pad2(m + 1)}`) || [];

    // 当前选中/正在阅读的日期，默认停在最新一篇
    let sel = (function () {
      const [y, m, d] = sortedKeys[sortedKeys.length - 1]
        .split("-")
        .map(Number);
      return { y, m: m - 1, d };
    })();

    const keyOf = (s) => `${s.y}-${pad2(s.m + 1)}-${pad2(s.d)}`;

    // 从候选中挑离 value 最近的，并列时取更靠后的
    function nearest(list, value) {
      let best = list[0];
      list.forEach((v) => {
        const dNew = Math.abs(v - value);
        const dBest = Math.abs(best - value);
        if (dNew < dBest || (dNew === dBest && v > best)) best = v;
      });
      return best;
    }

    /* ---------- DOM 构建 ---------- */

    const dock = el("div", "diary-dock");

    const calBtn = el("button", "diary-dock-cal");
    calBtn.type = "button";
    calBtn.title = "迷你日历";
    calBtn.setAttribute("aria-label", "打开迷你日历");
    calBtn.innerHTML =
      '<i class="fa-regular fa-calendar" aria-hidden="true"></i>';

    const yearBtn = el("button", "diary-dock-seg");
    const monthBtn = el("button", "diary-dock-seg");
    const dayBtn = el("button", "diary-dock-seg");
    [yearBtn, monthBtn, dayBtn].forEach((b) => {
      b.type = "button";
      b.setAttribute("aria-expanded", "false");
    });
    dock.append(calBtn, yearBtn, monthBtn, dayBtn);

    const popover = el("div", "diary-popover");
    popover.hidden = true;
    popover.setAttribute("role", "dialog");
    popover.setAttribute("aria-label", "选择日记日期");

    let open = false;
    let mode = null; // "grid" | "year" | "month" | "day"
    let gridView = 0; // 迷你月历当前展示的月份（year*12 + m）
    let activeBtn = null; // 当前面板吸附、高亮的按钮

    function renderDock() {
      yearBtn.textContent = `${sel.y}年`;
      monthBtn.textContent = `${sel.m + 1}月`;
      dayBtn.textContent = `${sel.d}日`;
    }

    // 单独一列的选择列表（年 / 月 / 日）
    function renderList(unit) {
      popover.textContent = "";
      const col = el("div", "diary-pop-col");

      const addItem = (text, value, isActive, disabled) => {
        const b = el("button", "diary-pop-item", text);
        b.type = "button";
        b.dataset.unit = unit;
        b.dataset.value = String(value);
        if (isActive) b.classList.add("is-active");
        if (disabled) b.disabled = true;
        col.appendChild(b);
      };

      if (unit === "year") {
        years.forEach((y) => addItem(`${y}年`, y, y === sel.y, false));
      } else if (unit === "month") {
        for (let m = 0; m < 12; m += 1) {
          addItem(`${m + 1}月`, m, m === sel.m, !hasMonth(sel.y, m));
        }
      } else if (unit === "day") {
        daysOf(sel.y, sel.m).forEach((d) =>
          addItem(`${d}日`, d, d === sel.d, false)
        );
      }

      popover.appendChild(col);
      safeScrollIntoView(col.querySelector(".is-active"), { block: "nearest" });
    }

    // 迷你月历：有日记的日期点亮，可按月翻页
    function renderGrid() {
      popover.textContent = "";
      const y = Math.floor(gridView / 12);
      const m = gridView % 12;
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const leadBlanks = (new Date(y, m, 1).getDay() + 6) % 7; // 周一开头
      const now = new Date();
      const todayKey = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

      const head = el("div", "diary-cal-head");
      const prev = el("button", "diary-cal-nav");
      prev.type = "button";
      prev.dataset.gridNav = "prev";
      prev.setAttribute("aria-label", "上一个月");
      prev.innerHTML =
        '<i class="fa-solid fa-chevron-left" aria-hidden="true"></i>';
      prev.disabled = gridView <= minMonth;
      const title = el("span", "diary-cal-title", `${y}年${m + 1}月`);
      const next = el("button", "diary-cal-nav");
      next.type = "button";
      next.dataset.gridNav = "next";
      next.setAttribute("aria-label", "下一个月");
      next.innerHTML =
        '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i>';
      next.disabled = gridView >= maxMonth;
      head.append(prev, title, next);
      popover.appendChild(head);

      const weekdays = el("div", "diary-cal-grid diary-cal-weekdays");
      ["一", "二", "三", "四", "五", "六", "日"].forEach((name) => {
        weekdays.appendChild(el("span", null, name));
      });
      popover.appendChild(weekdays);

      const grid = el("div", "diary-cal-grid");
      for (let i = 0; i < leadBlanks; i += 1) {
        grid.appendChild(document.createElement("span"));
      }
      for (let d = 1; d <= daysInMonth; d += 1) {
        const key = `${y}-${pad2(m + 1)}-${pad2(d)}`;
        const heading = byDate.get(key);
        const cell = el(heading ? "button" : "span", "diary-cal-day", String(d));
        if (heading) {
          cell.type = "button";
          cell.classList.add("has-entry");
          cell.title = "跳转到这一天的日记";
          cell.dataset.key = key;
        } else {
          cell.setAttribute("aria-disabled", "true");
        }
        if (key === todayKey) cell.classList.add("is-today");
        grid.appendChild(cell);
      }
      popover.appendChild(grid);
    }

    function render() {
      if (mode === "grid") renderGrid();
      else renderList(mode);
    }

    function setOpen(next, nextMode) {
      open = next;
      popover.hidden = !next;
      popover.classList.toggle("is-grid", next && nextMode === "grid");
      popover.classList.toggle("is-list", next && nextMode !== "grid");
      if (next) {
        mode = nextMode;
        activeBtn =
          mode === "grid"
            ? calBtn
            : mode === "year"
              ? yearBtn
              : mode === "month"
                ? monthBtn
                : dayBtn;
        if (mode === "grid") gridView = sel.y * 12 + sel.m;
        render();
      } else {
        mode = null;
        activeBtn = null;
      }
      // 只有被点的那一段高亮
      [calBtn, yearBtn, monthBtn, dayBtn].forEach((b) =>
        b.setAttribute("aria-expanded", String(next && b === activeBtn))
      );
      positionPopover();
    }

    // 面板定位：迷你月历居中显示；年/月/日单列列表吸附在对应按钮正上方
    // （靠边时自动往回收）
    function positionPopover() {
      if (!open || !activeBtn) return;
      const margin = 10;
      const width = popover.offsetWidth;
      let left;
      if (mode === "grid") {
        left = (window.innerWidth - width) / 2;
      } else {
        const rect = activeBtn.getBoundingClientRect();
        left = rect.left + rect.width / 2 - width / 2;
        left = Math.max(
          margin,
          Math.min(left, window.innerWidth - width - margin)
        );
      }
      popover.style.left = `${left}px`;
    }
    window.addEventListener("resize", positionPopover);

    // 跳转到某天：标题对齐到视口最顶端，并短暂闪烁提示
    function jumpTo(key) {
      const [y, m, d] = key.split("-").map(Number);
      sel = { y, m: m - 1, d };
      renderDock();
      setOpen(false);
      const heading = byDate.get(key);
      if (!heading) return;
      safeScrollIntoView(heading, { behavior: "smooth", block: "start" });
      heading.classList.remove("diary-heading-flash");
      void heading.offsetWidth; // 强制重排以重启动画
      heading.classList.add("diary-heading-flash");
      setTimeout(() => heading.classList.remove("diary-heading-flash"), FLASH_MS);
    }

    /* ---------- 交互 ---------- */

    // 级联调整：切年时若该年没有当前月份，就近取有日记的月份；日同理
    function setYear(y) {
      sel.y = y;
      if (!hasMonth(sel.y, sel.m)) {
        const months = Array.from(yearMonths.get(y)).sort((a, b) => a - b);
        sel.m = nearest(months, sel.m);
      }
      const days = daysOf(sel.y, sel.m);
      if (!days.includes(sel.d)) sel.d = nearest(days, sel.d);
    }

    function setMonth(m) {
      sel.m = m;
      const days = daysOf(sel.y, sel.m);
      if (!days.includes(sel.d)) sel.d = nearest(days, sel.d);
    }

    // 点胶囊：📅 开迷你月历；年/月/日各自只弹出单独一列列表；
    // 再次点击同一段则收起
    dock.addEventListener("click", (event) => {
      if (event.target.closest(".diary-dock-cal")) {
        if (open && mode === "grid") setOpen(false);
        else setOpen(true, "grid");
        return;
      }
      const seg = event.target.closest(".diary-dock-seg");
      if (!seg) return;
      const unit = seg.dataset.unit;
      if (open && mode === unit) setOpen(false);
      else setOpen(true, unit);
    });

    // 面板内用事件委托，重渲染后监听依然有效
    popover.addEventListener("click", (event) => {
      const item = event.target.closest(".diary-pop-item");
      if (item && !item.disabled) {
        const unit = item.dataset.unit;
        const value = Number(item.dataset.value);
        if (unit === "year") setYear(value);
        else if (unit === "month") setMonth(value);
        else if (unit === "day") {
          sel.d = value;
          jumpTo(keyOf(sel));
          return;
        }
        renderDock();
        setOpen(false); // 年/月选择后收起，保持"一次一列"的轻量交互
        return;
      }

      const nav = event.target.closest("[data-grid-nav]");
      if (nav && !nav.disabled) {
        gridView += nav.dataset.gridNav === "prev" ? -1 : 1;
        renderGrid();
        return;
      }

      const day = event.target.closest("[data-key]");
      if (day) {
        jumpTo(day.dataset.key);
        return;
      }
    });

    // 点击面板/胶囊以外的区域或按 Esc 关闭。
    // 注意：点击面板里的选项会触发重渲染，原点击目标已被移出文档；
    // 若不加 isConnected 判断，会被误判成"外部点击"导致面板闪退。
    document.addEventListener("click", (event) => {
      if (!open) return;
      const target = event.target;
      if (target instanceof Node && !target.isConnected) return;
      if (popover.contains(target) || dock.contains(target)) return;
      setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && open) setOpen(false);
    });

    /* ---------- 滚动跟随：胶囊实时显示正在读的日记日期 ---------- */

    let spyTick = false;
    function spy() {
      spyTick = false;
      if (open) return;
      const probe = window.innerHeight * SPY_PROBE;
      let current = null;
      byDate.forEach((heading, key) => {
        if (heading.getBoundingClientRect().top <= probe) {
          if (!current || key > current) current = key;
        }
      });
      if (current && current !== keyOf(sel)) {
        const [y, m, d] = current.split("-").map(Number);
        sel = { y, m: m - 1, d };
        renderDock();
      }
    }
    window.addEventListener(
      "scroll",
      () => {
        if (spyTick) return;
        spyTick = true;
        window.requestAnimationFrame(spy);
      },
      { passive: true }
    );

    /* ---------- 保险箱锁状态与挂载 ---------- */

    const vaultBody = document.getElementById("vault-body");
    if (vaultBody) {
      const syncLock = () => {
        const locked = vaultBody.hidden;
        dock.hidden = locked;
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

    yearBtn.dataset.unit = "year";
    monthBtn.dataset.unit = "month";
    dayBtn.dataset.unit = "day";
    document.body.appendChild(popover);
    document.body.appendChild(dock);
    renderDock();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
