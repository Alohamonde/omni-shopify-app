(() => {
  const PROXY_BASE = "/apps/omni/config";

  function toNumericId(gidOrId) {
    if (!gidOrId) return "";
    const value = String(gidOrId);
    return value.includes("/") ? value.split("/").pop() : value;
  }

  async function addToCart(variantId) {
    const response = await fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: toNumericId(variantId), quantity: 1 }),
    });

    if (!response.ok) {
      throw new Error("Failed to add to cart");
    }

    return response.json();
  }

  async function refreshCartDrawer() {
    document.dispatchEvent(new CustomEvent("cart:refresh"));
  }

  function renderBlock(root, heading, rules) {
    if (!rules.length) {
      root.innerHTML = "";
      return;
    }

    const list = document.createElement("div");
    list.className = "omni-cross-sell-list";

    rules.forEach((rule) => {
      const item = document.createElement("div");
      item.className = "omni-cross-sell-item";
      item.innerHTML = `
        <div>
          <strong>${rule.recommendedProductTitle}</strong>
          <p>组合省 ${rule.discountPercent}%</p>
        </div>
        <button type="button" data-variant="${rule.recommendedVariantId || ""}">
          加入购物车
        </button>
      `;

      item.querySelector("button")?.addEventListener("click", async (event) => {
        const button = event.currentTarget;
        const variantId = button.getAttribute("data-variant");
        if (!variantId) {
          alert("推荐商品缺少 variant，请在后台重新配置。");
          return;
        }

        button.disabled = true;
        button.textContent = "添加中...";

        try {
          await addToCart(variantId);
          button.textContent = "已加入";
          await refreshCartDrawer();
        } catch (error) {
          button.disabled = false;
          button.textContent = "重试";
        }
      });

      list.appendChild(item);
    });

    root.innerHTML = `<h3 class="omni-cross-sell-heading">${heading}</h3>`;
    root.appendChild(list);
  }

  async function init() {
    const root = document.getElementById("omni-cross-sell-root");
    if (!root) return;

    const productId = root.dataset.productId;
    const heading =
      root.closest("[data-block-id]")?.querySelector("h3")?.textContent ||
      "经常一起购买";

    const response = await fetch(
      `${PROXY_BASE}?productId=${encodeURIComponent(`gid://shopify/Product/${productId}`)}`,
    );

    if (!response.ok) return;

    const data = await response.json();
    renderBlock(root, heading, data.crossSell || []);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
