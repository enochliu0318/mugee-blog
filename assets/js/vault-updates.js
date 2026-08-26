(function () {
  "use strict";

  // 所有"你上次看到某篇保险箱文章时的样子"都存在这个 key 下面，
  // 结构：{ "<page-path>": { fullHash, blockHashes: [...], seenAt } }
  const STORAGE_KEY = "mugee-vault-seen";

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

    const seenMap = readSeenMap();

    list.querySelectorAll("[data-vault-path]").forEach((item) => {
      const path = item.dataset.vaultPath;
      const currentHash = item.dataset.vaultHash;
      const dot = item.querySelector("[data-vault-update-dot]");
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
   * 2. 文章页：按"天"分段做 diff，高亮改动、给出跳转按钮，
   *    并在离开页面时把这次的样子存为新的"已读基准"。
   * ---------------------------------------------------------------- */

  // 把正文按二级/三级标题（对应日记里的"### 2026年X月X日"）切成若干段，
  // 没有小标题的文章（比如非日记体的保险箱文章）整体作为一段处理。
  function splitIntoBlocks(container) {
    const blocks = [];
    let current = null;

    Array.from(container.children).forEach((el) => {
      const isHeading = el.tagName === "H2" || el.tagName === "H3";
      if (isHeading || !current) {
        current = { nodes: [] };
        blocks.push(current);
      }
      current.nodes.push(el);
    });

    return blocks;
  }

  function blockText(block) {
    return block.nodes.map((n) => n.textContent || "").join("\n").trim();
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

  function wrapBlockAsChanged(block) {
    const first = block.nodes[0];
    if (!first || !first.parentNode) return null;

    const wrapper = document.createElement("div");
    wrapper.className = "vault-diff-block vault-diff-new";

    first.parentNode.insertBefore(wrapper, first);
    block.nodes.forEach((node) => wrapper.appendChild(node));

    return wrapper;
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

    const blocks = splitIntoBlocks(container);
    const currentBlockHashes = blocks.map((b) => fnv1aHash(blockText(b)));

    // 只有"之前真的访问、留下过快照"的情况下才做 diff 高亮；
    // 第一次打开某篇文章时，全篇对读者来说都是"新的"，没必要整篇标红。
    if (previous && Array.isArray(previous.blockHashes)) {
      const changedIndexes = diffBlockHashes(
        previous.blockHashes,
        currentBlockHashes
      );

      if (changedIndexes.length) {
        const targets = changedIndexes
          .map((idx) => wrapBlockAsChanged(blocks[idx]))
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