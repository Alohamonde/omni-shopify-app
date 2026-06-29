import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData, useSearchParams } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  DataTable,
  TextField,
  Button,
  BlockStack,
  Text,
  Banner,
  Checkbox,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { authenticate } from "../shopify.server";
import {
  bulkUpdateProductTags,
  bulkUpdateVariantPrices,
  fetchProducts,
  type ProductRow,
} from "../models/products.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const after = url.searchParams.get("after") ?? undefined;
  const { products, pageInfo } = await fetchProducts(admin, 25, after);

  return json({ products, pageInfo });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent"));
  const payload = JSON.parse(String(formData.get("payload") ?? "[]"));

  if (intent === "update-tags") {
    const results = await bulkUpdateProductTags(admin, payload);
    return json({ ok: true, results, message: `已更新 ${payload.length} 个商品标签` });
  }

  if (intent === "update-prices") {
    const results = await bulkUpdateVariantPrices(admin, payload);
    return json({ ok: true, results, message: `已更新 ${payload.length} 个商品价格` });
  }

  return json({ ok: false, message: "未知操作" }, { status: 400 });
};

export default function BulkEditorPage() {
  const { products, pageInfo } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  const [, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [tagSuffix, setTagSuffix] = useState("omni-bulk");
  const [priceDelta, setPriceDelta] = useState("5");

  const selectedProducts = useMemo(
    () => products.filter((product) => selected[product.id]),
    [products, selected],
  );

  const toggleAll = useCallback(
    (checked: boolean) => {
      const next: Record<string, boolean> = {};
      if (checked) {
        products.forEach((product) => {
          next[product.id] = true;
        });
      }
      setSelected(next);
    },
    [products],
  );

  const bulkAddTag = useCallback(() => {
    const payload = selectedProducts.map((product) => ({
      id: product.id,
      tags: Array.from(new Set([...product.tags, tagSuffix])),
    }));

    fetcher.submit(
      { intent: "update-tags", payload: JSON.stringify(payload) },
      { method: "POST" },
    );
  }, [fetcher, selectedProducts, tagSuffix]);

  const bulkIncreasePrice = useCallback(() => {
    const delta = Number(priceDelta);
    const payload = selectedProducts
      .filter((product) => product.variantId)
      .map((product) => ({
        productId: product.id,
        variantId: product.variantId,
        price: (Number(product.price) + delta).toFixed(2),
      }));

    fetcher.submit(
      { intent: "update-prices", payload: JSON.stringify(payload) },
      { method: "POST" },
    );
  }, [fetcher, priceDelta, selectedProducts]);

  useEffect(() => {
    if (fetcher.data?.message) {
      shopify.toast.show(fetcher.data.message);
    }
  }, [fetcher.data]);

  const rows = products.map((product: ProductRow) => [
    <Checkbox
      key={`check-${product.id}`}
      label=""
      labelHidden
      checked={Boolean(selected[product.id])}
      onChange={(checked) =>
        setSelected((current) => ({ ...current, [product.id]: checked }))
      }
    />,
    product.title,
    product.status,
    product.tags.join(", ") || "-",
    `$${product.price}`,
  ]);

  return (
    <Page
      title="批量商品编辑"
      subtitle="批量修改商品标签与价格"
    >
      <TitleBar title="批量商品编辑" />
      <BlockStack gap="500">
        <Banner tone="info">
          <p>勾选商品后，可批量追加标签或统一上调价格。商品列表支持分页，点击「加载更多」查看下一批。</p>
        </Banner>

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack gap="300" align="start">
                  <Checkbox
                    label="全选当前页"
                    checked={
                      products.length > 0 &&
                      products.every((product) => selected[product.id])
                    }
                    onChange={toggleAll}
                  />
                  <Text as="span" variant="bodyMd">
                    已选 {selectedProducts.length} 个商品
                  </Text>
                </InlineStack>

                <DataTable
                  columnContentTypes={["text", "text", "text", "text", "numeric"]}
                  headings={["", "商品", "状态", "标签", "价格"]}
                  rows={rows}
                />

                <InlineStack gap="300">
                  <Button
                    disabled={pageInfo.hasNextPage === false}
                    onClick={() =>
                      setSearchParams((params) => {
                        params.set("after", pageInfo.endCursor ?? "");
                        return params;
                      })
                    }
                  >
                    加载更多
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  批量操作
                </Text>
                <TextField
                  label="追加标签"
                  value={tagSuffix}
                  onChange={setTagSuffix}
                  autoComplete="off"
                />
                <Button
                  variant="primary"
                  disabled={selectedProducts.length === 0}
                  loading={fetcher.state !== "idle"}
                  onClick={bulkAddTag}
                >
                  批量加标签
                </Button>

                <TextField
                  label="价格上调金额"
                  type="number"
                  value={priceDelta}
                  onChange={setPriceDelta}
                  autoComplete="off"
                />
                <Button
                  disabled={selectedProducts.length === 0}
                  loading={fetcher.state !== "idle"}
                  onClick={bulkIncreasePrice}
                >
                  批量涨价
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
