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
    <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="sticky top-0 z-10 -mx-4 border-b border-line bg-slate-50/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-11 w-full rounded-md border border-line bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-teal-100"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索产品名称"
              type="search"
              value={query}
            />
          </label>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {groups.map((group) => (
              <a
                className="shrink-0 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand"
                href={`#${group.id}`}
                key={group.id}
              >
                {group.name}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {filteredGroups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-white px-5 py-12 text-center text-sm text-slate-500">
            没有找到匹配的产品
          </div>
        ) : (
          filteredGroups.map((group) => (
            <section className="scroll-mt-28" id={group.id} key={group.id}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-ink">{group.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{group.products.length} 个商品</p>
                </div>
              </div>

              <div className="hidden overflow-hidden rounded-lg border border-line bg-white shadow-soft md:block">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-slate-100 text-sm text-slate-600">
                    <tr>
                      <th className="w-full px-5 py-3 font-semibold">商品</th>
                      <th className="whitespace-nowrap px-5 py-3 text-right font-semibold">零售</th>
                      <th className="whitespace-nowrap px-5 py-3 text-right font-semibold">代理</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {group.products.map((product) => (
                      <tr className="transition hover:bg-teal-50/45" key={product.name}>
                        <td className="px-5 py-4 text-sm leading-6 text-slate-800">{product.name}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-right text-base font-semibold text-slate-700">
                          ¥{formatPrice(product.retail)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right text-base font-bold text-brand">
                          ¥{formatPrice(product.agent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 md:hidden">
                {group.products.map((product) => (
                  <article className="rounded-lg border border-line bg-white p-4 shadow-soft" key={product.name}>
                    <h3 className="text-sm font-semibold leading-6 text-ink">{product.name}</h3>
                    <div className="mt-4 grid grid-cols-2 gap-3">
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
    <div className={highlight ? "rounded-md bg-teal-50 p-3" : "rounded-md bg-slate-100 p-3"}>
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={highlight ? "mt-1 text-xl font-bold text-brand" : "mt-1 text-xl font-bold text-ink"}>
        ¥{formatPrice(value)}
      </div>
    </div>
  );
}
