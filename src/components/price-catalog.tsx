"use client";

import { AlertTriangle, ArrowDown, ArrowUp, Check, Coins, Copy, Download, ExternalLink, FileText, Lock, MessageSquare, ShieldCheck, ToggleLeft, ToggleRight, Unlock, X } from "lucide-react";
import type { FormEvent, MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAdmin } from "@/components/admin-shell";
import { WechatLink } from "@/components/wechat-button";
import { ApplyUpgradeButton } from "@/components/apply-upgrade-button";
import { LottiePlayer } from "@/components/lottie-player";
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

type ProductOverride = {
  active?: boolean;
  offlineNote?: string;
};

type OverridesMap = Record<string, ProductOverride>;

type PriceSnapshotItem = {
  id: string;
  name: string;
  retail: number;
  primaryAgent: number;
  secondaryAgent: number;
  active: boolean;
  cost: number;
};

type ProductPriceChangeValue<T> = {
  oldVal: T;
  newVal: T;
};

type ProductPriceChange = {
  productId: string;
  name: string;
  status?: ProductPriceChangeValue<string>;
  cost?: ProductPriceChangeValue<number>;
  retail?: ProductPriceChangeValue<number>;
  primaryAgent?: ProductPriceChangeValue<number>;
  secondaryAgent?: ProductPriceChangeValue<number>;
};

const SNAPSHOT_KEY = "product_price_snapshot";
const SNAPSHOT_ACK_KEY = "product_price_snapshot_ack";

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
  const [levelNotification, setLevelNotification] = useState<"primary" | "secondary" | null>(null);
  const hasFetchedRef = useRef(false);

  // Product overrides from KV
  const [overrides, setOverrides] = useState<OverridesMap>({});
  const overridesFetchedRef = useRef(false);

  // Admin offline note modal
  const [offlineNoteModal, setOfflineNoteModal] = useState<{ productId: string; productName: string; currentNote: string } | null>(null);

  // Price change detection
  const [priceChanges, setPriceChanges] = useState<ProductPriceChange[]>([]);
  const [showPriceChangeModal, setShowPriceChangeModal] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [sessionModalVersion, setSessionModalVersion] = useState<string | null>(null);

  useEffect(() => {
    if (admin.isAdmin) {
      setAgentLevel("primary");
      return;
    }
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("agent_unlocked_level");
      const storedWechatId = localStorage.getItem("agent_wechat_id");
      if ((stored === "primary" || stored === "secondary") && storedWechatId) {
        setAgentLevel(stored);

        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;

        // Verify status with backend to log out if disabled or deleted
        fetch("/api/agents/login", {
          body: JSON.stringify({ wechatId: storedWechatId }),
          headers: { "Content-Type": "application/json" },
          method: "POST"
        })
          .then(async (res) => {
            if (!res.ok) {
              localStorage.removeItem("agent_unlocked_level");
              localStorage.removeItem("agent_wechat_id");
              setAgentLevel("none");
            } else {
              const data = (await res.json()) as { agent: { level: number } };
              const verifiedLevel = data.agent.level === 1 ? "primary" : "secondary";
              if (verifiedLevel !== stored) {
                localStorage.setItem("agent_unlocked_level", verifiedLevel);
                setAgentLevel(verifiedLevel);
                setLevelNotification(verifiedLevel);
              }
            }
          })
          .catch(() => {
            // ignore network errors to keep cache active offline
          });
      } else {
        setAgentLevel("none");
      }
    }
  }, [admin.isAdmin]);

  // Fetch product overrides from KV
  useEffect(() => {
    if (overridesFetchedRef.current) return;
    overridesFetchedRef.current = true;
    fetch("/api/admin/products", { cache: "no-store" })
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as { overrides: OverridesMap };
          setOverrides(data.overrides);
        }
      })
      .catch(() => {
        // ignore
      });
  }, []);

  // Merge groups with KV overrides
  const mergedGroups = useMemo<CatalogGroup[]>(() => {
    const applyOverrides = (products: CatalogProduct[]): CatalogProduct[] =>
      products.map((p) => {
        const ov = p.id ? overrides[p.id] : undefined;
        if (!ov) return p;
        return {
          ...p,
          active: ov.active ?? p.active,
          offlineNote: ov.offlineNote ?? p.offlineNote
        };
      });

    return groups.map((g) => ({
      ...g,
      products: applyOverrides(g.products),
      subgroups: g.subgroups?.map((sub) => ({
        ...sub,
        products: applyOverrides(sub.products)
      }))
    }));
  }, [groups, overrides]);

  // Price change detection via localStorage snapshot
  useEffect(() => {
    if (admin.isAdmin) return;

    const allMerged = mergedGroups.flatMap((g) =>
      [...g.products, ...(g.subgroups ?? []).flatMap((sub) => sub.products)]
    );

    // Build current snapshot
    const currentSnapshot: PriceSnapshotItem[] = allMerged.map((p) => ({
      id: p.id ?? "",
      name: p.name,
      retail: p.retail,
      primaryAgent: p.primaryAgent,
      secondaryAgent: p.secondaryAgent ?? p.primaryAgent,
      active: p.active !== false,
      cost: p.cost ?? 0
    }));

    // Load previous snapshot
    const prevRaw = localStorage.getItem(SNAPSHOT_KEY);
    const ackRaw = localStorage.getItem(SNAPSHOT_ACK_KEY);

    if (prevRaw) {
      try {
        const prevSnapshot = JSON.parse(prevRaw) as PriceSnapshotItem[];
        const prevMap = new Map(prevSnapshot.map((item) => [item.id, item]));

        const changes: ProductPriceChange[] = [];

        for (const curr of currentSnapshot) {
          const prev = prevMap.get(curr.id);
          if (!prev) continue;

          let hasVisibleChange = false;
          const changeRow: ProductPriceChange = {
            productId: curr.id,
            name: curr.name
          };

          // Status change (visible to all)
          if (prev.active !== curr.active) {
            changeRow.status = {
              oldVal: prev.active ? "上架" : "下架",
              newVal: curr.active ? "上架" : "下架"
            };
            hasVisibleChange = true;
          }

          // Retail price change (visible to all)
          if (prev.retail !== curr.retail) {
            changeRow.retail = {
              oldVal: prev.retail,
              newVal: curr.retail
            };
            hasVisibleChange = true;
          }

          // Cost change (visible only to Admin, backward compatible check)
          if (admin.isAdmin && prev.cost !== undefined && prev.cost !== curr.cost) {
            changeRow.cost = {
              oldVal: prev.cost ?? 0,
              newVal: curr.cost
            };
            hasVisibleChange = true;
          }

          // Secondary Agent change (visible to Admin, Primary, and Secondary)
          if ((admin.isAdmin || agentLevel === "primary" || agentLevel === "secondary") &&
              prev.secondaryAgent !== curr.secondaryAgent) {
            changeRow.secondaryAgent = {
              oldVal: prev.secondaryAgent,
              newVal: curr.secondaryAgent
            };
            hasVisibleChange = true;
          }

          // Primary Agent change (visible to Admin and Primary)
          if ((admin.isAdmin || agentLevel === "primary") &&
              prev.primaryAgent !== curr.primaryAgent) {
            changeRow.primaryAgent = {
              oldVal: prev.primaryAgent,
              newVal: curr.primaryAgent
            };
            hasVisibleChange = true;
          }

          if (hasVisibleChange) {
            changes.push(changeRow);
          }
        }

        if (changes.length > 0) {
          // Check if user already acknowledged this exact set of changes
          const changesHash = JSON.stringify(changes);
          if (ackRaw !== changesHash) {
            setPriceChanges(changes);
            setShowPriceChangeModal(true);
          }
        }
      } catch {
        // ignore malformed snapshot
      }
    }

    // Always save latest snapshot
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(currentSnapshot));
  }, [mergedGroups, admin.isAdmin, agentLevel]);

  // Admin: toggle product active status
  const handleToggleActive = useCallback(
    async (productId: string, productName: string, currentActive: boolean, currentNote: string) => {
      if (!currentActive) {
        // Currently offline → go online, no confirmation needed
        try {
          const res = await fetch("/api/admin/products", {
            body: JSON.stringify({ productId, active: true }),
            headers: { "Content-Type": "application/json" },
            method: "PUT"
          });
          if (res.ok) {
            setOverrides((prev) => ({
              ...prev,
              [productId]: { ...prev[productId], active: true }
            }));
            admin.setToast("已上架");
          }
        } catch {
          admin.setToast("操作失败");
        }
      } else {
        // Currently online → go offline, show modal for optional note
        setOfflineNoteModal({ productId, productName, currentNote });
      }
    },
    [admin]
  );

  // Handle offline note modal confirm
  const handleOfflineConfirm = useCallback(
    async (productId: string, note: string) => {
      try {
        const res = await fetch("/api/admin/products", {
          body: JSON.stringify({ productId, active: false, offlineNote: note }),
          headers: { "Content-Type": "application/json" },
          method: "PUT"
        });
        if (res.ok) {
          setOverrides((prev) => ({
            ...prev,
            [productId]: { active: false, offlineNote: note }
          }));
          admin.setToast("已下架");
        }
      } catch {
        admin.setToast("操作失败");
      }
      setOfflineNoteModal(null);
    },
    [admin]
  );

  // Handle price change acknowledgement
  const handleAckPriceChanges = useCallback(() => {
    const changesHash = JSON.stringify(priceChanges);
    localStorage.setItem(SNAPSHOT_ACK_KEY, changesHash);
    setShowPriceChangeModal(false);
  }, [priceChanges]);

  const handleUnlock = useCallback(() => {
    setUnlockModalOpen(true);
  }, []);
  const handleUpgrade = useCallback(() => {
    setUpgradeModalOpen(true);
  }, []);
  const tabListRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const manualScrollUntilRef = useRef(0);
  const groupIds = useMemo(() => mergedGroups.map((group) => group.id).join("|"), [mergedGroups]);

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
            {mergedGroups.map((group) => (
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
          {mergedGroups.map((group) => (
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
                  onToggleActive={handleToggleActive}
                  products={group.products}
                  onHoverTooltip={setHoveredTooltip}
                  onOpenSessionModal={setSessionModalVersion}
                />
              </div>

              <ProductCards
                isAdmin={admin.isAdmin}
                agentLevel={agentLevel}
                onUnlock={handleUnlock}
                onUpgrade={handleUpgrade}
                onToggleActive={handleToggleActive}
                products={group.products}
                onHoverTooltip={setHoveredTooltip}
                onOpenSessionModal={setSessionModalVersion}
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
                      onToggleActive={handleToggleActive}
                      products={subgroup.products}
                      onHoverTooltip={setHoveredTooltip}
                      onOpenSessionModal={setSessionModalVersion}
                    />
                  </div>

                  <ProductCards
                    isAdmin={admin.isAdmin}
                    agentLevel={agentLevel}
                    onUnlock={handleUnlock}
                    onUpgrade={handleUpgrade}
                    onToggleActive={handleToggleActive}
                    products={subgroup.products}
                    onHoverTooltip={setHoveredTooltip}
                    onOpenSessionModal={setSessionModalVersion}
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
      {levelNotification ? (
        <div aria-modal="true" className="modal-backdrop" role="dialog" style={{ zIndex: 100 }}>
          <div className="agent-modal login-modal" style={{ maxWidth: "380px", textAlign: "center" }}>
            <div className="agent-modal-body" style={{ padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <LottiePlayer
                animationPath="/success.json"
                className={levelNotification === "primary" ? "lottie-success-gold" : "lottie-success-green"}
                style={{ width: 100, height: 100 }}
              />
              <div>
                <h2 style={{ fontSize: "20px", color: "#111827", margin: "0 0 8px 0" }}>
                  {levelNotification === "primary" ? "已升级为 1 级代理" : "价格目录已更新"}
                </h2>
                <p style={{ fontSize: "14px", color: "#475569", margin: 0, lineHeight: 1.6 }}>
                  {levelNotification === "primary" 
                    ? "已为您解锁更优惠的 1 级代理价。" 
                    : "已按最新代理等级为您更新价格。"}
                </p>
              </div>
              <button
                className="button button-premium-teal"
                onClick={() => setLevelNotification(null)}
                style={{ width: "100%", marginTop: "8px", justifyContent: "center" }}
                type="button"
              >
                开始查看价格
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {offlineNoteModal ? (
        <OfflineNoteModal
          productId={offlineNoteModal.productId}
          productName={offlineNoteModal.productName}
          currentNote={offlineNoteModal.currentNote}
          onClose={() => setOfflineNoteModal(null)}
          onConfirm={handleOfflineConfirm}
        />
      ) : null}
      {showPriceChangeModal && priceChanges.length > 0 ? (
        <PriceChangeModal
          agentLevel={agentLevel}
          changes={priceChanges}
          isAdmin={admin.isAdmin}
          onAck={handleAckPriceChanges}
        />
      ) : null}
      {sessionModalVersion && (
        <GptSessionModal
          version={sessionModalVersion}
          onClose={() => setSessionModalVersion(null)}
          setToast={admin.setToast}
        />
      )}
      <svg width="0" height="0" style={{ position: "absolute", width: 0, height: 0 }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gold-gradient-flow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bf953f">
              <animate attributeName="stop-color" values="#bf953f; #fcf6ba; #b38728; #fbf5b7; #bf953f" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="#fcf6ba">
              <animate attributeName="stop-color" values="#fcf6ba; #b38728; #fbf5b7; #bf953f; #fcf6ba" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#b38728">
              <animate attributeName="stop-color" values="#b38728; #fbf5b7; #bf953f; #fcf6ba; #b38728" dur="3s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>
      </svg>
      {hoveredTooltip && createPortal(
        <div style={{
          position: "fixed",
          left: `${hoveredTooltip.x}px`,
          top: `${hoveredTooltip.y}px`,
          transform: "translate(-50%, -100%)",
          background: "#1e293b",
          color: "#fff",
          padding: "6px 10px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: 500,
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
          pointerEvents: "none",
          zIndex: 99999,
          maxWidth: "280px",
          lineHeight: 1.4,
          textAlign: "center",
          whiteSpace: "normal"
        }}>
          {hoveredTooltip.text}
          <div style={{
            position: "absolute",
            left: "50%",
            bottom: "0",
            transform: "translate(-50%, 100%)",
            width: "0",
            height: "0",
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "5px solid #1e293b"
          }} />
        </div>,
        document.body
      )}
    </>
  );
}

function ProductTable({
  isAdmin,
  agentLevel,
  onUnlock,
  onUpgrade,
  onToggleActive,
  products,
  onHoverTooltip,
  onOpenSessionModal
}: {
  isAdmin: boolean;
  agentLevel: "none" | "primary" | "secondary";
  onUnlock: () => void;
  onUpgrade: () => void;
  onToggleActive: (productId: string, productName: string, currentActive: boolean, currentNote: string) => void;
  products: CatalogProduct[];
  onHoverTooltip: (tooltip: { text: string; x: number; y: number } | null) => void;
  onOpenSessionModal: (version: string) => void;
}) {
  const isLocked = agentLevel === "none" || agentLevel === "secondary";

  // Display name of current unlocked agent type
  const agentHeaderLabel = 
    agentLevel === "primary" ? "1级代理价" :
    agentLevel === "secondary" ? "2级代理价" :
    "2级代理价，1级代理价";

  return (
    <div 
      className={isLocked ? "table-agent-lock-wrap agent-locked" : "table-agent-lock-wrap"} 
      onClick={agentLevel === "none" ? onUnlock : agentLevel === "secondary" ? onUpgrade : undefined}
    >
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
              <>
                {/* 2级代理价列 - 始终展示 */}
                <th className="price-cell agent-price">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    2级代理价
                    {agentLevel === "none" ? (
                      <Lock className="icon-xs" onClick={(e) => { e.stopPropagation(); onUnlock(); }} style={{ cursor: "pointer" }} />
                    ) : (
                      <Unlock className="icon-xs" />
                    )}
                  </span>
                </th>
                {/* 1级代理价列 - 仅在已解锁任意代理后展示 */}
                {agentLevel !== "none" ? (
                  <th className="price-cell agent-price">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      1级代理价
                      {agentLevel === "secondary" ? (
                        <Lock className="icon-xs" onClick={(e) => { e.stopPropagation(); onUpgrade(); }} style={{ cursor: "pointer" }} />
                      ) : (
                        <Unlock className="icon-xs" />
                      )}
                    </span>
                  </th>
                ) : null}
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const primaryProfit = product.primaryAgent - (product.cost ?? 0);
            const secondaryPrice = product.secondaryAgent ?? product.primaryAgent;
            const secondaryProfit = secondaryPrice - (product.cost ?? 0);

            return (
              <tr
                className={product.active === false ? "is-offline" : undefined}
                key={product.id}
              >
                <td className="product-name">
                  <ProductName product={product} onOpenSessionModal={onOpenSessionModal} />
                  {!isAdmin && product.active === false && product.offlineNote ? (
                    <div className="offline-overlay">
                      <div className="offline-overlay-ticker">
                        <span className="offline-overlay-text">{product.offlineNote}</span>
                        <span className="offline-overlay-text" aria-hidden="true">{product.offlineNote}</span>
                      </div>
                    </div>
                  ) : null}
                </td>
                {isAdmin ? (
                  <td className="status-cell">
                    <button
                      className={product.active !== false ? "admin-switch is-on" : "admin-switch is-off"}
                      onClick={() => onToggleActive(product.id ?? "", product.name, product.active !== false, product.offlineNote ?? "")}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        onHoverTooltip({
                          text: product.active !== false ? "点击下架" : "点击上架",
                          x: rect.left + rect.width / 2,
                          y: rect.top - 8
                        });
                      }}
                      onMouseLeave={() => onHoverTooltip(null)}
                      type="button"
                    >
                      <span className="admin-switch-thumb" />
                    </button>
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
                  <>
                    {/* 2级代理价单元格 */}
                    {agentLevel === "none" ? (
                      <td
                        className="price-cell agent-price agent-price-locked"
                        onClick={onUnlock}
                        style={{ cursor: "pointer" }}
                      >
                        <div style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "36px" }}>
                          <span style={{ filter: "blur(4px)", opacity: 0.6 }}>¥{formatPrice(secondaryPrice)}</span>
                          <div style={{ position: "absolute", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Lock className="icon-xs" style={{ color: "#64748b" }} />
                          </div>
                        </div>
                      </td>
                    ) : (
                      <td className="price-cell agent-price">
                        ¥{formatPrice(secondaryPrice)}
                      </td>
                    )}

                    {/* 1级代理价单元格 */}
                    {agentLevel !== "none" ? (
                      agentLevel === "secondary" ? (
                        <td
                          className="price-cell agent-price agent-price-locked"
                          onClick={onUpgrade}
                          style={{ cursor: "pointer" }}
                        >
                          <div style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "36px" }}>
                            <span style={{ filter: "blur(4px)", opacity: 0.6 }}>¥{formatPrice(product.primaryAgent)}</span>
                            <div style={{ position: "absolute", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Lock className="icon-xs" style={{ color: "#64748b" }} />
                            </div>
                          </div>
                        </td>
                      ) : (
                        <td className="price-cell agent-price">
                          ¥{formatPrice(product.primaryAgent)}
                        </td>
                      )
                    ) : null}
                  </>
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
  onToggleActive,
  products,
  onHoverTooltip,
  onOpenSessionModal
}: {
  isAdmin: boolean;
  agentLevel: "none" | "primary" | "secondary";
  onUnlock: () => void;
  onUpgrade: () => void;
  onToggleActive: (productId: string, productName: string, currentActive: boolean, currentNote: string) => void;
  products: CatalogProduct[];
  onHoverTooltip: (tooltip: { text: string; x: number; y: number } | null) => void;
  onOpenSessionModal: (version: string) => void;
}) {
  const isUnlocked = agentLevel !== "none";

  // Display name of current unlocked agent type
  const agentLabel = 
    agentLevel === "primary" ? "1级代理价" :
    agentLevel === "secondary" ? "2级代理价" :
    "2级代理价，1级代理价";

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
            <h3 style={{ position: "relative" }}>
              <ProductName product={product} onOpenSessionModal={onOpenSessionModal} />
              {!isAdmin && product.active === false && product.offlineNote ? (
                <div className="offline-overlay">
                  <div className="offline-overlay-ticker">
                    <span className="offline-overlay-text">{product.offlineNote}</span>
                    <span className="offline-overlay-text" aria-hidden="true">{product.offlineNote}</span>
                  </div>
                </div>
              ) : null}
            </h3>
            {isAdmin ? (
              <div className="card-status">
                <button
                  className={product.active !== false ? "admin-switch is-on" : "admin-switch is-off"}
                  onClick={() => onToggleActive(product.id ?? "", product.name, product.active !== false, product.offlineNote ?? "")}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    onHoverTooltip({
                      text: product.active !== false ? "点击下架" : "点击上架",
                      x: rect.left + rect.width / 2,
                      y: rect.top - 8
                    });
                  }}
                  onMouseLeave={() => onHoverTooltip(null)}
                  type="button"
                >
                  <span className="admin-switch-thumb" />
                </button>
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
                  
                  {/* 2级代理价 */}
                  {agentLevel === "none" ? (
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
                      <div className="price-label">2级代理价</div>
                      <div className="price-value" style={{ filter: "blur(4px)", opacity: 0.6 }}>¥{formatPrice(secondaryPrice)}</div>
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
                  ) : (
                    <PriceBlock highlight label="2级代理价" value={secondaryPrice} />
                  )}

                  {/* 1级代理价 (仅在解锁2级/1级代理后展示) */}
                  {agentLevel !== "none" && (
                    agentLevel === "secondary" ? (
                      <div
                        className="price-block is-agent"
                        onClick={onUpgrade}
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
                        <div className="price-label">1级代理价</div>
                        <div className="price-value" style={{ filter: "blur(4px)", opacity: 0.6 }}>¥{formatPrice(product.primaryAgent)}</div>
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
                    ) : (
                      <PriceBlock highlight label="1级代理价" value={product.primaryAgent} />
                    )
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

function ProductName({ 
  product,
  onOpenSessionModal 
}: { 
  product: CatalogProduct;
  onOpenSessionModal: (version: string) => void;
}) {
  const offlineBadge = product.active === false ? <span className="offline-badge">已下架</span> : null;
  const gptVersion = product.name.includes("GptPro 5x") ? "GptPro 5x" : product.name.includes("GptPro 20x") ? "GptPro 20x" : "";

  const sessionButton = gptVersion ? (
    <button
      className="product-session-button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpenSessionModal(gptVersion);
      }}
      type="button"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 8px",
        borderRadius: "6px",
        border: "1px solid #0f766e",
        background: "#f0fdfa",
        color: "#0f766e",
        fontSize: "11px",
        fontWeight: 700,
        cursor: "pointer",
        transition: "all 150ms ease",
        height: "22px",
        whiteSpace: "nowrap"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#ccfbf1";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#f0fdfa";
      }}
    >
      获取 Session
      <FileText className="icon-xs" />
    </button>
  ) : null;

  if (!product.docUrl) {
    return (
      <span className="product-entry">
        <span className="product-entry-name">
          <span className="product-title-text">{product.name}</span>
          {offlineBadge}
        </span>
        {sessionButton && (
          <span className="product-doc-actions" style={{ marginLeft: "8px" }}>
            {sessionButton}
          </span>
        )}
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
        {sessionButton}
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
  const [unlockedSuccessLevel, setUnlockedSuccessLevel] = useState<"primary" | "secondary" | null>(null);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
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
      setUnlockedSuccessLevel(level as "primary" | "secondary");
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
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
      setUnlockedSuccessLevel("secondary");
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  if (unlockedSuccessLevel) {
    const isLevel1 = unlockedSuccessLevel === "primary";
    return createPortal(
      <div aria-modal="true" className="modal-backdrop" role="dialog">
        <div className="agent-modal login-modal" style={{ maxWidth: "380px", textAlign: "center" }}>
          <div className="agent-modal-body" style={{ padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <LottiePlayer
              animationPath="/success.json"
              className={isLevel1 ? "lottie-success-gold" : "lottie-success-green"}
              style={{ width: 100, height: 100 }}
            />
            <div>
              <h2 style={{ fontSize: "20px", color: "#111827", margin: "0 0 8px 0" }}>
                {isLevel1 ? "已解锁 1 级代理" : "已解锁 2 级代理"}
              </h2>
              <p style={{ fontSize: "14px", color: "#475569", margin: 0, lineHeight: 1.6 }}>
                已为您解锁 {isLevel1 ? "1 级" : "2 级"}代理特权，价格目录已更新。
              </p>
            </div>
            <button
              className="button button-premium-teal"
              onClick={() => {
                onUnlockSuccess(unlockedSuccessLevel);
                onClose();
              }}
              style={{ width: "100%", marginTop: "8px", justifyContent: "center" }}
              type="button"
            >
              开始查看价格
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
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
              className="button button-premium-teal"
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
                注册即享 <strong>2 级代理价</strong>，<strong>1 级代理价</strong> 更劲爆！
              </span>
            </div>
            <ApplyUpgradeButton style={{ flexShrink: 0, marginLeft: "auto" }} />
          </div>
          <label>
            <span>姓名<span className="required-star">*</span></span>
            <input
              autoFocus
              onChange={(e) => setRegName(e.target.value)}
              placeholder="请输入您的姓名"
              required
              value={regName}
            />
          </label>
          <label>
            <span>微信号<span className="required-star">*</span></span>
            <input
              onChange={(e) => setRegWechat(e.target.value)}
              placeholder="请输入您的微信号"
              required
              value={regWechat}
            />
          </label>
          <label>
            <span>代理注册激活码<span className="required-star">*</span></span>
            <input
              onChange={(e) => setRegCode(e.target.value)}
              placeholder="请输入代理注册激活码"
              required
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

function OfflineNoteModal({
  productId,
  productName,
  currentNote,
  onClose,
  onConfirm
}: {
  productId: string;
  productName: string;
  currentNote: string;
  onClose: () => void;
  onConfirm: (productId: string, note: string) => Promise<void>;
}) {
  const [note, setNote] = useState(currentNote);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    await onConfirm(productId, note.trim());
    setSubmitting(false);
  }

  return createPortal(
    <div aria-modal="true" className="modal-backdrop" role="dialog">
      <form className="agent-modal login-modal" onSubmit={(e) => void handleSubmit(e)} style={{ maxWidth: "420px" }}>
        <div className="agent-modal-header" style={{ padding: "16px 20px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700 }}>确认下架商品？</h2>
            <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>{productName}</p>
          </div>
          <button aria-label="关闭" className="modal-close" onClick={onClose} type="button">
            <X className="icon-xs" />
          </button>
        </div>

        <div className="agent-modal-body" style={{ padding: "16px 20px" }}>
          <input
            autoFocus
            onChange={(e) => setNote(e.target.value)}
            placeholder="说明下架原因（选填）"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              fontSize: "14px",
              fontFamily: "inherit",
              outline: "none",
              boxSizing: "border-box"
            }}
            type="text"
            value={note}
          />
        </div>

        <div className="agent-modal-actions" style={{ padding: "12px 20px 16px" }}>
          <button className="button button-secondary" onClick={onClose} type="button">
            取消
          </button>
          <button className="button button-danger" disabled={submitting} type="submit">
            {submitting ? "处理中..." : "确认下架"}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

function PriceChangeModal({
  changes,
  onAck,
  isAdmin,
  agentLevel
}: {
  changes: ProductPriceChange[];
  onAck: () => void;
  isAdmin: boolean;
  agentLevel: "none" | "primary" | "secondary";
}) {
  const showCost = isAdmin;
  const showRetail = true;
  const showSecondary = isAdmin || agentLevel === "primary" || agentLevel === "secondary";
  const showPrimary = isAdmin || agentLevel === "primary";
  const [hoveredTooltip, setHoveredTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  return createPortal(
    <div aria-modal="true" className="modal-backdrop" role="dialog" style={{ zIndex: 110 }}>
      <div className="agent-modal price-change-modal">
        <div className="agent-modal-header" style={{ padding: "18px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              background: "#fffbeb",
              border: "1px solid #fef3c7",
              flexShrink: 0
            }}>
              <AlertTriangle style={{ color: "#d97706", width: "20px", height: "20px" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: 0 }}>价格/状态变动通知</h2>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0" }}>以下商品自您上次访问以来发生了变动</p>
            </div>
          </div>
          <button aria-label="关闭" className="modal-close" onClick={onAck} type="button">
            <X className="icon-xs" />
          </button>
        </div>

        <div className="agent-modal-body" style={{ maxHeight: "400px", overflowY: "auto", padding: "0" }}>
          <table className="price-change-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: "24px" }}>商品</th>
                <th>状态</th>
                {showCost && <th>成本</th>}
                {showRetail && <th style={(!showSecondary && !showPrimary) ? { paddingRight: "24px" } : undefined}>零售</th>}
                {showSecondary && <th style={(!showPrimary) ? { paddingRight: "24px" } : undefined}>2级代理</th>}
                {showPrimary && <th style={{ paddingRight: "24px" }}>1级代理</th>}
              </tr>
            </thead>
            <tbody>
              {changes.map((change, idx) => (
                <tr key={idx}>
                  <td
                    className="change-product-name"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredTooltip({
                        text: change.name,
                        x: rect.left + rect.width / 2,
                        y: rect.top - 8
                      });
                    }}
                    onMouseLeave={() => setHoveredTooltip(null)}
                    style={{ paddingLeft: "24px", cursor: "pointer" }}
                  >
                    {change.name}
                  </td>
                  <td>
                    {change.status ? (
                      <span>
                        <span style={{ color: "#475569", textDecoration: "line-through", fontSize: "11px", marginRight: "4px" }}>
                          {change.status.oldVal}
                        </span>
                        <span style={{ color: "#94a3b8", marginRight: "4px" }}>➔</span>
                        <span className={change.status.newVal === "下架" ? "change-status-offline" : "change-status-online"}>
                          {change.status.newVal}
                        </span>
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>-</span>
                    )}
                  </td>
                  {showCost && (
                    <td>
                      {change.cost ? (
                        <span>
                          <span style={{ color: "#1e293b", marginRight: "4px" }}>
                            {change.cost.oldVal}
                          </span>
                          <span style={{ color: "#94a3b8", marginRight: "4px" }}>➔</span>
                          <span style={{ color: change.cost.newVal > change.cost.oldVal ? "#dc2626" : "#22c55e", fontWeight: 700 }}>
                            {change.cost.newVal}
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>-</span>
                      )}
                    </td>
                  )}
                  {showRetail && (
                    <td style={(!showSecondary && !showPrimary) ? { paddingRight: "24px" } : undefined}>
                      {change.retail ? (
                        <span>
                          <span style={{ color: "#1e293b", marginRight: "4px" }}>
                            {change.retail.oldVal}
                          </span>
                          <span style={{ color: "#94a3b8", marginRight: "4px" }}>➔</span>
                          <span style={{ color: change.retail.newVal > change.retail.oldVal ? "#dc2626" : "#22c55e", fontWeight: 700 }}>
                            {change.retail.newVal}
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>-</span>
                      )}
                    </td>
                  )}
                  {showSecondary && (
                    <td style={(!showPrimary) ? { paddingRight: "24px" } : undefined}>
                      {change.secondaryAgent ? (
                        <span>
                          <span style={{ color: "#1e293b", marginRight: "4px" }}>
                            {change.secondaryAgent.oldVal}
                          </span>
                          <span style={{ color: "#94a3b8", marginRight: "4px" }}>➔</span>
                          <span style={{ color: change.secondaryAgent.newVal > change.secondaryAgent.oldVal ? "#dc2626" : "#22c55e", fontWeight: 700 }}>
                            {change.secondaryAgent.newVal}
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>-</span>
                      )}
                    </td>
                  )}
                  {showPrimary && (
                    <td style={{ paddingRight: "24px" }}>
                      {change.primaryAgent ? (
                        <span>
                          <span style={{ color: "#1e293b", marginRight: "4px" }}>
                            {change.primaryAgent.oldVal}
                          </span>
                          <span style={{ color: "#94a3b8", marginRight: "4px" }}>➔</span>
                          <span style={{ color: change.primaryAgent.newVal > change.primaryAgent.oldVal ? "#dc2626" : "#22c55e", fontWeight: 700 }}>
                            {change.primaryAgent.newVal}
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>-</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="agent-modal-actions" style={{ padding: "18px 24px" }}>
          <button className="button button-primary" onClick={onAck} style={{ width: "100%", justifyContent: "center" }} type="button">
            <MessageSquare className="icon-xs" />
            我知道了
          </button>
        </div>
      </div>
      {hoveredTooltip && createPortal(
        <div style={{
          position: "fixed",
          left: `${hoveredTooltip.x}px`,
          top: `${hoveredTooltip.y}px`,
          transform: "translate(-50%, -100%)",
          background: "#1e293b",
          color: "#fff",
          padding: "6px 10px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: 500,
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
          pointerEvents: "none",
          zIndex: 99999,
          maxWidth: "280px",
          lineHeight: 1.4,
          textAlign: "center",
          whiteSpace: "normal"
        }}>
          {hoveredTooltip.text}
          <div style={{
            position: "absolute",
            left: "50%",
            bottom: "0",
            transform: "translate(-50%, 100%)",
            width: "0",
            height: "0",
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "5px solid #1e293b"
          }} />
        </div>,
        document.body
      )}
    </div>,
    document.body
  );
}

interface GptSessionModalProps {
  version: string;
  onClose: () => void;
  setToast: (msg: string) => void;
}

function GptSessionModal({ version, onClose, setToast }: GptSessionModalProps) {
  const [sessionText, setSessionText] = useState("");
  const [success, setSuccess] = useState(false);
  const [parsedEmail, setParsedEmail] = useState("");
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMac(/macintosh|mac os x/i.test(navigator.userAgent));
    }
  }, []);

  useEffect(() => {
    const trimmed = sessionText.trim();
    if (!trimmed) {
      setSuccess(false);
      setParsedEmail("");
      return;
    }

    try {
      let parsed: any = null;
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      }

      if (parsed && typeof parsed === "object") {
        const email = parsed.user?.email || parsed.email || "";
        setParsedEmail(email);
        setSuccess(true);
      }
    } catch (err) {
      // ignore parsing errors while user is typing/pasting
    }
  }, [sessionText]);


  function handleDownload() {
    if (!sessionText.trim()) return;
    try {
      let parsed: any = null;
      try {
        parsed = JSON.parse(sessionText);
      } catch {
        const jsonMatch = sessionText.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      }
      
      const email = parsed?.user?.email || parsed?.email || "unknown_email";
      const filename = `${email}+${version}.txt`;
      const content = parsed ? JSON.stringify(parsed, null, 2) : sessionText;
      
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setToast(`文件 ${filename} 下载成功！`);
    } catch {
      setToast("文件下载失败");
    }
  }

  return createPortal(
    <div aria-modal="true" className="modal-backdrop" role="dialog" style={{ zIndex: 110 }}>
      <div className="agent-modal" style={{ maxWidth: "480px" }}>
        <div className="agent-modal-header" style={{ padding: "18px 24px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: 0 }}>获取 {version} Session</h2>
            <p style={{ fontSize: "12.5px", color: "#64748b", marginTop: "4px" }}>帮助您快速获取、重命名并复制 Session 发送给客服</p>
          </div>
          <button aria-label="关闭" className="modal-close" onClick={onClose} type="button">
            <X className="icon-xs" />
          </button>
        </div>

        <div className="agent-modal-body" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Step 1 */}
            <div style={{ display: "flex", gap: "10px" }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: "#f1f5f9",
                fontSize: "12px",
                fontWeight: 700,
                color: "#475569",
                flexShrink: 0
              }}>1</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#334155" }}>登录 ChatGPT 网页端</p>
                <a
                  href="https://chatgpt.com/"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "13px",
                    color: "#0f766e",
                    fontWeight: 700,
                    marginTop: "6px",
                    textDecoration: "none"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                >
                  去登录 ChatGPT 网页端 <ExternalLink style={{ width: "13px", height: "13px" }} />
                </a>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                  请确保在当前浏览器已登录您的 ChatGPT 账号。
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ display: "flex", gap: "10px" }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: "#f1f5f9",
                fontSize: "12px",
                fontWeight: 700,
                color: "#475569",
                flexShrink: 0
              }}>2</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#334155" }}>在相同浏览器中复制 Session 数据</p>
                <a
                  href="https://chatgpt.com/api/auth/session"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "13px",
                    color: "#0f766e",
                    fontWeight: 700,
                    marginTop: "6px",
                    textDecoration: "none"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                >
                  打开 Session 数据页面 <ExternalLink style={{ width: "13px", height: "13px" }} />
                </a>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                  在新标签页中按 <kbd style={{ background: "#f1f5f9", padding: "2px 4px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "11px" }}>{isMac ? "Cmd" : "Ctrl"} + A</kbd> 全选，再按 <kbd style={{ background: "#f1f5f9", padding: "2px 4px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "11px" }}>{isMac ? "Cmd" : "Ctrl"} + C</kbd> 复制页面所有代码。
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ display: "flex", gap: "10px" }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: "#f1f5f9",
                fontSize: "12px",
                fontWeight: 700,
                color: "#475569",
                flexShrink: 0
              }}>3</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#334155" }}>粘贴下方，自动为您生成规范 txt 文件</p>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                  将刚才复制的页面代码粘贴到下方输入框，系统将自动识别邮箱。
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "4px" }}>
            <textarea
              onChange={(e) => setSessionText(e.target.value)}
              placeholder="在此处粘贴复制的页面代码 (Ctrl + V)..."
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                fontSize: "13px",
                fontFamily: "monospace",
                outline: "none",
                resize: "none",
                boxSizing: "border-box",
                background: "#f8fafc"
              }}
              value={sessionText}
            />
          </div>

          {success && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              padding: "12px 14px",
              color: "#16a34a",
              fontSize: "13px",
              lineHeight: 1.5
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
                <Check className="icon-sm" style={{ color: "#16a34a", flexShrink: 0 }} />
                <span>自动识别成功，已生成 txt 文件！</span>
              </div>
              <div style={{ fontSize: "12px", color: "#15803d", paddingLeft: "24px" }}>
                <div><strong>识别到您的邮箱：</strong>{parsedEmail || "未识别到邮箱"}</div>
                <div><strong>txt 文件名：</strong>{parsedEmail ? `${parsedEmail}+${version}.txt` : `账号+${version}.txt`}</div>
              </div>
            </div>
          )}
        </div>

        {sessionText.trim() ? (
          <div className="agent-modal-actions" style={{ padding: "16px 24px" }}>
            <button
              className="button button-primary"
              onClick={handleDownload}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", justifyContent: "center", width: "100%" }}
              type="button"
            >
              <Download style={{ width: "14px", height: "14px" }} />
              下载 txt 文件
            </button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
