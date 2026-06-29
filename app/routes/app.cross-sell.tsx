import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Button,
  BlockStack,
  Text,
  Banner,
  ResourceList,
  ResourceItem,
  Thumbnail,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { useCallback, useEffect, useState } from "react";
import { authenticate } from "../shopify.server";
import {
  createCrossSellRule,
  deleteCrossSellRule,
  getCrossSellRules,
} from "../models/shop.server";
import { searchProducts } from "../models/products.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const rules = await getCrossSellRules(session.shop);

  return json({ rules });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent"));

  if (intent === "search") {
    const query = String(formData.get("query") ?? "");
    const products = await searchProducts(admin, query);
    return json({ products });
  }

  if (intent === "create") {
    await createCrossSellRule(session.shop, {
      sourceProductId: String(formData.get("sourceProductId")),
      sourceProductTitle: String(formData.get("sourceProductTitle")),
      recommendedProductId: String(formData.get("recommendedProductId")),
      recommendedProductTitle: String(formData.get("recommendedProductTitle")),
      recommendedVariantId: String(formData.get("recommendedVariantId")),
      discountPercent: Number(formData.get("discountPercent") ?? 0),
    });
    return json({ ok: true, message: "关联规则已创建" });
  }

  if (intent === "delete") {
    await deleteCrossSellRule(session.shop, String(formData.get("id")));
    return json({ ok: true, message: "规则已删除" });
  }

  return json({ ok: false }, { status: 400 });
};

type SearchProduct = {
  id: string;
  title: string;
  imageUrl: string;
  variantId: string;
  price: string;
};

export default function CrossSellPage() {
  const { rules } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const searchFetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  const [sourceQuery, setSourceQuery] = useState("");
  const [recommendedQuery, setRecommendedQuery] = useState("");
  const [sourceProduct, setSourceProduct] = useState<SearchProduct | null>(null);
  const [recommendedProduct, setRecommendedProduct] =
    useState<SearchProduct | null>(null);
  const [discountPercent, setDiscountPercent] = useState("10");

  const search = useCallback(
    (field: "source" | "recommended") => {
      const query = field === "source" ? sourceQuery : recommendedQuery;
      const payload = new FormData();
      payload.append("intent", "search");
      payload.append("query", query);
      payload.append("field", field);
      searchFetcher.submit(payload, { method: "POST" });
    },
    [recommendedQuery, searchFetcher, sourceQuery],
  );

  const createRule = useCallback(() => {
    if (!sourceProduct || !recommendedProduct) return;

    const payload = new FormData();
    payload.append("intent", "create");
    payload.append("sourceProductId", sourceProduct.id);
    payload.append("sourceProductTitle", sourceProduct.title);
    payload.append("recommendedProductId", recommendedProduct.id);
    payload.append("recommendedProductTitle", recommendedProduct.title);
    payload.append("recommendedVariantId", recommendedProduct.variantId);
    payload.append("discountPercent", discountPercent);
    fetcher.submit(payload, { method: "POST" });
  }, [discountPercent, fetcher, recommendedProduct, sourceProduct]);

  const products = (searchFetcher.data?.products ?? []) as SearchProduct[];
  const searchField = String(searchFetcher.formData?.get("field") ?? "");

  useEffect(() => {
    if (fetcher.data?.message) {
      shopify.toast.show(fetcher.data.message);
    }
  }, [fetcher.data]);

  return (
    <Page
      title="关联销售"
      subtitle="设置「经常一起购买」推荐商品"
    >
      <TitleBar title="关联销售" />
      <BlockStack gap="500">
        <Banner tone="info">
          <p>
            配置主商品与推荐商品后，请在商品页模板中添加 <strong>Cross Sell</strong> 区块，
            顾客即可在商品页一键将推荐商品加入购物车。
          </p>
        </Banner>

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  新建关联规则
                </Text>
                <FormLayout>
                  <InlineStack gap="300" blockAlign="end">
                    <div style={{ flex: 1 }}>
                      <TextField
                        label="主商品搜索"
                        value={sourceQuery}
                        onChange={setSourceQuery}
                        autoComplete="off"
                      />
                    </div>
                    <Button onClick={() => search("source")}>搜索</Button>
                  </InlineStack>
                  {searchField === "source" && products.length > 0 && (
                    <ResourceList
                      items={products}
                      renderItem={(item) => (
                        <ResourceItem
                          id={item.id}
                          media={
                            <Thumbnail
                              source={item.imageUrl || ""}
                              alt={item.title}
                            />
                          }
                          onClick={() => setSourceProduct(item)}
                        >
                          <Text as="span">{item.title}</Text>
                        </ResourceItem>
                      )}
                    />
                  )}
                  {sourceProduct && (
                    <Text as="p">已选主商品：{sourceProduct.title}</Text>
                  )}

                  <InlineStack gap="300" blockAlign="end">
                    <div style={{ flex: 1 }}>
                      <TextField
                        label="推荐商品搜索"
                        value={recommendedQuery}
                        onChange={setRecommendedQuery}
                        autoComplete="off"
                      />
                    </div>
                    <Button onClick={() => search("recommended")}>搜索</Button>
                  </InlineStack>
                  {searchField === "recommended" && products.length > 0 && (
                    <ResourceList
                      items={products}
                      renderItem={(item) => (
                        <ResourceItem
                          id={item.id}
                          media={
                            <Thumbnail
                              source={item.imageUrl || ""}
                              alt={item.title}
                            />
                          }
                          onClick={() => setRecommendedProduct(item)}
                        >
                          <Text as="span">{item.title}</Text>
                        </ResourceItem>
                      )}
                    />
                  )}
                  {recommendedProduct && (
                    <Text as="p">已选推荐商品：{recommendedProduct.title}</Text>
                  )}

                  <TextField
                    label="组合折扣 (%)"
                    type="number"
                    value={discountPercent}
                    onChange={setDiscountPercent}
                    autoComplete="off"
                  />
                </FormLayout>

                <Button
                  variant="primary"
                  disabled={!sourceProduct || !recommendedProduct}
                  loading={fetcher.state !== "idle"}
                  onClick={createRule}
                >
                  保存规则
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  已有规则
                </Text>
                {rules.length === 0 ? (
                  <Text as="p">暂无规则</Text>
                ) : (
                  rules.map((rule) => (
                    <BlockStack key={rule.id} gap="100">
                      <Text as="p" variant="bodyMd">
                        {rule.sourceProductTitle} → {rule.recommendedProductTitle}
                      </Text>
                      <Text as="p" tone="subdued">
                        折扣 {rule.discountPercent}%
                      </Text>
                      <Button
                        tone="critical"
                        onClick={() =>
                          fetcher.submit(
                            { intent: "delete", id: rule.id },
                            { method: "POST" },
                          )
                        }
                      >
                        删除
                      </Button>
                    </BlockStack>
                  ))
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
