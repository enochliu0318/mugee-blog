(function () {
  "use strict";

  // 所有"你上次看到某篇主文章时的样子"都存在这个 key 下面，
  // 结构：{ "<page-path>": { fullHash, seenAt } }
  const STORAGE_KEY = "mugee-posts-seen";

  function readSeenMap() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function writeSeenMap(map) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
      // localStorage 不可用（隐私模式等）时静默失败，不影响正常浏览
    }
  }

  function fnv1aHash(str) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16);
  }

  // 内容指纹（fullHash / data-posts-hash）由 Hugo 端用 crypto.SHA256 计算，
  // 列表中只用它做"是否变化"的比对，不需要 JS 侧再算哈希。

  /* ----------------------------------------------------------------
   * 1. 列表页：给"自上次访问后已更新"的文章点亮黄色小圆点
   * ---------------------------------------------------------------- */
  function initListUpdateDots() {
    const list = document.querySelector("[data-posts-update-list]");
    if (!list) return;

    const seenMap = readSeenMap();

    list.querySelectorAll("[data-posts-path]").forEach((item) => {
      const path = item.dataset.postsPath;
      const currentHash = item.dataset.postsHash;
      const dot = item.querySelector("[data-posts-update-dot]");
      if (!path || !currentHash || !dot) return;

      const seen = seenMap[path];
      // 只有"之前访问过、且指纹变了"才提示；从未打开过的文章不算"更新"，
      // 只是"还没读"而已，不需要额外提示。
      if (seen && seen.fullHash && seen.fullHash !== currentHash) {
        dot.hidden = false;
      }
    });
  }

  /* ----------------------------------------------------------------
   * 2. 文章页：离开时把这次看到的样子存为新的"已读基准"，
   *    这样下次回列表页时才能判断这篇文章是否更新过。
   * ---------------------------------------------------------------- */
  function initArticleSeen() {
    const article = document.querySelector("[data-posts-seen]");
    if (!article) return;

    const path = article.dataset.postsPath;
    const fullHash = article.dataset.postsHash;
    if (!path || !fullHash) return;

    // 部分文章内容里可能包含每次构建都会变的渲染结果，这里直接用
    // 页面 data 属性里 Hugo 计算的哈希即可，无需 JS 重算。

    let saved = false;
    function saveSnapshot() {
      if (saved) return;
      saved = true;
      const map = readSeenMap();
      map[path] = {
        fullHash: fullHash,
        seenAt: Date.now(),
      };
      writeSeenMap(map);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") saveSnapshot();
    });
    window.addEventListener("pagehide", saveSnapshot);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initListUpdateDots();
    initArticleSeen();
  });
})();