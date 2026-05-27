"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { ProductGroup } from "@/data/products";

const formatter = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 1
});

function formatPrice(price: number) {
  return formatter.format(price);
}

export function PriceCatalog({ groups }: { groups: ProductGroup[] }) {
  const [query, setQuery] = useState("");
  const keyword = query.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!keyword) return groups;

    return groups
      .map((group) => ({
        ...group,
        products: group.products.filter((product) =>
          `${group.name} ${product.name}`.toLowerCase().includes(keyword)
        )
      }))
      .filter((group) => group.products.length > 0);
  }, [groups, keyword]);

  return (
    <section className="container catalog">
      <div className="catalog-toolbar">
        <div className="toolbar-inner">
          <label className="search-wrap">
            <Search className="icon-sm" />
            <input
              className="search-input"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索产品名称"
              type="search"
              value={query}
            />
          </label>

          <div className="category-tabs">
            {groups.map((group) => (
              <a className="category-tab" href={`#${group.id}`} key={group.id}>
                {group.name}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="group-list">
        {filteredGroups.length === 0 ? (
          <div className="empty-state">没有找到匹配的产品</div>
        ) : (
          filteredGroups.map((group) => (
            <section className="product-group" id={group.id} key={group.id}>
              <div className="group-header">
                <h2>{group.name}</h2>
                <p>{group.products.length} 个商品</p>
              </div>

              <div className="table-shell">
                <table className="price-table">
                  <thead>
                    <tr>
                      <th>商品</th>
                      <th className="price-cell">零售</th>
                      <th className="price-cell agent-price">代理</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.products.map((product) => (
                      <tr key={product.name}>
                        <td className="product-name">{product.name}</td>
                        <td className="price-cell">¥{formatPrice(product.retail)}</td>
                        <td className="price-cell agent-price">¥{formatPrice(product.agent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mobile-cards">
                {group.products.map((product) => (
                  <article className="product-card" key={product.name}>
                    <h3>{product.name}</h3>
                    <div className="card-prices">
                      <PriceBlock label="零售" value={product.retail} />
                      <PriceBlock highlight label="代理" value={product.agent} />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </section>
  );
}

function PriceBlock({ highlight, label, value }: { highlight?: boolean; label: string; value: number }) {
  return (
    <div className={highlight ? "price-block is-agent" : "price-block"}>
      <div className="price-label">{label}</div>
      <div className="price-value">¥{formatPrice(value)}</div>
    </div>
  );
}
