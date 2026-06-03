import type { ReactNode } from "react";
import { ArrowUpRight, BadgeCheck, Radio, ShieldCheck, Users, Zap } from "lucide-react";
import { AdminProvider, BrandLoginButton } from "@/components/admin-shell";
import { BecomeAgentButton } from "@/components/hero-actions";
import { WechatButton } from "@/components/wechat-button";
import { PriceCatalog } from "@/components/price-catalog";
import { contact, productGroups } from "@/data/products";

export default function Home() {
  return (
    <AdminProvider>
      <main className="price-page">
        <style dangerouslySetInnerHTML={{ __html: pageStyles }} />

        <section className="hero">
          <div className="container hero-inner">
            <nav className="topbar">
              <BrandLoginButton />
              <div className="top-actions">
                <a className="button button-secondary" href={contact.proofUrl} rel="noreferrer" target="_blank">
                  <span className="button-label">真实成交图片</span>
                  <ArrowUpRight className="icon-xs" />
                </a>
                <BecomeAgentButton />
                <WechatButton wechat={contact.wechat} />
              </div>
            </nav>

          <div className="hero-summary">
            <span>160+ 售后群</span>
            <span>60+ 博主合作渠道</span>
            <span>代理合作</span>
            <span>下单前先读说明</span>
          </div>

          <div className="hero-showcase" aria-label="服务亮点">
            <div className="signal-card">
              <div className="signal-card-top">
                <span className="live-dot" />
                实时补货 · 说明先行
              </div>
              <div className="signal-card-title">官方正规直充</div>
              <div className="signal-card-copy">ChatGPT / Claude / Gemini / Grok / Telegram，一页快速查价。</div>
            </div>

            <div className="ticker-panel" aria-hidden="true">
              <div className="ticker-row">
                <span>ChatGPT Plus</span>
                <span>Claude Max</span>
                <span>Gemini Pro</span>
                <span>SuperGrok</span>
                <span>Telegram 老号</span>
                <span>ChatGPT Plus</span>
                <span>Claude Max</span>
                <span>Gemini Pro</span>
                <span>SuperGrok</span>
                <span>Telegram 老号</span>
              </div>
              <div className="ticker-row ticker-row-alt">
                <span>代理价</span>
                <span>售后群</span>
                <span>说明文档</span>
                <span>真实成交</span>
                <span>渠道合作</span>
                <span>代理价</span>
                <span>售后群</span>
                <span>说明文档</span>
                <span>真实成交</span>
                <span>渠道合作</span>
              </div>
            </div>
          </div>
        </div>
      </section>

        <PriceCatalog groups={productGroups} />

        <section className="trust-section">
          <div className="container trust-grid">
            <TrustItem icon={<BadgeCheck />} title="真实成交可查" text="公开成交图片，60+ 博主合作渠道，方便下单前核验。" />
            <TrustItem icon={<ShieldCheck />} title="售后群支持" text="160+ 售后群沉淀，交付、教程和售后更稳。" />
            <TrustItem icon={<Users />} title="代理合作" text={`添加微信 ${contact.wechat} 咨询代理价。`} />
            <TrustItem icon={<Radio />} title="动态更新" text="按商品状态持续调整，减少客户反复问价成本。" />
            <TrustItem icon={<Zap />} title="快速交付" text="热门 AI 商品集中展示，下单路径更短。" />
          </div>
        </section>
      </main>
    </AdminProvider>
  );
}

function TrustItem({ icon, text, title }: { icon: ReactNode; text: string; title: string }) {
  return (
    <div className="trust-item">
      <div className="trust-icon">{icon}</div>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

const pageStyles = `
  .price-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at 10% 0%, rgba(20, 184, 166, 0.18), transparent 30%),
      radial-gradient(circle at 90% 8%, rgba(245, 158, 11, 0.14), transparent 28%),
      linear-gradient(180deg, rgba(15, 118, 110, 0.08), rgba(248, 250, 252, 0) 420px),
      #f8fafc;
    color: #111827;
  }

  .price-page::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(15, 118, 110, 0.055) 1px, transparent 1px),
      linear-gradient(90deg, rgba(15, 118, 110, 0.055) 1px, transparent 1px);
    background-size: 36px 36px;
    mask-image: linear-gradient(to bottom, black, transparent 70%);
    animation: gridDrift 16s linear infinite;
  }

  .container {
    width: min(100% - 32px, 1120px);
    margin: 0 auto;
  }

  .hero {
    border-bottom: 1px solid #e5e7eb;
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 253, 250, 0.72)),
      rgba(255, 255, 255, 0.88);
    position: relative;
    overflow: hidden;
  }

  .hero::after {
    content: "";
    position: absolute;
    inset: auto -12% -52px -12%;
    height: 120px;
    background: linear-gradient(90deg, transparent, rgba(20, 184, 166, 0.18), rgba(245, 158, 11, 0.12), transparent);
    filter: blur(22px);
    animation: auroraSweep 8s ease-in-out infinite alternate;
  }

  .hero-inner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 26px 0 24px;
    animation: riseIn 620ms ease both;
  }

  .topbar,
  .top-actions,
  .brand-mark,
  .button {
    display: flex;
    align-items: center;
  }

  .topbar {
    justify-content: space-between;
    gap: 16px;
  }

  .brand-mark {
    gap: 8px;
    color: #0f766e;
    font-size: 18px;
    font-weight: 700;
  }

  .brand-button {
    border: 0;
    background: transparent;
    padding: 0;
    cursor: pointer;
    font: inherit;
  }

  .brand-button:hover {
    color: #0d9488;
  }

  .top-actions {
    flex-wrap: wrap;
    gap: 8px;
  }

  .top-actions > .button,
  .top-actions > a.button {
    justify-content: center;
  }

  .button {
    min-height: 42px;
    gap: 6px;
    border: 0;
    border-radius: 8px;
    padding: 8px 14px;
    color: inherit;
    cursor: pointer;
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
    transition: transform 160ms ease, border-color 160ms ease, background 160ms ease, color 160ms ease, box-shadow 160ms ease;
  }

  .button:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  }

  .button-secondary {
    border: 1px solid #e5e7eb;
    background: #ffffff;
    color: #475569;
  }

  .button-secondary:hover {
    border-color: #0f766e;
    color: #0f766e;
  }

  .button-label {
    display: inline-flex;
    align-items: center;
  }

  .button-primary {
    border: 1px solid #111827;
    background: #111827;
    color: #ffffff;
  }

  .button-primary:hover {
    background: #334155;
  }

  .button-primary.is-success,
  .button-primary.is-success:hover {
    border-color: #0f766e;
    background: #0f766e;
    color: #ffffff;
  }

  .button-accent {
    border: 1px solid #0f766e;
    background: #f0fdfa;
    color: #0f766e;
  }

  .button-accent:hover {
    background: #ccfbf1;
  }

  .button-danger,
  .button-danger-icon {
    border: 1px solid #fecaca;
    background: #fef2f2;
    color: #dc2626;
  }

  .button-danger:hover,
  .button-danger-icon:hover {
    border-color: #dc2626;
    background: #fee2e2;
    color: #b91c1c;
  }

  .button-danger-icon {
    justify-content: center;
    width: 42px;
    min-width: 42px;
    padding: 8px;
  }

  .wechat-button {
    min-width: 152px;
  }

  .button-secondary,
  .button-accent {
    min-width: 102px;
  }

  .wechat-icon {
    flex: 0 0 auto;
    width: 22px;
    height: 20px;
    color: #22c55e;
    fill: currentColor;
  }

  .wechat-icon circle {
    fill: #ffffff;
  }

  .hero-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .hero-summary span {
    border: 1px solid #ccfbf1;
    border-radius: 999px;
    background: #f0fdfa;
    padding: 6px 10px;
    color: #115e59;
    font-size: 13px;
    font-weight: 800;
    animation: softPop 520ms ease both;
  }

  .hero-summary span:nth-child(2) {
    animation-delay: 70ms;
  }

  .hero-summary span:nth-child(3) {
    animation-delay: 140ms;
  }

  .hero-summary span:nth-child(4) {
    animation-delay: 210ms;
  }

  .hero-showcase {
    display: grid;
    grid-template-columns: 0.9fr 1.4fr;
    gap: 14px;
    align-items: stretch;
  }

  .signal-card,
  .ticker-panel {
    border: 1px solid rgba(148, 163, 184, 0.28);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.72);
    box-shadow: 0 18px 50px rgba(15, 23, 42, 0.07);
    backdrop-filter: blur(14px);
  }

  .signal-card {
    padding: 16px;
  }

  .signal-card-top {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #0f766e;
    font-size: 12px;
    font-weight: 900;
  }

  .live-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #f59e0b;
    box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.18);
    animation: pulseDot 1.5s ease-in-out infinite;
  }

  .signal-card-title {
    margin-top: 10px;
    color: #0f172a;
    font-size: 28px;
    font-weight: 950;
    line-height: 1.1;
  }

  .signal-card-copy {
    margin-top: 8px;
    color: #475569;
    font-size: 13px;
    line-height: 1.7;
  }

  .ticker-panel {
    position: relative;
    overflow: hidden;
    display: grid;
    gap: 10px;
    align-content: center;
    padding: 16px 0;
  }

  .ticker-panel::before,
  .ticker-panel::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 1;
    width: 70px;
    pointer-events: none;
  }

  .ticker-panel::before {
    left: 0;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.95), transparent);
  }

  .ticker-panel::after {
    right: 0;
    background: linear-gradient(270deg, rgba(255, 255, 255, 0.95), transparent);
  }

  .ticker-row {
    display: flex;
    gap: 10px;
    width: max-content;
    animation: tickerMove 22s linear infinite;
  }

  .ticker-row-alt {
    animation-direction: reverse;
    animation-duration: 18s;
  }

  .ticker-row span {
    border: 1px solid rgba(15, 118, 110, 0.16);
    border-radius: 999px;
    background: rgba(240, 253, 250, 0.86);
    padding: 8px 14px;
    color: #115e59;
    font-size: 13px;
    font-weight: 900;
    white-space: nowrap;
  }

  .ticker-row-alt span {
    border-color: rgba(245, 158, 11, 0.22);
    background: rgba(255, 251, 235, 0.9);
    color: #92400e;
  }

  .catalog {
    padding: 28px 0 24px;
    animation: riseIn 680ms ease both;
    animation-delay: 110ms;
  }

  .catalog-toolbar {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    justify-content: center;
    padding: 12px 16px;
    background: transparent;
    pointer-events: none;
  }

  .catalog-toolbar-shell {
    display: inline-flex;
    max-width: 100%;
    overflow: visible;
    border: 1px solid #dbe4ea;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.94);
    padding: 10px 12px;
    backdrop-filter: blur(12px);
    pointer-events: auto;
  }

  .category-tabs {
    display: inline-flex;
    gap: 12px;
    overflow-x: auto;
    max-width: 100%;
    padding: 3px 2px 8px;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .category-tabs::-webkit-scrollbar {
    display: none;
  }

  .category-tab {
    flex: 0 0 auto;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #ffffff;
    padding: 9px 16px;
    color: #334155;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    transition: transform 160ms ease, border-color 160ms ease, color 160ms ease, background 160ms ease;
  }

  .category-tab:hover,
  .category-tab:focus-visible {
    border-color: #0f766e;
    color: #0f766e;
    outline: none;
    transform: translateY(-1px);
  }

  .category-tab.is-active {
    border-color: #0f766e;
    background: #0f766e;
    color: #ffffff;
  }

  .group-list {
    display: grid;
    gap: 72px;
    margin-top: 32px;
    padding-bottom: 96px;
  }

  .product-group {
    scroll-margin-top: 112px;
  }

  .product-subgroup {
    margin-top: 40px;
  }

  .group-header {
    margin-bottom: 12px;
  }

  .group-header h2 {
    margin: 0;
    color: #111827;
    font-size: 22px;
    line-height: 1.3;
  }

  .subgroup-header h3 {
    margin: 0;
    color: #111827;
    font-size: 21px;
    line-height: 1.3;
  }

  .group-header p {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 14px;
  }

  .table-shell {
    overflow: hidden;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 24px 70px rgba(15, 23, 42, 0.09);
    backdrop-filter: blur(8px);
  }

  .price-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .price-table thead {
    background: #f1f5f9;
    color: #475569;
    font-size: 14px;
  }

  .price-table th,
  .price-table td {
    padding: 14px 20px;
  }

  .price-table th {
    font-weight: 800;
  }

  .price-table tbody tr {
    border-top: 1px solid #e5e7eb;
    transition: background 160ms ease;
  }

  .price-table tbody tr:hover {
    background: linear-gradient(90deg, rgba(240, 253, 250, 0.82), rgba(255, 251, 235, 0.42));
  }

  .price-table tbody tr.is-offline {
    background: rgba(248, 250, 252, 0.72);
  }

  .price-table tbody tr.is-offline .product-name,
  .price-table tbody tr.is-offline .price-cell,
  .product-card.is-offline {
    color: #94a3b8;
  }

  .price-table tbody tr.is-offline .product-entry-name,
  .price-table tbody tr.is-offline .price-cell,
  .product-card.is-offline h3,
  .product-card.is-offline .price-value {
    opacity: 0.62;
  }

  .price-table tbody tr.is-offline .product-title-text,
  .price-table tbody tr.is-offline .price-cell,
  .product-card.is-offline .product-title-text,
  .product-card.is-offline .price-value {
    text-decoration: line-through;
    text-decoration-thickness: 2px;
    text-decoration-color: #94a3b8;
  }

  .product-name {
    color: #1f2937;
    font-size: 14px;
    line-height: 1.65;
  }

  .product-entry {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
  }

  .product-entry-name {
    min-width: 0;
    flex: 1 1 auto;
  }

  .offline-badge {
    display: inline-flex;
    align-items: center;
    margin-left: 8px;
    border: 1px solid #cbd5e1;
    border-radius: 999px;
    background: #f8fafc;
    padding: 1px 7px;
    color: #64748b;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.5;
    white-space: nowrap;
  }

  .product-doc-actions {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    flex: 0 0 auto;
    gap: 8px;
    white-space: nowrap;
  }

  .product-doc-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #0f766e;
    font-weight: 700;
    line-height: 1.65;
    text-align: left;
    text-decoration: none;
    white-space: nowrap;
  }

  .product-doc-link:hover {
    color: #0d9488;
  }

  .product-copy-button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex: 0 0 auto;
    border: 1px solid #cbd5e1;
    border-radius: 999px;
    background: #ffffff;
    padding: 2px 8px;
    color: #475569;
    font: inherit;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.4;
    cursor: pointer;
    transition: border-color 160ms ease, background 160ms ease, color 160ms ease;
  }

  .product-copy-button:hover,
  .product-copy-button:focus-visible {
    border-color: #0f766e;
    color: #0f766e;
    outline: none;
  }

  .product-copy-button.is-copied {
    border-color: #99f6e4;
    background: #f0fdfa;
    color: #0f766e;
  }

  .price-cell {
    width: 118px;
    white-space: nowrap;
    text-align: right;
    color: #334155;
    font-size: 16px;
    font-weight: 800;
  }

  .agent-price {
    color: #0f766e;
  }

  .status-cell {
    width: 94px;
    white-space: nowrap;
    text-align: center;
  }

  .channel-cell {
    width: 168px;
    color: #475569;
    font-size: 12px;
    line-height: 1.55;
    vertical-align: middle;
  }

  .channel-info {
    display: grid;
    gap: 4px;
    justify-items: start;
  }

  .channel-name {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #fed7aa;
    border-radius: 999px;
    background: #fff7ed;
    padding: 2px 8px;
    color: #9a3412;
    cursor: pointer;
    font: inherit;
    font-size: 12px;
    font-weight: 900;
    line-height: 1.5;
    white-space: nowrap;
  }

  .channel-name:hover,
  .channel-name:focus-visible {
    border-color: #fb923c;
    background: #ffedd5;
    outline: none;
  }

  .channel-link {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: #0f766e;
    font-weight: 800;
    text-decoration: none;
  }

  .channel-link:hover,
  .channel-link:focus-visible {
    color: #0d9488;
    outline: none;
    text-decoration: underline;
  }

  .channel-contact,
  .channel-empty {
    color: #64748b;
    font-weight: 700;
    word-break: break-word;
  }

  .channel-modal {
    width: min(100%, 520px);
  }

  .channel-modal-body {
    display: grid;
    gap: 12px;
  }

  .channel-store-link {
    width: fit-content;
    border: 1px solid #ccfbf1;
    border-radius: 999px;
    background: #f0fdfa;
    padding: 8px 12px;
  }

  .channel-modal-body .channel-contact {
    margin: 0;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #f8fafc;
    padding: 10px 12px;
    color: #334155;
  }

  .channel-modal-body .channel-contact strong {
    color: #111827;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 58px;
    border: 1px solid #cbd5e1;
    border-radius: 999px;
    background: #f8fafc;
    padding: 5px 10px;
    color: #64748b;
    font-size: 12px;
    font-weight: 900;
    line-height: 1.2;
  }

  .status-badge.is-active {
    border-color: #99f6e4;
    background: #f0fdfa;
    color: #0f766e;
  }

  .status-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: 0;
    background: transparent;
    padding: 0;
    color: #64748b;
    font: inherit;
    font-size: 12px;
    font-weight: 900;
    line-height: 1.2;
    cursor: pointer;
    transition: color 160ms ease;
  }

  .switch-track {
    position: relative;
    display: inline-flex;
    flex: 0 0 auto;
    width: 38px;
    height: 22px;
    border: 1px solid #cbd5e1;
    border-radius: 999px;
    background: #e2e8f0;
    transition: border-color 160ms ease, background 160ms ease;
  }

  .switch-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 14px;
    height: 14px;
    border-radius: 999px;
    background: #ffffff;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.2);
    transition: transform 160ms ease;
  }

  .status-toggle.is-active {
    color: #0f766e;
  }

  .status-toggle.is-active .switch-track {
    border-color: #5eead4;
    background: #0f766e;
  }

  .status-toggle.is-active .switch-thumb {
    transform: translateX(16px);
  }

  .status-toggle:hover,
  .status-toggle:focus-visible {
    color: #0f766e;
    outline: none;
  }

  .status-toggle:hover .switch-track,
  .status-toggle:focus-visible .switch-track {
    border-color: #0f766e;
  }

  .price-input-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    width: 100%;
    color: #334155;
    font-weight: 800;
  }

  .price-input-wrap input {
    width: 82px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #ffffff;
    padding: 6px 8px;
    color: #111827;
    font: inherit;
    font-size: 14px;
    font-weight: 800;
    text-align: right;
  }

  .price-input-wrap input:focus {
    border-color: #0f766e;
    outline: 2px solid rgba(15, 118, 110, 0.16);
  }

  .mobile-cards {
    display: none;
  }

  .product-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.94);
    padding: 16px;
    box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
  }

  .product-card h3 {
    margin: 0;
    color: #111827;
    font-size: 14px;
    line-height: 1.7;
  }

  .card-prices {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-top: 16px;
  }

  .card-status {
    display: flex;
    justify-content: flex-start;
    margin-top: 10px;
  }

  .product-card > .channel-info {
    margin-top: 10px;
  }

  .price-block {
    border-radius: 8px;
    background: #f1f5f9;
    padding: 12px;
  }

  .price-block.is-agent {
    background: #f0fdfa;
  }

  .price-block.is-profit {
    background: #fff7ed;
  }

  .price-label {
    color: #64748b;
    font-size: 12px;
    font-weight: 700;
  }

  .price-value {
    margin-top: 4px;
    color: #111827;
    font-size: 22px;
    font-weight: 900;
  }

  .price-block.is-agent .price-value {
    color: #0f766e;
  }

  .price-block.is-profit .price-value {
    color: #c2410c;
  }

  .profit-price {
    color: #c2410c;
  }

  .empty-state {
    border: 1px dashed #cbd5e1;
    border-radius: 10px;
    background: #ffffff;
    padding: 48px 20px;
    color: #64748b;
    text-align: center;
    font-size: 14px;
  }

  .trust-section {
    border-top: 1px solid #e5e7eb;
    background: linear-gradient(180deg, #ffffff, #f8fafc);
  }

  .trust-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
    padding: 32px 0;
  }

  .trust-item {
    display: flex;
    gap: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.82);
    padding: 16px;
    transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
  }

  .trust-item:hover {
    border-color: rgba(15, 118, 110, 0.28);
    box-shadow: 0 16px 36px rgba(15, 23, 42, 0.07);
    transform: translateY(-2px);
  }

  .trust-icon {
    flex: 0 0 auto;
    margin-top: 2px;
    color: #0f766e;
  }

  .trust-icon svg {
    width: 20px;
    height: 20px;
  }

  .trust-item h3 {
    margin: 0;
    color: #111827;
    font-size: 16px;
  }

  .trust-item p {
    margin: 4px 0 0;
    color: #475569;
    font-size: 14px;
    line-height: 1.65;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100dvh;
    overflow-y: auto;
    background: rgba(15, 23, 42, 0.42);
    padding: 20px;
    animation: fadeIn 160ms ease both;
  }

  .agent-modal {
    display: flex;
    flex-direction: column;
    width: min(100%, 460px);
    max-height: calc(100dvh - 40px);
    border: 1px solid #dbe4ea;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 24px 80px rgba(15, 23, 42, 0.22);
    overflow: hidden;
    animation: modalRise 220ms ease both;
  }

  .agent-modal-header,
  .agent-modal-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 18px 20px;
  }

  .agent-modal-header {
    border-bottom: 1px solid #e5e7eb;
  }

  .agent-modal-header h2 {
    margin: 0;
    color: #111827;
    font-size: 22px;
  }

  .agent-modal-header p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 14px;
  }

  .modal-close {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border: 1px solid #e5e7eb;
    border-radius: 999px;
    background: #ffffff;
    color: #475569;
    cursor: pointer;
  }

  .confirm-modal {
    position: relative;
  }

  .confirm-modal .agent-modal-header {
    padding-right: 58px;
  }

  .confirm-modal .modal-close {
    position: absolute;
    top: 18px;
    right: 18px;
    border-color: #dbe4ea;
    background: #f8fafc;
  }

  .confirm-modal .modal-close:hover {
    border-color: #94a3b8;
    background: #f1f5f9;
    color: #111827;
  }

  .agent-modal-body {
    overflow-y: auto;
    padding: 20px;
    color: #1f2937;
    font-size: 15px;
    line-height: 1.75;
  }

  .agent-modal-body p {
    margin: 0 0 10px;
  }

  .agent-note {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    border: 1px solid #ccfbf1;
    border-radius: 12px;
    background: #f0fdfa;
    padding: 12px 14px;
    color: #115e59;
    font-size: 14px;
    font-weight: 700;
  }

  .agent-modal-actions {
    justify-content: flex-end;
    border-top: 1px solid #e5e7eb;
  }

  .agent-modal-actions .button {
    justify-content: center;
    min-width: 102px;
  }

  .login-form {
    display: grid;
    gap: 14px;
  }

  .login-form label {
    display: grid;
    gap: 6px;
    color: #334155;
    font-size: 14px;
    font-weight: 800;
  }

  .login-form input {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 10px 12px;
    color: #111827;
    font: inherit;
  }

  .login-form input:focus {
    border-color: #0f766e;
    outline: 2px solid rgba(15, 118, 110, 0.16);
  }

  .form-error {
    margin: 0;
    color: #dc2626;
    font-size: 13px;
    font-weight: 800;
  }

  .admin-floating-actions {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 30;
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid #dbe4ea;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.94);
    padding: 8px;
    box-shadow: 0 18px 50px rgba(15, 23, 42, 0.16);
    backdrop-filter: blur(12px);
  }

  .admin-floating-actions .button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    transform: none;
  }

  .admin-badge {
    border-radius: 999px;
    background: #111827;
    padding: 8px 10px;
    color: #ffffff;
    font-size: 13px;
    font-weight: 900;
  }

  .confirm-modal {
    width: min(100%, 430px);
  }

  .site-toast {
    position: fixed;
    left: 50%;
    bottom: 24px;
    z-index: 60;
    transform: translateX(-50%);
    border-radius: 999px;
    background: #111827;
    padding: 10px 16px;
    color: #ffffff;
    font-size: 14px;
    font-weight: 800;
    box-shadow: 0 18px 45px rgba(15, 23, 42, 0.22);
  }

  .price-change-modal {
    width: min(100%, 620px);
  }

  .price-change-list {
    display: grid;
    gap: 12px;
  }

  .price-change-item {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: linear-gradient(135deg, #ffffff, #f8fafc);
    padding: 12px 14px;
  }

  .price-change-item strong {
    display: block;
    color: #111827;
    font-size: 14px;
    line-height: 1.55;
  }

  .price-change-item span {
    display: block;
    margin-top: 2px;
    color: #64748b;
    font-size: 12px;
  }

  .price-change-item p {
    margin: 8px 0 0;
    color: #0f766e;
    font-weight: 900;
  }

  .icon-sm {
    width: 16px;
    height: 16px;
  }

  .icon-xs {
    width: 14px;
    height: 14px;
  }

  @media (max-width: 900px) {
    .trust-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 720px) {
    .container {
      width: min(100% - 24px, 1120px);
    }

    .topbar {
      align-items: flex-start;
      flex-direction: column;
      gap: 14px;
    }

    .top-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      width: 100%;
    }

    .button {
      justify-content: center;
      min-width: 0;
      padding: 9px 10px;
      font-size: 13px;
    }

    .hero-inner {
      gap: 14px;
      padding: 18px 0;
    }

    .brand-mark {
      font-size: 16px;
    }

    .hero-summary {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      width: 100%;
    }

    .hero-showcase {
      grid-template-columns: 1fr;
    }

    .signal-card-title {
      font-size: 24px;
    }

    .hero-summary span {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 34px;
      padding: 6px 8px;
      text-align: center;
    }

    .catalog-toolbar {
      padding: 10px 12px;
    }

    .catalog-toolbar-shell {
      display: flex;
      width: 100%;
      padding: 10px;
      border-radius: 14px;
    }

    .category-tabs {
      gap: 6px;
      display: flex;
      width: 100%;
      justify-content: flex-start;
      padding: 3px 2px 8px;
    }

    .category-tab {
      padding: 8px 10px;
      font-size: 13px;
    }

    .product-entry {
      gap: 10px;
    }

    .product-doc-actions {
      gap: 6px;
    }

    .group-list {
      gap: 56px;
      padding-bottom: 56px;
    }

    .table-shell {
      display: none;
    }

    .mobile-cards {
      display: grid;
      gap: 12px;
    }

    .price-input-wrap {
      justify-content: flex-start;
    }

    .admin-floating-actions {
      right: 10px;
      bottom: 10px;
      left: 10px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .trust-grid {
      grid-template-columns: 1fr;
    }

    .modal-backdrop {
      align-items: flex-start;
      padding: 16px;
    }

    .agent-modal {
      max-height: calc(100dvh - 32px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 1ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
      transition-duration: 1ms !important;
    }
  }

  @keyframes riseIn {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes softPop {
    from {
      opacity: 0;
      transform: translateY(6px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes pulseDot {
    0%,
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 5px rgba(245, 158, 11, 0.16);
    }
    50% {
      transform: scale(0.78);
      box-shadow: 0 0 0 9px rgba(245, 158, 11, 0.08);
    }
  }

  @keyframes tickerMove {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-50%);
    }
  }

  @keyframes auroraSweep {
    from {
      transform: translateX(-8%);
      opacity: 0.7;
    }
    to {
      transform: translateX(8%);
      opacity: 1;
    }
  }

  @keyframes gridDrift {
    from {
      background-position: 0 0, 0 0;
    }
    to {
      background-position: 36px 36px, 36px 36px;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes modalRise {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;
