"use client";

import { Coins, Copy, ExternalLink, Lock, ShieldCheck, Unlock, X } from "lucide-react";
import type { FormEvent, MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAdmin } from "@/components/admin-shell";
import { WechatLink } from "@/components/wechat-button";
import { ApplyUpgradeButton } from "@/components/apply-upgrade-button";
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
  const [agentLevel, setAgentLevel] = useState<"none" | "primary" | "secondary">("none");
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  useEffect(() => {
    if (admin.isAdmin) {
      setAgentLevel("primary");
      return;
    }
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("agent_unlocked_level");
      if (stored === "primary" || stored === "secondary") {
        setAgentLevel(stored);
      } else {
        setAgentLevel("none");
      }
    }
  }, [admin.isAdmin]);

  const handleUnlock = useCallback(() => {
    setUnlockModalOpen(true);
  }, []);
  const handleUpgrade = useCallback(() => {
    setUpgradeModalOpen(true);
  }, []);
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
                  agentLevel={agentLevel}
                  onUnlock={handleUnlock}
                  onUpgrade={handleUpgrade}
                  products={group.products}
                />
              </div>

              <ProductCards
                isAdmin={admin.isAdmin}
                agentLevel={agentLevel}
                onUnlock={handleUnlock}
                onUpgrade={handleUpgrade}
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
                      agentLevel={agentLevel}
                      onUnlock={handleUnlock}
                      onUpgrade={handleUpgrade}
                      products={subgroup.products}
                    />
                  </div>

                  <ProductCards
                    isAdmin={admin.isAdmin}
                    agentLevel={agentLevel}
                    onUnlock={handleUnlock}
                    onUpgrade={handleUpgrade}
                    products={subgroup.products}
                  />
                </div>
              ))}
            </section>
          ))}
        </div>
      </section>
      {unlockModalOpen ? (
        <UnlockModal
          onClose={() => setUnlockModalOpen(false)}
          onUnlockSuccess={(level) => setAgentLevel(level)}
        />
      ) : null}
      {upgradeModalOpen ? (
        <UpgradeToPrimaryModal onClose={() => setUpgradeModalOpen(false)} />
      ) : null}
    </>
  );
}

function ProductTable({
  isAdmin,
  agentLevel,
  onUnlock,
  onUpgrade,
  products
}: {
  isAdmin: boolean;
  agentLevel: "none" | "primary" | "secondary";
  onUnlock: () => void;
  onUpgrade: () => void;
  products: CatalogProduct[];
}) {
  const isUnlocked = agentLevel !== "none";

  // Display name of current unlocked agent type
  const agentHeaderLabel = 
    agentLevel === "primary" ? "1级代理价" :
    agentLevel === "secondary" ? "2级代理价" :
    "代理价";

  return (
    <div className={!isUnlocked ? "table-agent-lock-wrap agent-locked" : "table-agent-lock-wrap"} onClick={!isUnlocked ? onUnlock : undefined}>
      <table className="price-table">
        <thead>
          <tr>
            <th>商品</th>
            {isAdmin ? <th className="status-cell">状态</th> : null}
            {isAdmin ? <th className="channel-cell">渠道</th> : null}
            {isAdmin ? <th className="price-cell">成本</th> : null}
            <th className="price-cell">零售</th>
            {isAdmin ? <th className="price-cell profit-price">零售利润</th> : null}
            {isAdmin ? (
              <>
                <th className="price-cell">1级代理价</th>
                <th className="price-cell profit-price">1级代理后利润</th>
                <th className="price-cell">2级代理价</th>
                <th className="price-cell profit-price">2级代理后利润</th>
              </>
            ) : (
              <th className="price-cell agent-price">
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  {agentHeaderLabel}
                  {!isUnlocked ? <Lock className="icon-xs" /> : <Unlock className="icon-xs" />}
                </span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            // Determine active price to display for agent column
            const agentPrice = 
              agentLevel === "secondary" 
                ? (product.secondaryAgent ?? product.primaryAgent) 
                : product.primaryAgent;

            const primaryProfit = product.primaryAgent - (product.cost ?? 0);
            const secondaryPrice = product.secondaryAgent ?? product.primaryAgent;
            const secondaryProfit = secondaryPrice - (product.cost ?? 0);

            return (
              <tr
                className={product.active === false ? "is-offline" : undefined}
                key={product.id}
              >
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
                  <>
                    <td className="price-cell">
                      ¥{formatPrice(product.primaryAgent)}
                    </td>
                    <td className="price-cell profit-price">
                      ¥{formatPrice(primaryProfit)}
                    </td>
                    <td className="price-cell">
                      ¥{formatPrice(secondaryPrice)}
                    </td>
                    <td className="price-cell profit-price">
                      ¥{formatPrice(secondaryProfit)}
                    </td>
                  </>
                ) : (
                  <td
                    className={!isUnlocked ? "price-cell agent-price agent-price-locked" : "price-cell agent-price"}
                  >
                    ¥{formatPrice(agentPrice)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ProductCards({
  isAdmin,
  agentLevel,
  onUnlock,
  onUpgrade,
  products
}: {
  isAdmin: boolean;
  agentLevel: "none" | "primary" | "secondary";
  onUnlock: () => void;
  onUpgrade: () => void;
  products: CatalogProduct[];
}) {
  const isUnlocked = agentLevel !== "none";

  // Display name of current unlocked agent type
  const agentLabel = 
    agentLevel === "primary" ? "1级代理价" :
    agentLevel === "secondary" ? "2级代理价" :
    "代理价";

  return (
    <div className="mobile-cards">
      {products.map((product) => {
        // Determine active price to display for agent column
        const agentPrice = 
          agentLevel === "secondary" 
            ? (product.secondaryAgent ?? product.primaryAgent) 
            : product.primaryAgent;

        const primaryProfit = product.primaryAgent - (product.cost ?? 0);
        const secondaryPrice = product.secondaryAgent ?? product.primaryAgent;
        const secondaryProfit = secondaryPrice - (product.cost ?? 0);

        return (
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
                  <PriceBlock label="1级代理价" value={product.primaryAgent} />
                  <PriceBlock profit label="1级代理后利润" value={primaryProfit} />
                  <PriceBlock label="2级代理价" value={secondaryPrice} />
                  <PriceBlock profit label="2级代理后利润" value={secondaryProfit} />
                </>
              ) : (
                <>
                  <PriceBlock label="零售" value={product.retail} />
                  {isUnlocked ? (
                    <PriceBlock highlight label={agentLabel} value={agentPrice} />
                  ) : (
                    <div
                      className="price-block is-agent"
                      onClick={onUnlock}
                      style={{
                        cursor: "pointer",
                        position: "relative",
                        overflow: "hidden",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        backdropFilter: "blur(6px)",
                        WebkitBackdropFilter: "blur(6px)",
                        border: "1px solid rgba(255, 255, 255, 0.1)"
                      }}
                    >
                      <div className="price-label">{agentLabel}</div>
                      <div className="price-value" style={{ filter: "blur(4px)", opacity: 0.6 }}>¥{formatPrice(agentPrice)}</div>
                      <div style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(0, 0, 0, 0.15)",
                        zIndex: 2
                      }}>
                        <div style={{
                          background: "rgba(0, 0, 0, 0.65)",
                          borderRadius: "50%",
                          padding: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                          border: "1px solid rgba(255, 255, 255, 0.2)"
                        }}>
                          <Lock className="icon-xs" style={{ color: "#fff" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </article>
        );
      })}
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
        <a 
          className="product-title-text" 
          href={product.docUrl} 
          rel="noreferrer" 
          target="_blank"
          style={{ 
            color: "inherit", 
            textDecoration: "none"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; e.currentTarget.style.color = "#0f766e"; }}
          onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; e.currentTarget.style.color = "inherit"; }}
        >
          {product.name}
          <ExternalLink className="icon-xs" style={{ display: "inline", marginLeft: "4px", verticalAlign: "middle" }} />
        </a>
        {offlineBadge}
      </span>
      <span className="product-doc-actions">
        <CopyDocButton name={product.name} url={product.docUrl} />
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

function CopyDocButton({ name, url }: { name: string; url: string }) {
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

    const success = await copyText(`${url} ${name}`);
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
      {copied ? "已复制" : "复制文档"}
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

export function UnlockModal({ 
  onClose, 
  onUnlockSuccess,
  initialStep = "choice"
}: { 
  onClose: () => void; 
  onUnlockSuccess: (level: "primary" | "secondary") => void;
  initialStep?: "choice" | "login" | "register";
}) {
  const [step, setStep] = useState<"choice" | "login" | "register">(initialStep);
  const [loginWechat, setLoginWechat] = useState("");
  const [regName, setRegName] = useState("");
  const [regWechat, setRegWechat] = useState("");
  const [regCode, setRegCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loginWechat.trim()) {
      setError("请输入微信号");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/agents/login", {
        body: JSON.stringify({ wechatId: loginWechat.trim() }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        setError(data.message ?? "登录失败");
        return;
      }
      const data = (await response.json()) as { agent: { level: number; wechatId: string } };
      const level = data.agent.level === 1 ? "primary" : "secondary";
      localStorage.setItem("agent_unlocked_level", level);
      localStorage.setItem("agent_wechat_id", data.agent.wechatId);
      onUnlockSuccess(level as "primary" | "secondary");
      onClose();
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!regName.trim() || !regWechat.trim() || !regCode.trim()) {
      setError("请填写完整信息");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/agents", {
        body: JSON.stringify({
          name: regName.trim(),
          wechatId: regWechat.trim(),
          activationCode: regCode.trim()
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        setError(data.message ?? "注册失败");
        return;
      }
      localStorage.setItem("agent_unlocked_level", "secondary");
      localStorage.setItem("agent_wechat_id", regWechat.trim());
      onUnlockSuccess("secondary");
      onClose();
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  if (step === "choice") {
    return createPortal(
      <div aria-modal="true" className="modal-backdrop" role="dialog">
        <div className="agent-modal login-modal" style={{ maxWidth: "380px" }}>
          <div className="agent-modal-header">
            <div>
              <h2>代理专区</h2>
              <p>登录或注册以查看代理专属报价</p>
            </div>
            <button aria-label="关闭" className="modal-close" onClick={onClose} type="button">
              <X className="icon-xs" />
            </button>
          </div>

          <div className="agent-modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "24px 20px" }}>
            <button
              className="button button-primary"
              onClick={() => { setStep("login"); setError(""); }}
              style={{ width: "100%", padding: "14px", justifyContent: "center", fontSize: "15px" }}
              type="button"
            >
              代理登录
            </button>
            <button
              className="button button-accent"
              onClick={() => { setStep("register"); setError(""); }}
              style={{ width: "100%", padding: "14px", justifyContent: "center", fontSize: "15px" }}
              type="button"
            >
              注册成为代理
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  if (step === "login") {
    return createPortal(
      <div aria-modal="true" className="modal-backdrop" role="dialog">
        <form className="agent-modal login-modal" onSubmit={(e) => void handleLogin(e)}>
          <div className="agent-modal-header">
            <div>
              <h2>代理登录</h2>
              <p>使用注册的微信号登录</p>
            </div>
            <button aria-label="关闭" className="modal-close" onClick={onClose} type="button">
              <X className="icon-xs" />
            </button>
          </div>

          <div className="agent-modal-body login-form">
            <label>
              微信号
              <input
                autoFocus
                onChange={(e) => setLoginWechat(e.target.value)}
                placeholder="请输入注册时的微信号"
                value={loginWechat}
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
          </div>

          <div className="agent-modal-actions">
            <button className="button button-secondary" onClick={() => { setStep("choice"); setError(""); }} type="button">
              返回
            </button>
            <button className="button button-primary" disabled={loading} type="submit">
              {loading ? "登录中..." : "登录"}
            </button>
          </div>
        </form>
      </div>,
      document.body
    );
  }

  // Register step
  return createPortal(
    <div aria-modal="true" className="modal-backdrop" role="dialog">
      <form className="agent-modal login-modal" onSubmit={(e) => void handleRegister(e)} style={{ maxWidth: "480px" }}>
        <div className="agent-modal-header">
          <div>
            <h2>注册成为代理</h2>
            <p>填写信息注册，注册通过即享 2 级代理价</p>
          </div>
          <button aria-label="关闭" className="modal-close" onClick={onClose} type="button">
            <X className="icon-xs" />
          </button>
        </div>

        <div className="agent-modal-body login-form">
          <div className="agent-note" style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", flexWrap: "wrap", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldCheck className="icon-sm" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: "12.5px", color: "#0f766e", fontWeight: 500, whiteSpace: "nowrap" }}>
                注册即享 <strong>2 级代理价</strong>，<strong>1 级代理价</strong>更劲爆！
              </span>
            </div>
            <ApplyUpgradeButton style={{ flexShrink: 0, marginLeft: "auto" }} />
          </div>
          <label>
            姓名
            <input
              autoFocus
              onChange={(e) => setRegName(e.target.value)}
              placeholder="请输入您的姓名"
              value={regName}
            />
          </label>
          <label>
            微信号
            <input
              onChange={(e) => setRegWechat(e.target.value)}
              placeholder="请输入您的微信号"
              value={regWechat}
            />
          </label>
          <label>
            代理注册激活码
            <input
              onChange={(e) => setRegCode(e.target.value)}
              placeholder="请输入代理注册激活码"
              value={regCode}
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
        </div>

        <div className="agent-modal-actions">
          <button 
            className="button button-secondary" 
            onClick={() => { 
              if (initialStep === "register") {
                onClose();
              } else {
                setStep("choice"); 
              }
              setError(""); 
            }} 
            type="button"
          >
            返回
          </button>
          <button className="button button-primary" disabled={loading} type="submit">
            {loading ? "注册中..." : "注册"}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

export function UpgradeToPrimaryModal({ onClose }: { onClose: () => void }) {
  return createPortal(
    <div aria-modal="true" className="modal-backdrop" role="dialog">
      <div className="agent-modal login-modal" style={{ maxWidth: "440px" }}>
        <div className="agent-modal-header">
          <div>
            <h2>解锁 1 级代理价</h2>
            <p>选择以下任意一种方式解锁更优惠的 1 级代理价格</p>
          </div>
          <button aria-label="关闭" className="modal-close" onClick={onClose} type="button">
            <X className="icon-xs" />
          </button>
        </div>

        <div className="agent-modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Option 1: Pay 288 */}
          <div style={{
            border: "1px solid #fed7aa",
            borderRadius: "12px",
            background: "#fff7ed",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#c2410c", fontWeight: 700 }}>
              <Coins className="icon-sm" style={{ color: "#f59e0b" }} />
              <span>方式一：支付解锁</span>
            </div>
            <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: 1.6 }}>
              支付 <strong>288 元</strong> 即可永久解锁 1 级代理专属特权。
            </p>
          </div>

          {/* Option 2: Talk on WeChat */}
          <div style={{
            border: "1px solid #ccfbf1",
            borderRadius: "12px",
            background: "#f0fdfa",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0f766e", fontWeight: 700 }}>
              <ShieldCheck className="icon-sm" />
              <span>方式二：带量微信详谈</span>
            </div>
            <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: 1.6 }}>
              若您有较大稳定的单量，可联系微信说明量级，免费升级 1 级代理价。
            </p>
          </div>

          <div style={{ 
            marginTop: "4px",
            padding: "12px 16px",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            background: "#f8fafc",
            textAlign: "center"
          }}>
            <WechatLink wechat="mxcsgnh" />
          </div>
        </div>

        <div className="agent-modal-actions">
          <button className="button button-secondary" onClick={onClose} type="button">
            我知道了
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
