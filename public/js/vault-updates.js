(function () {
  "use strict";

  // 所有"你上次看到某篇保险箱文章时的样子"都存在这个 key 下面，
  // 结构：{ "<page-path>": { v, fullHash, blockHashes: [...], seenAt } }
  // v 是快照格式版本：diff 切分粒度变了就 +1，旧快照直接作废，
  // 避免新旧粒度混着比对导致整篇文章被误判为"全部更新"。
  const STORAGE_KEY = "mugee-vault-seen";
  const SNAPSHOT_VERSION = 2;

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

  // 简单快速的字符串哈希（FNV-1a），只用于本地比对分段是否变化，
  // 不用于安全用途，所以不需要 crypto.subtle 那种量级的哈希。
  function fnv1aHash(str) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16);
  }

  /* ----------------------------------------------------------------
   * 1. 列表页：给"自上次访问后已更新"的文章点亮小圆点
   * ---------------------------------------------------------------- */
  function initListUpdateDots() {
    const list = document.querySelector("[data-vault-update-list]");
    if (!list) return;

    // 浏览器第一次到访（localStorage 里还没有任何记录）时，静默把当前
    // 所有内容记为基线、全部不亮灯——整个保险箱对新读者都是新的，逐篇
    // 提示只是噪音。此后列表里再出现"没有基线"的条目，就一定是新写的，
    // 和内容有更新的旧条目一样亮灯。
    let firstVisit = false;
    try {
      firstVisit = localStorage.getItem(STORAGE_KEY) === null;
    } catch {
      firstVisit = true;
    }

    if (firstVisit) {
      const seed = {};
      list.querySelectorAll("[data-vault-path]").forEach((item) => {
        const path = item.dataset.vaultPath;
        const hash = item.dataset.vaultHash;
        if (path && hash) {
          seed[path] = {
            v: SNAPSHOT_VERSION,
            fullHash: hash,
            seenAt: Date.now(),
          };
        }
      });
      writeSeenMap(seed);
      return;
    }

    const seenMap = readSeenMap();

    list.querySelectorAll("[data-vault-path]").forEach((item) => {
      const path = item.dataset.vaultPath;
      const currentHash = item.dataset.vaultHash;
      const dot = item.querySelector("[data-vault-update-dot]");
      if (!path || !currentHash || !dot) return;

      const seen = seenMap[path];
      // !seen = 新条目；seen.fullHash 与当前不一致 = 内容有更新
      if (!seen || !seen.fullHash || seen.fullHash !== currentHash) {
        dot.hidden = false;
        dot.title = seen
          ? "自你上次查看后，这篇内容已更新"
          : "这是一篇你还没看过的新内容";
      }
    });
  }

  /* ----------------------------------------------------------------
   * 2. 文章页：按"段落"做 diff，高亮改动、给出跳转按钮，
   *    并在离开页面时把这次的样子存为新的"已读基准"。
   * ---------------------------------------------------------------- */

  // 把正文切成更细的"段落"单位：每个顶层元素（p / h3 / pre / blockquote 等）
  // 各算一段，列表则再拆到每一个 <li>。这样改动某一天日记里的某一段话时，
  // 只有那一段（对应 markdown 源文件里那一行）会被高亮，
  // 而不是整个 "### 某天" 标题下的内容全部标红。
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
  // 这些就是新增或被改动过的段落（不管是追加在最后，还是改了中间某天的内容）。
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

  // 直接在元素本身上打高亮类，不再包一层 div——
  // 因为现在的"段"可能是 <li>，包 div 会破坏列表的 DOM 结构。
  function markBlockAsChanged(block) {
    if (!block || !block.parentNode) return null;

    block.classList.add("vault-diff-block", "vault-diff-new");
    return block;
  }

  function buildJumpButton(container, targets) {
    if (!targets.length) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "vault-jump-btn";
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
    const container = document.querySelector("[data-vault-diff]");
    if (!container) return;

    const path = container.dataset.vaultPath;
    const fullHash = container.dataset.vaultHash;
    if (!path || !fullHash) return;

    const seenMap = readSeenMap();
    const previous = seenMap[path];

    const blocks = collectBlocks(container);
    const currentBlockHashes = blocks.map((b) => fnv1aHash(blockText(b)));

    // 只有"之前真的访问、留下过快照"的情况下才做 diff 高亮；
    // 第一次打开某篇文章时，全篇对读者来说都是"新的"，没必要整篇标红。
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

    // 离开文章页面时（切后台 / 关闭 / 跳转走）才把这次的样子存为新的已读基准，
    // 这样即使中途刷新页面，本次的高亮和跳转按钮依然会保留。
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