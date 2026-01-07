"use client";

import { detectWallets } from "./wallet.js";

/**
 * Get wallet display information
 * @param {string} name - Wallet name
 * @param {Object} logoPaths - Object with wallet logo paths
 * @returns {Object} Wallet info with displayName and icon path
 */
function getWalletInfo(name, logoPaths = {}) {
  const walletInfo = {
    phantom: {
      displayName: "Phantom",
      icon: logoPaths.phantom || null,
    },
    solflare: {
      displayName: "Solflare",
      icon: logoPaths.solflare || null,
    },
    backpack: {
      displayName: "Backpack",
      icon: logoPaths.backpack || null,
    },
  };

  return walletInfo[name] || { displayName: name, icon: null };
}

/**
 * Show wallet selection modal
 * @param {Object} [logoPaths] - Object with wallet logo paths { phantom: "/path/to/phantom.png", solflare: "/path/to/solflare.svg", backpack: "/path/to/backpack.png" }
 * @returns Promise that resolves with selected wallet name or null if cancelled
 */
export function showWalletModal(logoPaths = {}) {
  return new Promise((resolve) => {
    const availableWallets = detectWallets();

    if (availableWallets.length === 0) {
      // No wallets detected, show error message
      const errorModal = createModal(
        "No Wallet Found",
        "Please install a Solana wallet extension (Phantom, Solflare, or Backpack) to continue.",
        [
          {
            text: "Close",
            action: () => {
              closeModal(errorModal);
              resolve(null);
            },
            primary: true,
          },
        ]
      );
      return;
    }

    // Create wallet options
    const walletOptions = availableWallets.map((wallet) => ({
      name: wallet,
      ...getWalletInfo(wallet, logoPaths),
      installed: true,
    }));

    // Create modal content
    const modal = createWalletSelectionModal(
      walletOptions,
      (selectedWallet) => {
        closeModal(modal);
        resolve(selectedWallet);
      }
    );

    // Handle cancel/close
    const cancelHandler = () => {
      closeModal(modal);
      resolve(null);
    };

    // Add cancel button if not already added
    const cancelBtn = modal.querySelector(".x404-modal-cancel");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", cancelHandler);
    }

    // Close on backdrop click
    const backdrop = modal.querySelector(".x404-modal-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) {
          cancelHandler();
        }
      });
    }
  });
}

/**
 * Create a wallet selection modal
 */
function createWalletSelectionModal(wallets, onSelect) {
  const modal = document.createElement("div");
  modal.className = "x404-modal";
  modal.innerHTML = `
    <div class="x404-modal-backdrop"></div>
    <div class="x404-modal-container">
      <div class="x404-modal-header">
        <h2 class="x404-modal-title">Connect Wallet</h2>
        <button class="x404-modal-close" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <div class="x404-modal-body">
        <p class="x404-modal-description">Select a wallet to connect to your account</p>
        <div class="x404-wallet-list">
          ${wallets
            .map(
              (wallet) => `
            <button class="x404-wallet-option" data-wallet="${wallet.name}">
              <div class="x404-wallet-icon-wrapper">
                ${
                  wallet.icon
                    ? `<img src="${wallet.icon}" alt="${wallet.displayName} icon" class="x404-wallet-icon" />`
                    : '<div class="x404-wallet-icon-placeholder">💼</div>'
                }
              </div>
              <span class="x404-wallet-name">${wallet.displayName}</span>
              ${
                wallet.installed
                  ? '<span class="x404-wallet-status"></span>'
                  : ""
              }
            </button>
          `
            )
            .join("")}
        </div>
      </div>
      <div class="x404-modal-footer">
        <button class="x404-modal-cancel">Cancel</button>
      </div>
    </div>
  `;

  // Add styles if not already added
  if (!document.getElementById("x404-modal-styles")) {
    addModalStyles();
  }

  // Apply dark mode class if system prefers dark
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    modal.classList.add('dark');
  }

  // Add event listeners
  wallets.forEach((wallet) => {
    const button = modal.querySelector(`[data-wallet="${wallet.name}"]`);
    if (button) {
      button.addEventListener("click", () => {
        onSelect(wallet.name);
      });
    }
  });

  const closeBtn = modal.querySelector(".x404-modal-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      closeModal(modal);
    });
  }

  document.body.appendChild(modal);
  return modal;
}

/**
 * Create a generic modal
 */
function createModal(title, content, buttons) {
  const modal = document.createElement("div");
  modal.className = "x404-modal";
  modal.innerHTML = `
    <div class="x404-modal-backdrop"></div>
    <div class="x404-modal-container">
      <div class="x404-modal-header">
        <h2 class="x404-modal-title">${title}</h2>
        <button class="x404-modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="x404-modal-body">
        <p class="x404-modal-description">${content}</p>
      </div>
      <div class="x404-modal-footer">
        ${buttons
          .map(
            (btn) => `
          <button class="x404-modal-button ${
            btn.primary ? "x404-modal-button-primary" : ""
          }">
            ${btn.text}
          </button>
        `
          )
          .join("")}
      </div>
    </div>
  `;

  // Add styles if not already added
  if (!document.getElementById("x404-modal-styles")) {
    addModalStyles();
  }

  // Apply dark mode class if system prefers dark
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    modal.classList.add('dark');
  }

  // Add event listeners
  buttons.forEach((btn, index) => {
    const button = modal.querySelectorAll(".x404-modal-button")[index];
    if (button) {
      button.addEventListener("click", btn.action);
    }
  });

  const closeBtn = modal.querySelector(".x404-modal-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      closeModal(modal);
    });
  }

  document.body.appendChild(modal);
  return modal;
}

/**
 * Close and remove modal
 */
function closeModal(modal) {
  modal.classList.add("x404-modal-closing");
  setTimeout(() => {
    if (modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  }, 200);
}

/**
 * Add modal styles to the document
 */
function addModalStyles() {
  const style = document.createElement("style");
  style.id = "x404-modal-styles";
  style.textContent = `
    :root {
      --x404-background: 0 0% 100%;
      --x404-foreground: 222.2 84% 4.9%;
      --x404-card: 0 0% 100%;
      --x404-card-foreground: 222.2 84% 4.9%;
      --x404-popover: 0 0% 100%;
      --x404-popover-foreground: 222.2 84% 4.9%;
      --x404-primary: 222.2 47.4% 11.2%;
      --x404-primary-foreground: 210 40% 98%;
      --x404-secondary: 210 40% 96.1%;
      --x404-secondary-foreground: 222.2 47.4% 11.2%;
      --x404-muted: 210 40% 96.1%;
      --x404-muted-foreground: 215.4 16.3% 46.9%;
      --x404-accent: 210 40% 96.1%;
      --x404-accent-foreground: 222.2 47.4% 11.2%;
      --x404-destructive: 0 84.2% 60.2%;
      --x404-destructive-foreground: 210 40% 98%;
      --x404-border: 214.3 31.8% 91.4%;
      --x404-input: 214.3 31.8% 91.4%;
      --x404-ring: 222.2 84% 4.9%;
      --x404-radius: 0.5rem;
    }

    .dark {
      --x404-background: 222.2 84% 4.9%;
      --x404-foreground: 210 40% 98%;
      --x404-card: 222.2 84% 4.9%;
      --x404-card-foreground: 210 40% 98%;
      --x404-popover: 222.2 84% 4.9%;
      --x404-popover-foreground: 210 40% 98%;
      --x404-primary: 210 40% 98%;
      --x404-primary-foreground: 222.2 47.4% 11.2%;
      --x404-secondary: 217.2 32.6% 17.5%;
      --x404-secondary-foreground: 210 40% 98%;
      --x404-muted: 217.2 32.6% 17.5%;
      --x404-muted-foreground: 215 20.2% 65.1%;
      --x404-accent: 217.2 32.6% 17.5%;
      --x404-accent-foreground: 210 40% 98%;
      --x404-destructive: 0 62.8% 30.6%;
      --x404-destructive-foreground: 210 40% 98%;
      --x404-border: 217.2 32.6% 17.5%;
      --x404-input: 217.2 32.6% 17.5%;
      --x404-ring: 212.7 26.8% 83.9%;
    }

    .x404-modal {
      position: fixed;
      inset: 0;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      animation: x404-modalFadeIn 150ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .x404-modal-closing {
      animation: x404-modalFadeOut 150ms cubic-bezier(0.4, 0, 1, 1);
    }

    .x404-modal-backdrop {
      position: absolute;
      inset: 0;
      background-color: hsl(0 0% 0% / 0.5);
      backdrop-filter: blur(4px);
      animation: x404-backdropFadeIn 150ms ease-out;
    }

    .x404-modal-container {
      position: relative;
      z-index: 50;
      display: flex;
      max-height: calc(100vh - 2rem);
      width: 100%;
      max-width: 28rem;
      flex-direction: column;
      gap: 1rem;
      border: 1px solid hsl(var(--x404-border));
      background-color: hsl(var(--x404-background));
      padding: 0;
      box-shadow: 
        0 10px 15px -3px hsl(0 0% 0% / 0.1),
        0 4px 6px -4px hsl(0 0% 0% / 0.1);
      border-radius: calc(var(--x404-radius) + 0.25rem);
      animation: x404-modalSlideIn 200ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .x404-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid hsl(var(--x404-border));
    }

    .x404-modal-title {
      font-size: 1.125rem;
      font-weight: 600;
      line-height: 1;
      color: hsl(var(--x404-foreground));
      margin: 0;
    }

    .x404-modal-close {
      border-radius: calc(var(--x404-radius) - 2px);
      opacity: 0.7;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      width: 1.5rem;
      height: 1.5rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: hsl(var(--x404-muted-foreground));
      transition: opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1);
      outline: none;
    }

    .x404-modal-close:hover {
      opacity: 1;
    }

    .x404-modal-close:focus-visible {
      outline: 2px solid hsl(var(--x404-ring));
      outline-offset: 2px;
    }

    .x404-modal-body {
      padding: 1.5rem;
      overflow-y: auto;
    }

    .x404-modal-description {
      font-size: 0.875rem;
      color: hsl(var(--x404-muted-foreground));
      margin: 0 0 1rem 0;
    }

    .x404-wallet-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .x404-wallet-option {
      position: relative;
      display: flex;
      width: 100%;
      align-items: center;
      justify-content: flex-start;
      gap: 0.75rem;
      padding: 0.75rem;
      text-align: left;
      font-size: 0.875rem;
      font-weight: 500;
      color: hsl(var(--x404-foreground));
      border: 1px solid hsl(var(--x404-border));
      border-radius: calc(var(--x404-radius) - 2px);
      background-color: hsl(var(--x404-background));
      cursor: pointer;
      transition: background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
      outline: none;
    }

    .x404-wallet-option:hover {
      background-color: hsl(var(--x404-accent));
    }

    .x404-wallet-option:focus-visible {
      outline: 2px solid hsl(var(--x404-ring));
      outline-offset: 2px;
    }

    .x404-wallet-icon-wrapper {
      flex-shrink: 0;
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: calc(var(--x404-radius) - 2px);
      overflow: hidden;
    }

    .x404-wallet-icon {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .x404-wallet-icon-placeholder {
      font-size: 1.25rem;
      line-height: 1;
    }

    .x404-wallet-name {
      flex: 1;
      font-weight: 500;
      font-size: 0.875rem;
      line-height: 1.25rem;
      color: hsl(var(--x404-foreground));
      text-align: left;
    }

    .x404-wallet-status {
      flex-shrink: 0;
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background-color: hsl(142.1 76.2% 36.3%);
    }

    .x404-modal-footer {
      display: flex;
      justify-content: flex-end;
      padding: 1rem 1.5rem 1.5rem;
      border-top: 1px solid hsl(var(--x404-border));
    }

    .x404-modal-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      border-radius: calc(var(--x404-radius) - 2px);
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      outline: none;
      border: 1px solid hsl(var(--x404-input));
      background-color: hsl(var(--x404-background));
      color: hsl(var(--x404-foreground));
      padding: 0.5rem 1rem;
      height: 2.25rem;
    }

    .x404-modal-button:hover {
      background-color: hsl(var(--x404-accent));
      color: hsl(var(--x404-accent-foreground));
    }

    .x404-modal-button:focus-visible {
      outline: 2px solid hsl(var(--x404-ring));
      outline-offset: 2px;
    }

    .x404-modal-button:disabled {
      pointer-events: none;
      opacity: 0.5;
    }

    .x404-modal-button-primary {
      background-color: hsl(var(--x404-primary));
      color: hsl(var(--x404-primary-foreground));
      border-color: hsl(var(--x404-primary));
    }

    .x404-modal-button-primary:hover {
      background-color: hsl(var(--x404-primary) / 0.9);
    }

    .x404-modal-cancel {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      border-radius: calc(var(--x404-radius) - 2px);
      font-size: 0.875rem;
      font-weight: 500;
      transition: background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      outline: none;
      border: 1px solid hsl(var(--x404-input));
      background-color: hsl(var(--x404-background));
      color: hsl(var(--x404-foreground));
      padding: 0.5rem 1rem;
      height: 2.25rem;
    }

    .x404-modal-cancel:hover {
      background-color: hsl(var(--x404-accent));
    }

    .x404-modal-cancel:focus-visible {
      outline: 2px solid hsl(var(--x404-ring));
      outline-offset: 2px;
    }

    @keyframes x404-modalFadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes x404-backdropFadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes x404-modalSlideIn {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(-0.5rem);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    @keyframes x404-modalFadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }

    .x404-modal.dark {
      --x404-background: 222.2 84% 4.9%;
      --x404-foreground: 210 40% 98%;
      --x404-card: 222.2 84% 4.9%;
      --x404-card-foreground: 210 40% 98%;
      --x404-popover: 222.2 84% 4.9%;
      --x404-popover-foreground: 210 40% 98%;
      --x404-primary: 210 40% 98%;
      --x404-primary-foreground: 222.2 47.4% 11.2%;
      --x404-secondary: 217.2 32.6% 17.5%;
      --x404-secondary-foreground: 210 40% 98%;
      --x404-muted: 217.2 32.6% 17.5%;
      --x404-muted-foreground: 215 20.2% 65.1%;
      --x404-accent: 217.2 32.6% 17.5%;
      --x404-accent-foreground: 210 40% 98%;
      --x404-destructive: 0 62.8% 30.6%;
      --x404-destructive-foreground: 210 40% 98%;
      --x404-border: 217.2 32.6% 17.5%;
      --x404-input: 217.2 32.6% 17.5%;
      --x404-ring: 212.7 26.8% 83.9%;
    }

    @media (prefers-color-scheme: dark) {
      .x404-modal:not(.x404-modal.dark) {
        --x404-background: 222.2 84% 4.9%;
        --x404-foreground: 210 40% 98%;
        --x404-card: 222.2 84% 4.9%;
        --x404-card-foreground: 210 40% 98%;
        --x404-popover: 222.2 84% 4.9%;
        --x404-popover-foreground: 210 40% 98%;
        --x404-primary: 210 40% 98%;
        --x404-primary-foreground: 222.2 47.4% 11.2%;
        --x404-secondary: 217.2 32.6% 17.5%;
        --x404-secondary-foreground: 210 40% 98%;
        --x404-muted: 217.2 32.6% 17.5%;
        --x404-muted-foreground: 215 20.2% 65.1%;
        --x404-accent: 217.2 32.6% 17.5%;
        --x404-accent-foreground: 210 40% 98%;
        --x404-destructive: 0 62.8% 30.6%;
        --x404-destructive-foreground: 210 40% 98%;
        --x404-border: 217.2 32.6% 17.5%;
        --x404-input: 217.2 32.6% 17.5%;
        --x404-ring: 212.7 26.8% 83.9%;
      }
    }

    @media (max-width: 640px) {
      .x404-modal {
        padding: 0;
        align-items: flex-end;
      }

      .x404-modal-container {
        max-width: 100%;
        border-radius: 1rem 1rem 0 0;
        margin-top: auto;
        max-height: calc(100vh - 2rem);
      }

      .x404-modal-header,
      .x404-modal-body,
      .x404-modal-footer {
        padding-left: 1rem;
        padding-right: 1rem;
      }
    }
  `;
  document.head.appendChild(style);
}
