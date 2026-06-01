import { productGroups } from "@/data/products";
import type { Product, ProductGroup } from "@/data/products";

export type PriceRecord = {
  active: boolean;
  agent: number;
  cost: number;
  retail: number;
};

export type PriceMap = Record<string, PriceRecord>;

export type PublicPriceChange = {
  agent?: {
    from: number;
    to: number;
  };
  groupName: string;
  productId: string;
  productName: string;
  retail?: {
    from: number;
    to: number;
  };
  subgroupName?: string;
};

export type PublicPriceChangeBatch = {
  changedAt: string;
  changes: PublicPriceChange[];
  id: string;
};

export const PRICES_KEY = "ai-commodity-price:prices:v1";
export const PRICE_CHANGES_KEY = "ai-commodity-price:latest-public-price-changes:v1";

export function flattenProducts(groups: ProductGroup[] = productGroups) {
  return groups.flatMap((group) => [
    ...group.products.map((product) => ({
      groupName: group.name,
      product,
      subgroupName: undefined as string | undefined
    })),
    ...(group.subgroups ?? []).flatMap((subgroup) =>
      subgroup.products.map((product) => ({
        groupName: group.name,
        product,
        subgroupName: subgroup.name
      }))
    )
  ]);
}

export function getInitialPriceMap() {
  return Object.fromEntries(
    flattenProducts().map(({ product }) => [
      product.id,
      {
        agent: product.agent,
        active: product.active ?? true,
        cost: product.cost,
        retail: product.retail
      }
    ])
  ) as PriceMap;
}

export function mergePriceMap(input?: PriceMap | null) {
  const initial = getInitialPriceMap();
  if (!input) return initial;

  return Object.fromEntries(
    Object.entries(initial).map(([productId, defaults]) => [
      productId,
      {
        active: typeof input[productId]?.active === "boolean" ? input[productId].active : defaults.active,
        agent: normalizePrice(input[productId]?.agent, defaults.agent),
        cost: normalizePrice(input[productId]?.cost, defaults.cost),
        retail: normalizePrice(input[productId]?.retail, defaults.retail)
      }
    ])
  ) as PriceMap;
}

export function buildCatalog(priceMap: PriceMap, includeCost: boolean) {
  const applyProduct = (product: Product) => {
    const price = priceMap[product.id] ?? product;
    return {
      ...product,
      active: price.active,
      agent: price.agent,
      cost: includeCost ? price.cost : undefined,
      retail: price.retail
    };
  };

  return productGroups.map((group) => ({
    ...group,
    products: group.products.map(applyProduct),
    subgroups: group.subgroups?.map((subgroup) => ({
      ...subgroup,
      products: subgroup.products.map(applyProduct)
    }))
  }));
}

export function diffPublicPriceChanges(previous: PriceMap, next: PriceMap): PublicPriceChange[] {
  const changes: PublicPriceChange[] = [];

  for (const { groupName, product, subgroupName } of flattenProducts()) {
    const previousPrice = previous[product.id];
    const nextPrice = next[product.id];
    if (!previousPrice || !nextPrice) continue;

    const retail = previousPrice.retail !== nextPrice.retail ? { from: previousPrice.retail, to: nextPrice.retail } : undefined;
    const agent = previousPrice.agent !== nextPrice.agent ? { from: previousPrice.agent, to: nextPrice.agent } : undefined;
    if (!retail && !agent) continue;

    changes.push({
        agent,
        groupName,
        productId: product.id,
        productName: product.name,
        retail,
        subgroupName
    });
  }

  return changes;
}

function normalizePrice(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
