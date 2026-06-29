(() => {
  const PROXY_BASE = "/apps/omni/config";
  const STORAGE_KEY = "omni_popup_dismissed";

  async function fetchConfig() {
    const response = await fetch(PROXY_BASE);
    if (!response.ok) return null;
    const data = await response.json();
    return data.popup;
  }

  async function trackEvent(eventType) {
    const body = new FormData();
    body.append("eventType", eventType);
    await fetch(PROXY_BASE, { method: "POST", body });
  }

  function renderPopup(config) {
    if (!config?.enabled || sessionStorage.getItem(STORAGE_KEY)) return;

    const overlay = document.createElement("div");
    overlay.className = "omni-popup-overlay";

    const card = document.createElement("div");
    card.className = "omni-popup-card";
    card.style.background = config.bgColor;
    card.style.color = config.textColor;

    card.innerHTML = `
      <button class="omni-popup-close" aria-label="Close">&times;</button>
      <h3>${config.title}</h3>
      <p>${config.message}</p>
      <a class="omni-popup-button" href="${config.buttonUrl}">${config.buttonText}</a>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const close = () => {
      sessionStorage.setItem(STORAGE_KEY, "1");
      overlay.remove();
      trackEvent("dismiss");
    };

    card.querySelector(".omni-popup-close")?.addEventListener("click", close);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });
    card.querySelector(".omni-popup-button")?.addEventListener("click", () => {
      trackEvent("click");
    });

    trackEvent("impression");
  }

  async function init() {
    const config = await fetchConfig();
    if (!config?.enabled) return;

    const delay = Number(config.delaySeconds || 3) * 1000;
    window.setTimeout(() => renderPopup(config), delay);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
