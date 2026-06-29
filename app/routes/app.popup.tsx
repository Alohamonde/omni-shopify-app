import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Checkbox,
  Button,
  BlockStack,
  Text,
  InlineStack,
  Banner,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { useCallback, useEffect, useState } from "react";
import { authenticate } from "../shopify.server";
import {
  getOrCreateShopSettings,
  getPopupStats,
  updateShopSettings,
} from "../models/shop.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const [settings, stats] = await Promise.all([
    getOrCreateShopSettings(shop),
    getPopupStats(shop),
  ]);

  return json({ settings, stats });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  await updateShopSettings(session.shop, {
    popupEnabled: formData.get("popupEnabled") === "true",
    popupTitle: String(formData.get("popupTitle") ?? ""),
    popupMessage: String(formData.get("popupMessage") ?? ""),
    popupButtonText: String(formData.get("popupButtonText") ?? ""),
    popupButtonUrl: String(formData.get("popupButtonUrl") ?? ""),
    popupDelaySeconds: Number(formData.get("popupDelaySeconds") ?? 3),
    popupBgColor: String(formData.get("popupBgColor") ?? "#111827"),
    popupTextColor: String(formData.get("popupTextColor") ?? "#ffffff"),
  });

  return json({ ok: true });
};

export default function PopupSettingsPage() {
  const { settings, stats } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  const [form, setForm] = useState({
    popupEnabled: settings.popupEnabled,
    popupTitle: settings.popupTitle,
    popupMessage: settings.popupMessage,
    popupButtonText: settings.popupButtonText,
    popupButtonUrl: settings.popupButtonUrl,
    popupDelaySeconds: String(settings.popupDelaySeconds),
    popupBgColor: settings.popupBgColor,
    popupTextColor: settings.popupTextColor,
  });

  const setField = useCallback(
    (key: keyof typeof form) => (value: string | boolean) => {
      setForm((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const save = useCallback(() => {
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      payload.append(key, String(value));
    });
    fetcher.submit(payload, { method: "POST" });
  }, [fetcher, form]);

  useEffect(() => {
    if (fetcher.data?.ok) {
      shopify.toast.show("弹窗设置已保存");
    }
  }, [fetcher.data]);

  return (
    <Page
      title="促销弹窗"
      subtitle="在店面展示促销弹窗，并查看展示与点击数据"
      primaryAction={{ content: "保存设置", onAction: save, loading: fetcher.state !== "idle" }}
    >
      <TitleBar title="促销弹窗" />
      <BlockStack gap="500">
        <Banner tone="info">
          <p>
            保存后，请在主题编辑器的 App embeds 中启用 <strong>Promo Popup</strong>，弹窗才会显示在店面。
          </p>
        </Banner>

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Checkbox
                  label="启用促销弹窗"
                  checked={form.popupEnabled}
                  onChange={(checked) => setField("popupEnabled")(checked)}
                />
                <FormLayout>
                  <TextField
                    label="标题"
                    value={form.popupTitle}
                    onChange={setField("popupTitle")}
                    autoComplete="off"
                  />
                  <TextField
                    label="正文"
                    value={form.popupMessage}
                    onChange={setField("popupMessage")}
                    multiline={3}
                    autoComplete="off"
                  />
                  <TextField
                    label="按钮文字"
                    value={form.popupButtonText}
                    onChange={setField("popupButtonText")}
                    autoComplete="off"
                  />
                  <TextField
                    label="按钮链接"
                    value={form.popupButtonUrl}
                    onChange={setField("popupButtonUrl")}
                    autoComplete="off"
                  />
                  <TextField
                    label="延迟显示（秒）"
                    type="number"
                    value={form.popupDelaySeconds}
                    onChange={setField("popupDelaySeconds")}
                    autoComplete="off"
                  />
                  <InlineStack gap="300">
                    <TextField
                      label="背景色"
                      value={form.popupBgColor}
                      onChange={setField("popupBgColor")}
                      autoComplete="off"
                    />
                    <TextField
                      label="文字色"
                      value={form.popupTextColor}
                      onChange={setField("popupTextColor")}
                      autoComplete="off"
                    />
                  </InlineStack>
                </FormLayout>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  数据看板
                </Text>
                <Text as="p">展示：{stats.impressions}</Text>
                <Text as="p">点击：{stats.clicks}</Text>
                <Text as="p">关闭：{stats.dismisses}</Text>
                <Text as="p">点击率：{stats.ctr}%</Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
