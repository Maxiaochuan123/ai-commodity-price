"use client";

import { Copy, ExternalLink, X } from "lucide-react";
import type { MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAdmin } from "@/components/admin-shell";
import type { Product } from "@/data/products";
import type { ProductGroup } from "@/data/products";
import type { PriceMap } from "@/lib/pricing";

const formatter = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 1
});

type CatalogProduct = Omit<Product, "cost"> & {
  cost?: number;
};

type CatalogGroup = Omit<ProductGroup, "products" | "subgroups"> & {
  products: CatalogProduct[];
  subgroups?: {
    name: string;
    products: CatalogProduct[];
  }[];
};

function formatPrice(price: number) {
  return formatter.format(price);
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall back to legacy copy.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    document.body.removeChild(textarea);
  }

  return copied;
}

export function PriceCatalog({ groups }: { groups: CatalogGroup[] }) {
  const admin = useAdmin();
  const [catalogGroups, setCatalogGroups] = useState<CatalogGroup[]>(groups);
  const [baselinePrices, setBaselinePrices] = useState<PriceMap>(() => getPriceMapFromGroups(groups));
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState(groups[0]?.id ?? "");
  const tabListRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const manualScrollUntilRef = useRef(0);
  const groupIds = useMemo(() => catalogGroups.map((group) => group.id).join("|"), [catalogGroups]);
  const currentPrices = getPriceMapFromGroups(catalogGroups);
  const dirty = JSON.stringify(currentPrices) !== JSON.stringify(baselinePrices);

  const scrollToGroup = useCallback((groupId: string, behavior: ScrollBehavior) => {
    const section = document.getElementById(groupId);
    if (!section) return;

    const toolbarHeight = toolbarRef.current?.offsetHeight ?? 0;
    const top = section.getBoundingClientRect().top + window.scrollY - toolbarHeight - 24;
    window.scrollTo({ top: Math.max(0, top), behavior });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPrices() {
      setPricesLoaded(false);
      try {
        const response = await fetch("/api/prices", { cache: "no-store" });
        const data = (await response.json()) as { groups: CatalogGroup[]; isAdmin: boolean };
        if (cancelled) return;

        setCatalogGroups(data.groups);
        setBaselinePrices(getPriceMapFromGroups(data.groups));
      } finally {
        if (!cancelled) setPricesLoaded(true);
      }
    }

    void loadPrices();

    return () => {
      cancelled = true;
    };
  }, [admin.isAdmin]);

  const savePrices = useCallback(async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/prices", {
        body: JSON.stringify({ prices: getPriceMapFromGroups(catalogGroups) }),
        headers: { "Content-Type": "application/json" },
        method: "PUT"
      });

      if (!response.ok) {
        admin.setToast("保存失败，请重新登录");
        return;
      }

      const data = (await response.json()) as { changes: unknown; prices: PriceMap };
      setBaselinePrices(data.prices);
      admin.setToast(data.changes ? "已保存，访客将看到价格更新提醒" : "已保存，未产生价格变动提醒");
    } finally {
      setSaving(false);
    }
  }, [admin, catalogGroups]);

  const resetPrices = useCallback(() => {
    setCatalogGroups((currentGroups) => applyPriceMapToGroups(currentGroups, baselinePrices));
  }, [baselinePrices]);

  useEffect(() => {
    admin.registerCatalog({
      dirty,
      reset: resetPrices,
      save: savePrices,
      saving
    });

    return () => admin.registerCatalog(null);
  }, [admin, dirty, resetPrices, savePrices, saving]);

  useEffect(() => {
    const sections = groupIds
      .split("|")
      .filter(Boolean)
      .map((groupId) => {
        const element = document.getElementById(groupId);
        return element ? { id: groupId, element } : null;
      })
      .filter((section): section is { id: string; element: HTMLElement } => Boolean(section));

    if (sections.length === 0) return;

    let frame = 0;
    let lastScrollY = -1;
    let lastViewportWidth = -1;
    let lastViewportHeight = -1;

    const updateActiveGroup = () => {
      if (manualScrollUntilRef.current > Date.now()) return;

      const toolbarHeight = toolbarRef.current?.offsetHeight ?? 0;
      const extraOffset = window.innerWidth <= 720 ? 72 : 64;
      const anchor = window.scrollY + toolbarHeight + extraOffset;
      const pageBottom = window.scrollY + window.innerHeight;
      const documentBottom = document.documentElement.scrollHeight - 8;

      let nextActiveGroupId = sections[0]?.id ?? "";

      if (pageBottom >= documentBottom) {
        nextActiveGroupId = sections[sections.length - 1]?.id ?? nextActiveGroupId;
      } else {
        for (const section of sections) {
          const top = section.element.getBoundingClientRect().top + window.scrollY;
          if (top <= anchor) {
            nextActiveGroupId = section.id;
          } else {
            break;
          }
        }
      }

      setActiveGroupId((currentGroupId) => (currentGroupId === nextActiveGroupId ? currentGroupId : nextActiveGroupId));
    };

    const watchScroll = () => {
      const hasViewportChanged =
        lastViewportWidth !== window.innerWidth || lastViewportHeight !== window.innerHeight;
      const hasScrollChanged = lastScrollY !== window.scrollY;

      if (hasViewportChanged || hasScrollChanged) {
        lastScrollY = window.scrollY;
        lastViewportWidth = window.innerWidth;
        lastViewportHeight = window.innerHeight;
        updateActiveGroup();
      }

      frame = window.requestAnimationFrame(watchScroll);
    };

    const handleHashChange = () => {
      const nextActiveGroupId = window.location.hash.replace("#", "");
      if (!nextActiveGroupId) return;

      setActiveGroupId(nextActiveGroupId);
      manualScrollUntilRef.current = Date.now() + 700;
      scrollToGroup(nextActiveGroupId, "auto");
    };

    updateActiveGroup();
    frame = window.requestAnimationFrame(watchScroll);
    window.addEventListener("hashchange", handleHashChange);

    const initialGroupId = window.location.hash.replace("#", "");
    if (initialGroupId && sections.some((section) => section.id === initialGroupId)) {
      setActiveGroupId(initialGroupId);
      manualScrollUntilRef.current = Date.now() + 700;
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => scrollToGroup(initialGroupId, "auto"));
      });
    }

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [groupIds, scrollToGroup]);

  useEffect(() => {
    const activeTab = tabListRef.current?.querySelector<HTMLAnchorElement>(`[data-group-id="${activeGroupId}"]`);
    const tabList = tabListRef.current;
    if (!activeTab || !tabList) return;

    const targetLeft = activeTab.offsetLeft - (tabList.clientWidth - activeTab.clientWidth) / 2;
    tabList.scrollTo({ left: Math.max(0, targetLeft), behavior: "auto" });
  }, [activeGroupId]);

  function handleTabClick(event: MouseEvent<HTMLAnchorElement>, groupId: string) {
    event.preventDefault();

    const section = document.getElementById(groupId);
    if (!section) return;

    manualScrollUntilRef.current = Date.now() + 700;
    setActiveGroupId(groupId);

    window.history.replaceState(null, "", `#${groupId}`);
    scrollToGroup(groupId, "smooth");
  }

  function updatePrice(productId: string, field: keyof PriceMap[string], value: number) {
    setCatalogGroups((currentGroups) => updateProductPrice(currentGroups, productId, field, value));
  }

  function updateStatus(productId: string, active: boolean) {
    setCatalogGroups((currentGroups) => updateProductStatus(currentGroups, productId, active));
  }

  return (
    <>
      <div className="catalog-toolbar" ref={toolbarRef}>
        <div className="catalog-toolbar-shell">
          <div className="category-tabs" aria-label="产品分类" ref={tabListRef}>
            {catalogGroups.map((group) => (
              <a
                aria-current={activeGroupId === group.id ? "true" : undefined}
                className={activeGroupId === group.id ? "category-tab is-active" : "category-tab"}
                data-group-id={group.id}
                href={`#${group.id}`}
                key={group.id}
                onClick={(event) => handleTabClick(event, group.id)}
              >
                {group.name}
              </a>
            ))}
          </div>
        </div>
      </div>

      <section className="container catalog" id="catalog">
        {pricesLoaded ? (
          <div className="group-list">
            {catalogGroups.map((group) => (
              <section className="product-group" id={group.id} key={group.id}>
                <div className="group-header">
                  <h2>{group.name}</h2>
                  <p>{group.products.length} 个商品，点击商品名阅读使用说明与注意事项</p>
                </div>

                <div className="table-shell">
                  <ProductTable
                    editMode={admin.editMode}
                    isAdmin={admin.isAdmin}
                    onPriceChange={updatePrice}
                    onStatusChange={updateStatus}
                    products={group.products}
                  />
                </div>

                <ProductCards
                  editMode={admin.editMode}
                  isAdmin={admin.isAdmin}
                  onPriceChange={updatePrice}
                  onStatusChange={updateStatus}
                  products={group.products}
                />

                {group.subgroups?.map((subgroup) => (
                  <div className="product-subgroup" key={subgroup.name}>
                    <div className="group-header subgroup-header">
                      <h3>{subgroup.name}</h3>
                      <p>{subgroup.products.length} 个商品，点击商品名阅读使用说明与注意事项</p>
                    </div>

                    <div className="table-shell">
                      <ProductTable
                        editMode={admin.editMode}
                        isAdmin={admin.isAdmin}
                        onPriceChange={updatePrice}
                        onStatusChange={updateStatus}
                        products={subgroup.products}
                      />
                    </div>

                    <ProductCards
                      editMode={admin.editMode}
                      isAdmin={admin.isAdmin}
                      onPriceChange={updatePrice}
                      onStatusChange={updateStatus}
                      products={subgroup.products}
                    />
                  </div>
                ))}
              </section>
            ))}
          </div>
        ) : (
          <div className="empty-state">正在加载最新商品状态...</div>
        )}
      </section>
    </>
  );
}

function ProductTable({
  editMode,
  isAdmin,
  onPriceChange,
  onStatusChange,
  products
}: {
  editMode: boolean;
  isAdmin: boolean;
  onPriceChange: (productId: string, field: keyof PriceMap[string], value: number) => void;
  onStatusChange: (productId: string, active: boolean) => void;
  products: CatalogProduct[];
}) {
  return (
    <table className="price-table">
      <thead>
        <tr>
          <th>商品</th>
          {isAdmin ? <th className="status-cell">状态</th> : null}
          {isAdmin ? <th className="channel-cell">渠道</th> : null}
          {isAdmin ? <th className="price-cell">成本</th> : null}
          <th className="price-cell">零售</th>
          {isAdmin ? <th className="price-cell profit-price">零售利润</th> : null}
          <th className="price-cell agent-price">代理返现 (每单)</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr className={product.active === false ? "is-offline" : undefined} key={product.id}>
            <td className="product-name">
              <ProductName product={product} />
            </td>
            {isAdmin ? (
              <td className="status-cell">
                {editMode ? (
                  <StatusToggle active={product.active !== false} onChange={(active) => onStatusChange(product.id, active)} />
                ) : (
                  <StatusBadge active={product.active !== false} />
                )}
              </td>
            ) : null}
            {isAdmin ? (
              <td className="channel-cell">
                <ChannelInfo product={product} />
              </td>
            ) : null}
            {isAdmin ? (
              <td className="price-cell">
                {editMode ? (
                  <PriceInput onChange={(value) => onPriceChange(product.id, "cost", value)} value={product.cost ?? 0} />
                ) : (
                  `¥${formatPrice(product.cost ?? 0)}`
                )}
              </td>
            ) : null}
            <td className="price-cell">
              {isAdmin && editMode ? (
                <PriceInput onChange={(value) => onPriceChange(product.id, "retail", value)} value={product.retail} />
              ) : (
                `¥${formatPrice(product.retail)}`
              )}
            </td>
            {isAdmin ? (
              <td className="price-cell profit-price">
                ¥{formatPrice(product.retail - (product.cost ?? 0))}
              </td>
            ) : null}
            <td className="price-cell agent-price">
              {isAdmin && editMode ? (
                <PriceInput onChange={(value) => onPriceChange(product.id, "agent", value)} value={product.agent} />
              ) : (
                `¥${formatPrice(product.agent)}`
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ProductCards({
  editMode,
  isAdmin,
  onPriceChange,
  onStatusChange,
  products
}: {
  editMode: boolean;
  isAdmin: boolean;
  onPriceChange: (productId: string, field: keyof PriceMap[string], value: number) => void;
  onStatusChange: (productId: string, active: boolean) => void;
  products: CatalogProduct[];
}) {
  return (
    <div className="mobile-cards">
      {products.map((product) => (
        <article className={product.active === false ? "product-card is-offline" : "product-card"} key={product.id}>
          <h3>
            <ProductName product={product} />
          </h3>
          {isAdmin ? (
            <div className="card-status">
              {editMode ? (
                <StatusToggle active={product.active !== false} onChange={(active) => onStatusChange(product.id, active)} />
              ) : (
                <StatusBadge active={product.active !== false} />
              )}
            </div>
          ) : null}
          {isAdmin ? <ChannelInfo product={product} /> : null}
          <div className="card-prices">
            {isAdmin ? (
              <>
                {editMode ? (
                  <>
                    <EditablePriceBlock label="成本" onChange={(value) => onPriceChange(product.id, "cost", value)} value={product.cost ?? 0} />
                    <EditablePriceBlock label="零售" onChange={(value) => onPriceChange(product.id, "retail", value)} value={product.retail} />
                    <PriceBlock profit label="零售利润" value={product.retail - (product.cost ?? 0)} />
                    <EditablePriceBlock highlight label="代理返现 (每单)" onChange={(value) => onPriceChange(product.id, "agent", value)} value={product.agent} />
                  </>
                ) : (
                  <>
                    <PriceBlock label="成本" value={product.cost ?? 0} />
                    <PriceBlock label="零售" value={product.retail} />
                    <PriceBlock profit label="零售利润" value={product.retail - (product.cost ?? 0)} />
                    <PriceBlock highlight label="代理返现 (每单)" value={product.agent} />
                  </>
                )}
              </>
            ) : (
              <>
                <PriceBlock label="零售" value={product.retail} />
                <PriceBlock highlight label="代理返现 (每单)" value={product.agent} />
              </>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function ProductName({ product }: { product: CatalogProduct }) {
  const offlineBadge = product.active === false ? <span className="offline-badge">已下架</span> : null;

  if (!product.docUrl) {
    return (
      <span className="product-entry-name">
        <span className="product-title-text">{product.name}</span>
        {offlineBadge}
      </span>
    );
  }

  return (
    <span className="product-entry">
      <span className="product-entry-name">
        <span className="product-title-text">{product.name}</span>
        {offlineBadge}
      </span>
      <span className="product-doc-actions">
        <a className="product-doc-link" href={product.docUrl} rel="noreferrer" target="_blank">
          说明
          <ExternalLink className="icon-xs" />
        </a>
        <CopyDocButton url={product.docUrl} />
      </span>
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return <span className={active ? "status-badge is-active" : "status-badge"}>{active ? "上架" : "下架"}</span>;
}

function StatusToggle({ active, onChange }: { active: boolean; onChange: (active: boolean) => void }) {
  return (
    <button
      aria-pressed={active}
      className={active ? "status-toggle is-active" : "status-toggle"}
      onClick={() => onChange(!active)}
      type="button"
    >
      <span className="switch-track">
        <span className="switch-thumb" />
      </span>
      <span className="switch-label">{active ? "上架" : "下架"}</span>
    </button>
  );
}

function ChannelInfo({ product }: { product: CatalogProduct }) {
  const [open, setOpen] = useState(false);

  if (!product.channel) return <span className="channel-empty">未标注</span>;

  return (
    <>
      <button className="channel-name" onClick={() => setOpen(true)} type="button">
        {product.channel.name}
      </button>
      {open ? createPortal(
        <div aria-modal="true" className="modal-backdrop" role="dialog">
          <div className="agent-modal channel-modal">
            <div className="agent-modal-header">
              <div>
                <h2>{product.channel.name}</h2>
                <p>{product.name}</p>
              </div>
              <button aria-label="关闭" className="modal-close" onClick={() => setOpen(false)} type="button">
                <X className="icon-xs" />
              </button>
            </div>

            <div className="agent-modal-body channel-modal-body">
              {product.channel.storeUrl ? (
                <a className="channel-link channel-store-link" href={product.channel.storeUrl} rel="noreferrer" target="_blank">
                  打开店铺
                  <ExternalLink className="icon-xs" />
                </a>
              ) : null}
              {product.channel.contacts?.map((contact) => (
                <p className="channel-contact" key={`${contact.label}-${contact.value}`}>
                  <strong>{contact.label}：</strong>
                  {contact.value}
                </p>
              ))}
            </div>

            <div className="agent-modal-actions">
              <button className="button button-secondary" onClick={() => setOpen(false)} type="button">
                我知道了
              </button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </>
  );
}

function CopyDocButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  async function handleCopy(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (timerRef.current) window.clearTimeout(timerRef.current);

    const success = await copyText(url);
    if (!success) return;

    setCopied(true);
    timerRef.current = window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button
      aria-label="复制说明链接"
      className={copied ? "product-copy-button is-copied" : "product-copy-button"}
      onClick={handleCopy}
      type="button"
    >
      {copied ? "已复制" : "复制"}
      <Copy className="icon-xs" />
    </button>
  );
}

function PriceBlock({ highlight, label, profit, value }: { highlight?: boolean; label: string; profit?: boolean; value: number }) {
  let blockClass = "price-block";
  if (highlight) blockClass += " is-agent";
  if (profit) blockClass += " is-profit";
  return (
    <div className={blockClass}>
      <div className="price-label">{label}</div>
      <div className="price-value">¥{formatPrice(value)}</div>
    </div>
  );
}

function EditablePriceBlock({
  highlight,
  label,
  onChange,
  value
}: {
  highlight?: boolean;
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <div className={highlight ? "price-block is-agent" : "price-block"}>
      <div className="price-label">{label}</div>
      <PriceInput onChange={onChange} value={value} />
    </div>
  );
}

function PriceInput({ onChange, value }: { onChange: (value: number) => void; value: number }) {
  return (
    <label className="price-input-wrap">
      <span>¥</span>
      <input
        min="0"
        onChange={(event) => onChange(Number(event.target.value))}
        step="0.1"
        type="number"
        value={Number.isFinite(value) ? value : 0}
      />
    </label>
  );
}

function getPriceMapFromGroups(groups: CatalogGroup[] | ProductGroup[]) {
  const entries: [string, PriceMap[string]][] = [];

  for (const group of groups) {
    for (const product of group.products) {
      entries.push([product.id, { active: product.active ?? true, agent: product.agent, cost: product.cost ?? 0, retail: product.retail }]);
    }
    for (const subgroup of group.subgroups ?? []) {
      for (const product of subgroup.products) {
        entries.push([product.id, { active: product.active ?? true, agent: product.agent, cost: product.cost ?? 0, retail: product.retail }]);
      }
    }
  }

  return Object.fromEntries(entries) as PriceMap;
}

function updateProductStatus(groups: CatalogGroup[], productId: string, active: boolean) {
  const updateProduct = (product: CatalogProduct) =>
    product.id === productId
      ? {
          ...product,
          active
        }
      : product;

  return groups.map((group) => ({
    ...group,
    products: group.products.map(updateProduct),
    subgroups: group.subgroups?.map((subgroup) => ({
      ...subgroup,
      products: subgroup.products.map(updateProduct)
    }))
  }));
}

function updateProductPrice(
  groups: CatalogGroup[],
  productId: string,
  field: keyof PriceMap[string],
  value: number
) {
  const updateProduct = (product: CatalogProduct) =>
    product.id === productId
      ? {
          ...product,
          [field]: Number.isFinite(value) ? value : 0
        }
      : product;

  return groups.map((group) => ({
    ...group,
    products: group.products.map(updateProduct),
    subgroups: group.subgroups?.map((subgroup) => ({
      ...subgroup,
      products: subgroup.products.map(updateProduct)
    }))
  }));
}

function applyPriceMapToGroups(groups: CatalogGroup[], prices: PriceMap) {
  const applyProduct = (product: CatalogProduct) => ({
    ...product,
    active: prices[product.id]?.active ?? product.active ?? true,
    agent: prices[product.id]?.agent ?? product.agent,
    cost: prices[product.id]?.cost ?? product.cost,
    retail: prices[product.id]?.retail ?? product.retail
  });

  return groups.map((group) => ({
    ...group,
    products: group.products.map(applyProduct),
    subgroups: group.subgroups?.map((subgroup) => ({
      ...subgroup,
      products: subgroup.products.map(applyProduct)
    }))
  }));
}
