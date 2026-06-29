import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  InlineGrid,
  Button,
  Badge,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getCrossSellRules, getPopupStats, getOrCreateShopSettings } from "../models/shop.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const [settings, stats, rules] = await Promise.all([
    getOrCreateShopSettings(shop),
    getPopupStats(shop),
    getCrossSellRules(shop),
  ]);

  return json({
    popupEnabled: settings.popupEnabled,
    stats,
    ruleCount: rules.length,
  });
};

export default function Index() {
  const { popupEnabled, stats, ruleCount } = useLoaderData<typeof loader>();

  return (
    <Page title="Omni Store Toolkit" subtitle="店铺增长工具箱：弹窗、批量编辑、关联销售">
      <TitleBar title="Omni Store Toolkit" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">
                    模块一 · 促销弹窗
                  </Text>
                  <Badge tone={popupEnabled ? "success" : "attention"}>
                    {popupEnabled ? "已启用" : "未启用"}
                  </Badge>
                  <Text as="p">
                    在店面展示促销弹窗，吸引顾客点击；后台可查看展示次数、点击量与点击率。
                  </Text>
                  <Text as="p">展示 {stats.impressions} 次 · 点击 {stats.clicks} 次 · 点击率 {stats.ctr}%</Text>
                  <Button url="/app/popup">去配置</Button>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">
                    模块二 · 批量编辑
                  </Text>
                  <Text as="p">
                    一次勾选多个商品，批量追加标签或统一调整价格；商品较多时可分页加载。
                  </Text>
                  <Button url="/app/bulk-editor">打开编辑器</Button>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">
                    模块三 · 关联销售
                  </Text>
                  <Text as="p">
                    为商品设置「经常一起购买」推荐，顾客可在商品页一键加购。
                  </Text>
                  <Text as="p">当前规则：{ruleCount} 条</Text>
                  <Button url="/app/cross-sell">管理规则</Button>
                </BlockStack>
              </Card>
            </InlineGrid>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  店面启用说明
                </Text>
                <Text as="p">
                  弹窗与关联销售需在主题编辑器中启用：App embeds 打开 <strong>Promo Popup</strong>，
                  商品页添加 <strong>Cross Sell</strong> 区块。弹窗与关联规则请在本 App 对应页面配置。
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
