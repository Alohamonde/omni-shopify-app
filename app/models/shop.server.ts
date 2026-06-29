import prisma from "../db.server";

export async function getOrCreateShopSettings(shop: string) {
  return prisma.shopSettings.upsert({
    where: { shop },
    update: {},
    create: { shop },
  });
}

export async function updateShopSettings(
  shop: string,
  data: {
    popupEnabled?: boolean;
    popupTitle?: string;
    popupMessage?: string;
    popupButtonText?: string;
    popupButtonUrl?: string;
    popupDelaySeconds?: number;
    popupBgColor?: string;
    popupTextColor?: string;
  },
) {
  await getOrCreateShopSettings(shop);
  return prisma.shopSettings.update({
    where: { shop },
    data,
  });
}

export async function getCrossSellRules(shop: string, sourceProductId?: string) {
  return prisma.crossSellRule.findMany({
    where: {
      shop,
      enabled: true,
      ...(sourceProductId ? { sourceProductId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCrossSellRule(
  shop: string,
  data: {
    sourceProductId: string;
    sourceProductTitle: string;
    recommendedProductId: string;
    recommendedProductTitle: string;
    recommendedVariantId: string;
    discountPercent?: number;
  },
) {
  return prisma.crossSellRule.create({ data: { shop, ...data } });
}

export async function deleteCrossSellRule(shop: string, id: string) {
  return prisma.crossSellRule.deleteMany({
    where: { id, shop },
  });
}

export async function recordPopupEvent(shop: string, eventType: string) {
  return prisma.popupEvent.create({
    data: { shop, eventType },
  });
}

export async function getPopupStats(shop: string) {
  const [impressions, clicks, dismisses] = await Promise.all([
    prisma.popupEvent.count({ where: { shop, eventType: "impression" } }),
    prisma.popupEvent.count({ where: { shop, eventType: "click" } }),
    prisma.popupEvent.count({ where: { shop, eventType: "dismiss" } }),
  ]);

  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : "0.0";

  return { impressions, clicks, dismisses, ctr };
}
