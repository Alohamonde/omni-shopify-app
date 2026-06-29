import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import {
  getCrossSellRules,
  getOrCreateShopSettings,
  recordPopupEvent,
} from "../models/shop.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.public.appProxy(request);
  const shop = session?.shop;

  if (!shop) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  const [settings, crossSellRules] = await Promise.all([
    getOrCreateShopSettings(shop),
    productId ? getCrossSellRules(shop, productId) : Promise.resolve([]),
  ]);

  return json({
    popup: {
      enabled: settings.popupEnabled,
      title: settings.popupTitle,
      message: settings.popupMessage,
      buttonText: settings.popupButtonText,
      buttonUrl: settings.popupButtonUrl,
      delaySeconds: settings.popupDelaySeconds,
      bgColor: settings.popupBgColor,
      textColor: settings.popupTextColor,
    },
    crossSell: crossSellRules,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.public.appProxy(request);
  const shop = session?.shop;

  if (!shop) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const eventType = String(formData.get("eventType") ?? "");

  if (!["impression", "click", "dismiss"].includes(eventType)) {
    return json({ error: "Invalid event" }, { status: 400 });
  }

  await recordPopupEvent(shop, eventType);
  return json({ ok: true });
};
