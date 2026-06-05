"use client";

import { Copy, ExternalLink, X } from "lucide-react";
import type { MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAdmin } from "@/components/admin-shell";
import type { Product } from "@/data/products";
import type { ProductGroup } from "@/data/products";

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
  const [activeGroupId, setActiveGroupId] = useState(groups[0]?.id ?? "");
  const tabListRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const manualScrollUntilRef = useRef(0);
  const groupIds = useMemo(() => groups.map((group) => group.id).join("|"), [groups]);

  const scrollToGroup = useCallback((groupId: string, behavior: ScrollBehavior) => {
    const section = document.getElementById(groupId);
    if (!section) return;

    const toolbarHeight = toolbarRef.current?.offsetHeight ?? 0;
    const top = section.getBoundingClientRect().top + window.scrollY - toolbarHeight - 24;
    window.scrollTo({ top: Math.max(0, top), behavior });
  }, []);

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

  return (
    <>
      <div className="catalog-toolbar" ref={toolbarRef}>
        <div className="catalog-toolbar-shell">
          <div className="category-tabs" aria-label="产品分类" ref={tabListRef}>
            {groups.map((group) => (
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

      <section className={`container catalog ${admin.isAdmin ? "is-admin-mode" : ""}`} id="catalog">
        <div className="group-list">
          {groups.map((group) => (
            <section className="product-group" id={group.id} key={group.id}>
              <div className="group-header">
                <h2>{group.name}</h2>
                <p>{group.products.length} 个商品，点击商品名阅读使用说明与注意事项</p>
              </div>

              <div className="table-shell">
                <ProductTable
                  isAdmin={admin.isAdmin}
                  products={group.products}
                />
              </div>

              <ProductCards
                isAdmin={admin.isAdmin}
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
                      isAdmin={admin.isAdmin}
                      products={subgroup.products}
                    />
                  </div>

                  <ProductCards
                    isAdmin={admin.isAdmin}
                    products={subgroup.products}
                  />
                </div>
              ))}
            </section>
          ))}
        </div>
      </section>
    </>
  );
}

function ProductTable({
  isAdmin,
  products
}: {
  isAdmin: boolean;
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
          {isAdmin ? <th className="price-cell profit-price">扣除代理后利润</th> : null}
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
                <StatusBadge active={product.active !== false} />
              </td>
            ) : null}
            {isAdmin ? (
              <td className="channel-cell">
                <ChannelInfo product={product} />
              </td>
            ) : null}
            {isAdmin ? (
              <td className="price-cell">
                ¥{formatPrice(product.cost ?? 0)}
              </td>
            ) : null}
            <td className="price-cell">
              ¥{formatPrice(product.retail)}
            </td>
            {isAdmin ? (
              <td className="price-cell profit-price">
                ¥{formatPrice(product.retail - (product.cost ?? 0))}
              </td>
            ) : null}
            {isAdmin ? (
              <td className="price-cell profit-price">
                ¥{formatPrice(product.retail - (product.cost ?? 0) - product.agent)}
              </td>
            ) : null}
            <td className="price-cell agent-price">
              ¥{formatPrice(product.agent)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ProductCards({
  isAdmin,
  products
}: {
  isAdmin: boolean;
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
              <StatusBadge active={product.active !== false} />
            </div>
          ) : null}
          {isAdmin ? <ChannelInfo product={product} /> : null}
          <div className="card-prices">
            {isAdmin ? (
              <>
                <PriceBlock label="成本" value={product.cost ?? 0} />
                <PriceBlock label="零售" value={product.retail} />
                <PriceBlock profit label="零售利润" value={product.retail - (product.cost ?? 0)} />
                <PriceBlock profit label="扣除代理后利润" value={product.retail - (product.cost ?? 0) - product.agent} />
                <PriceBlock highlight label="代理返现 (每单)" value={product.agent} />
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
