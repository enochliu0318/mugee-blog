(function () {
  "use strict";

  const STORAGE_KEY = "mugee-vault-unlock";
  const REMEMBER_MS = 7 * 24 * 60 * 60 * 1000;

  async function hashPassword(password) {
    const data = new TextEncoder().encode(password);
    const buffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function readUnlockState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const state = JSON.parse(raw);
      if (!state || !state.expiresAt || Date.now() > state.expiresAt) {
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return state;
    } catch {
      return null;
    }
  }

  function writeUnlockState(remember, sessionHours) {
    const expiresAt = remember
      ? Date.now() + REMEMBER_MS
      : Date.now() + sessionHours * 60 * 60 * 1000;
    const state = JSON.stringify({ expiresAt });
    sessionStorage.setItem(STORAGE_KEY, state);
    if (remember) {
      localStorage.setItem(STORAGE_KEY, state);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function clearUnlockState() {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  }

  function unlockShell(shell) {
    const gate = shell.querySelector("#vault-gate");
    const body = shell.querySelector("#vault-body");
    if (gate) gate.hidden = true;
    if (body) {
      body.hidden = false;
      body.removeAttribute("aria-hidden");
    }
  }

  function lockShell(shell) {
    const gate = shell.querySelector("#vault-gate");
    const body = shell.querySelector("#vault-body");
    if (gate) gate.hidden = false;
    if (body) {
      body.hidden = true;
      body.setAttribute("aria-hidden", "true");
    }
    const input = shell.querySelector("#vault-password");
    if (input) input.value = "";
    const error = shell.querySelector("#vault-error");
    if (error) error.hidden = true;
  }

  function initShell(shell) {
    const expectedHash = shell.dataset.vaultHash;
    const sessionHours = Number(shell.dataset.vaultSessionHours || 24);
    const form = shell.querySelector("#vault-form");
    const remember = shell.querySelector("#vault-remember");
    const error = shell.querySelector("#vault-error");
    const lockBtn = shell.querySelector("#vault-lock-btn");

    if (!expectedHash || expectedHash === "CHANGE_ME") {
      const desc = shell.querySelector(".vault-gate-desc");
      if (desc) {
        desc.textContent = "保险箱尚未配置密码，请在 hugo.toml 的 [params.vault] 中设置 passwordHash。";
      }
      return;
    }

    if (readUnlockState()) {
      unlockShell(shell);
    }

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = shell.querySelector("#vault-password");
      const password = input?.value || "";
      const digest = await hashPassword(password);

      if (digest === expectedHash) {
        writeUnlockState(Boolean(remember?.checked), sessionHours);
        unlockShell(shell);
        if (error) error.hidden = true;
        return;
      }

      if (error) error.hidden = false;
      input?.focus();
      input?.select();
    });

    lockBtn?.addEventListener("click", () => {
      clearUnlockState();
      lockShell(shell);
      shell.querySelector("#vault-password")?.focus();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-vault='true']").forEach(initShell);
  });
})();
