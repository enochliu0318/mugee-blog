(function () {
  "use strict";

  // 所有"你上次看到某篇主文章时的样子"都存在这个 key 下面，
  // 结构：{ "<page-path>": { v, fullHash, blockHashes: [...], seenAt } }
  // v 是快照格式版本：diff 切分粒度变了就 +1，旧快照直接作废，
  // 避免新旧粒度混着比对导致整篇文章被误判为"全部更新"。
  const STORAGE_KEY = "mugee-posts-seen";
  const SNAPSHOT_VERSION = 1;

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
   * 2. 文章页：按"段落"做 diff，高亮改动、给出跳转按钮，
   *    并在离开页面时把这次的样子存为新的"已读基准"。
   * ---------------------------------------------------------------- */

  // 把正文切成更细的"段落"单位：每个顶层元素（p / h3 / pre / blockquote 等）
  // 各算一段，列表则再拆到每一个 <li>。这样改动某一段话时，
  // 只有那一段（对应 markdown 源文件里那一行）会被高亮。
  function collectBlocks(container) {
    const blocks = [];

    Array.from(container.children).forEach((el) => {
      if (el.tagName === "UL" || el.tagName === "OL") {
        Array.from(el.children).forEach((child) => {
          if (child.tagName === "LI") blocks.push(child);
        });
      } else {
        blocks.push(el);
      }
    });

    return blocks;
  }

  function blockText(block) {
    return (block.textContent || "").trim();
  }

  // 用 LCS 对比"上次看到的分段哈希序列"和"这次的分段哈希序列"，
  // 找出这次序列里"没有出现在最长公共子序列中"的段落下标——
  // 这些就是新增或被改动过的段落。
  function diffBlockHashes(oldHashes, newHashes) {
    const n = oldHashes.length;
    const m = newHashes.length;
    const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        dp[i][j] =
          oldHashes[i - 1] === newHashes[j - 1]
            ? dp[i - 1][j - 1] + 1
            : Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }

    const matchedNewIndexes = new Set();
    let i = n;
    let j = m;
    while (i > 0 && j > 0) {
      if (oldHashes[i - 1] === newHashes[j - 1]) {
        matchedNewIndexes.add(j - 1);
        i--;
        j--;
      } else if (dp[i - 1][j] >= dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    const changed = [];
    for (let k = 0; k < m; k++) {
      if (!matchedNewIndexes.has(k)) changed.push(k);
    }
    return changed;
  }

  // 直接在元素本身上打高亮类，不包一层 div——
  // 因为现在的"段"可能是 <li>，包 div 会破坏列表的 DOM 结构。
  function markBlockAsChanged(block) {
    if (!block || !block.parentNode) return null;

    block.classList.add("posts-diff-block", "posts-diff-new");
    return block;
  }

  function buildJumpButton(container, targets) {
    if (!targets.length) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "posts-jump-btn";
    btn.textContent =
      targets.length > 1
        ? `跳转到最新更新（共 ${targets.length} 处）`
        : "跳转到最新更新";

    let index = 0;
    btn.addEventListener("click", () => {
      targets[index].scrollIntoView({ behavior: "smooth", block: "center" });
      index = (index + 1) % targets.length;
    });

    container.parentNode.insertBefore(btn, container);
  }

  function initArticleDiff() {
    const container = document.querySelector("[data-posts-seen]");
    if (!container) return;

    const path = container.dataset.postsPath;
    const fullHash = container.dataset.postsHash;
    if (!path || !fullHash) return;

    const seenMap = readSeenMap();
    const previous = seenMap[path];

    const blocks = collectBlocks(container);
    const currentBlockHashes = blocks.map((b) => fnv1aHash(blockText(b)));

    // 只有"之前真的访问、留下过快照"的情况下才做 diff 高亮；
    // 第一次打开某篇文章时，全篇对读者来说都是"新的"，没必要标黄。
    // 快照版本不匹配（比如切分粒度升级过）时也当作没有基线，跳过本次 diff。
    if (
      previous &&
      previous.v === SNAPSHOT_VERSION &&
      Array.isArray(previous.blockHashes)
    ) {
      const changedIndexes = diffBlockHashes(
        previous.blockHashes,
        currentBlockHashes
      );

      if (changedIndexes.length) {
        const targets = changedIndexes
          .map((idx) => markBlockAsChanged(blocks[idx]))
          .filter(Boolean);
        buildJumpButton(container, targets);
      }
    }

    let saved = false;
    function saveSnapshot() {
      if (saved) return;
      saved = true;
      const map = readSeenMap();
      map[path] = {
        v: SNAPSHOT_VERSION,
        fullHash: fullHash,
        blockHashes: currentBlockHashes,
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
    initArticleDiff();
  });
})();