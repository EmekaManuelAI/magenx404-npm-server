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
        <h2 class="x404-modal-title">Select Wallet</h2>
        <button class="x404-modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="x404-modal-body">
        <p class="x404-modal-description">Choose a wallet to verify your authentication:</p>
        <div class="x404-wallet-list">
          ${wallets
            .map(
              (wallet) => `
            <button class="x404-wallet-option" data-wallet="${wallet.name}">
              ${
                wallet.icon
                  ? `<img src="${wallet.icon}" alt="${wallet.displayName} icon" class="x404-wallet-icon" />`
                  : '<span class="x404-wallet-icon">💼</span>'
              }
              <span class="x404-wallet-name">${wallet.displayName}</span>
              ${
                wallet.installed
                  ? '<span class="x404-wallet-badge">Installed</span>'
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
    .x404-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: x404-fadeIn 0.2s ease-out;
    }

    .x404-modal-closing {
      animation: x404-fadeOut 0.2s ease-out;
    }

    .x404-modal-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
    }

    .x404-modal-container {
      position: relative;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      max-width: 480px;
      width: 90%;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      z-index: 1;
    }

    .x404-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .x404-modal-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #111827;
    }

    .x404-modal-close {
      background: none;
      border: none;
      font-size: 24px;
      color: #6b7280;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .x404-modal-close:hover {
      background: #f3f4f6;
      color: #111827;
    }

    .x404-modal-body {
      padding: 24px;
      overflow-y: auto;
    }

    .x404-modal-description {
      margin: 0 0 20px 0;
      color: #6b7280;
      font-size: 14px;
    }

    .x404-wallet-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .x404-wallet-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
      width: 100%;
      font-size: 16px;
    }

    .x404-wallet-option:hover {
      border-color: #3b82f6;
      background: #eff6ff;
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .x404-wallet-icon {
      width: 32px;
      height: 32px;
      object-fit: contain;
      border-radius: 6px;
    }
    
    .x404-wallet-icon:not(img) {
      font-size: 24px;
    }

    .x404-wallet-name {
      flex: 1;
      font-weight: 500;
      color: #111827;
    }

    .x404-wallet-badge {
      font-size: 12px;
      padding: 4px 8px;
      background: #10b981;
      color: white;
      border-radius: 4px;
      font-weight: 500;
    }

    .x404-modal-footer {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding: 20px 24px;
      border-top: 1px solid #e5e7eb;
    }

    .x404-modal-button {
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid #e5e7eb;
      background: white;
      color: #374151;
    }

    .x404-modal-button:hover {
      background: #f9fafb;
    }

    .x404-modal-button-primary {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .x404-modal-button-primary:hover {
      background: #2563eb;
    }

    .x404-modal-cancel {
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid #e5e7eb;
      background: white;
      color: #374151;
    }

    .x404-modal-cancel:hover {
      background: #f9fafb;
    }

    @keyframes x404-fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes x404-fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }

    @media (prefers-color-scheme: dark) {
      .x404-modal-container {
        background: #1f2937;
        color: #f9fafb;
      }

      .x404-modal-title {
        color: #f9fafb;
      }

      .x404-modal-close {
        color: #9ca3af;
      }

      .x404-modal-close:hover {
        background: #374151;
        color: #f9fafb;
      }

      .x404-modal-header,
      .x404-modal-footer {
        border-color: #374151;
      }

      .x404-modal-description {
        color: #9ca3af;
      }

      .x404-wallet-option {
        background: #374151;
        border-color: #4b5563;
        color: #f9fafb;
      }

      .x404-wallet-option:hover {
        background: #4b5563;
        border-color: #3b82f6;
      }

      .x404-wallet-name {
        color: #f9fafb;
      }

      .x404-modal-button,
      .x404-modal-cancel {
        background: #374151;
        border-color: #4b5563;
        color: #f9fafb;
      }

      .x404-modal-button:hover,
      .x404-modal-cancel:hover {
        background: #4b5563;
      }
    }
  `;
  document.head.appendChild(style);
}
