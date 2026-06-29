import type { AdminApiContext } from "@shopify/shopify-app-remix/server";

export type ProductRow = {
  id: string;
  title: string;
  status: string;
  tags: string[];
  variantId: string;
  price: string;
};

const PRODUCTS_QUERY = `#graphql
  query OmniProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          status
          tags
          variants(first: 1) {
            edges {
              node {
                id
                price
              }
            }
          }
        }
      }
    }
  }
`;

export async function fetchProducts(
  admin: AdminApiContext,
  first = 25,
  after?: string,
) {
  const response = await admin.graphql(PRODUCTS_QUERY, {
    variables: { first, after: after ?? null },
  });
  const json = await response.json();
  const connection = json.data?.products;

  const products: ProductRow[] =
    connection?.edges?.map(
      (edge: {
        node: {
          id: string;
          title: string;
          status: string;
          tags: string[];
          variants: { edges: { node: { id: string; price: string } }[] };
        };
      }) => ({
        id: edge.node.id,
        title: edge.node.title,
        status: edge.node.status,
        tags: edge.node.tags,
        variantId: edge.node.variants.edges[0]?.node.id ?? "",
        price: edge.node.variants.edges[0]?.node.price ?? "0.00",
      }),
    ) ?? [];

  return {
    products,
    pageInfo: connection?.pageInfo ?? { hasNextPage: false, endCursor: null },
  };
}

export async function bulkUpdateProductTags(
  admin: AdminApiContext,
  updates: { id: string; tags: string[] }[],
) {
  const results = [];

  for (const update of updates) {
    const response = await admin.graphql(
      `#graphql
        mutation OmniUpdateProductTags($input: ProductInput!) {
          productUpdate(input: $input) {
            product {
              id
              tags
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      {
        variables: {
          input: {
            id: update.id,
            tags: update.tags,
          },
        },
      },
    );

    const json = await response.json();
    results.push(json.data?.productUpdate);
  }

  return results;
}

export async function bulkUpdateVariantPrices(
  admin: AdminApiContext,
  updates: { productId: string; variantId: string; price: string }[],
) {
  const grouped = updates.reduce<
    Record<string, { variantId: string; price: string }[]>
  >((acc, item) => {
    acc[item.productId] ??= [];
    acc[item.productId].push({
      variantId: item.variantId,
      price: item.price,
    });
    return acc;
  }, {});

  const results = [];

  for (const [productId, variants] of Object.entries(grouped)) {
    const response = await admin.graphql(
      `#graphql
        mutation OmniBulkUpdateVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            productVariants {
              id
              price
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      {
        variables: {
          productId,
          variants: variants.map((variant) => ({
            id: variant.variantId,
            price: variant.price,
          })),
        },
      },
    );

    const json = await response.json();
    results.push(json.data?.productVariantsBulkUpdate);
  }

  return results;
}

export async function searchProducts(admin: AdminApiContext, query: string) {
  const response = await admin.graphql(
    `#graphql
      query OmniSearchProducts($query: String!) {
        products(first: 10, query: $query) {
          edges {
            node {
              id
              title
              featuredImage {
                url
              }
              variants(first: 1) {
                edges {
                  node {
                    id
                    price
                  }
                }
              }
            }
          }
        }
      }
    `,
    { variables: { query } },
  );

  const json = await response.json();

  return (
    json.data?.products?.edges?.map(
      (edge: {
        node: {
          id: string;
          title: string;
          featuredImage?: { url: string };
          variants: { edges: { node: { id: string; price: string } }[] };
        };
      }) => ({
        id: edge.node.id,
        title: edge.node.title,
        imageUrl: edge.node.featuredImage?.url ?? "",
        variantId: edge.node.variants.edges[0]?.node.id ?? "",
        price: edge.node.variants.edges[0]?.node.price ?? "0.00",
      }),
    ) ?? []
  );
}
