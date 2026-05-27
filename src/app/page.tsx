import type { ReactNode } from "react";
import { ArrowUpRight, BadgeCheck, MessageCircle, ShieldCheck, Sparkles, Users } from "lucide-react";
import { PriceCatalog } from "@/components/price-catalog";
import { contact, productGroups } from "@/data/products";

export default function Home() {
  return (
    <main className="price-page">
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />

      <section className="hero">
        <div className="container hero-inner">
          <nav className="topbar">
            <div className="brand-mark">
              <Sparkles className="icon-sm" />
              AI 数字商品价目表
            </div>
            <div className="top-actions">
              <a className="button button-secondary" href={contact.proofUrl} rel="noreferrer" target="_blank">
                {contact.proofText}
                <ArrowUpRight className="icon-xs" />
              </a>
              <a className="button button-primary" href="weixin://">
                <MessageCircle className="icon-xs" />
                微信：{contact.wechat}
              </a>
            </div>
          </nav>

          <div className="hero-grid">
            <div>
              <p className="eyebrow">160+ 售后群 · 招代理 · 可合作</p>
              <h1>AI 产品价格</h1>
              <p className="hero-copy">
                ChatGPT、Claude、Google、Grok、Telegram 等产品价格集中展示，支持快速查看零售价与代理价。
              </p>
            </div>
          </div>
        </div>
      </section>

      <PriceCatalog groups={productGroups} />

      <section className="trust-section">
        <div className="container trust-grid">
          <TrustItem icon={<BadgeCheck />} title="真实成交可查" text="公开成交图片，方便下单前核验。" />
          <TrustItem icon={<ShieldCheck />} title="售后群支持" text="160+ 售后群沉淀，交付和售后更稳。" />
          <TrustItem icon={<Users />} title="代理合作" text={`添加微信 ${contact.wechat} 咨询代理价。`} />
        </div>
      </section>
    </main>
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
    background: linear-gradient(180deg, rgba(15, 118, 110, 0.08), rgba(248, 250, 252, 0) 360px), #f8fafc;
    color: #111827;
  }

  .container {
    width: min(100% - 32px, 1120px);
    margin: 0 auto;
  }

  .hero {
    border-bottom: 1px solid #e5e7eb;
    background: rgba(255, 255, 255, 0.88);
  }

  .hero-inner {
    display: flex;
    flex-direction: column;
    gap: 32px;
    padding: 32px 0;
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
    font-size: 14px;
    font-weight: 700;
  }

  .top-actions {
    flex-wrap: wrap;
    gap: 8px;
  }

  .button {
    min-height: 40px;
    gap: 6px;
    border-radius: 8px;
    padding: 8px 12px;
    color: inherit;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    transition: border-color 160ms ease, background 160ms ease, color 160ms ease;
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

  .button-primary {
    border: 1px solid #111827;
    background: #111827;
    color: #ffffff;
  }

  .button-primary:hover {
    background: #334155;
  }

  .hero-grid {
    max-width: 760px;
  }

  .catalog {
    padding: 24px 0;
  }

  .catalog-toolbar {
    position: sticky;
    top: 0;
    z-index: 10;
    margin: 0 calc((100% - min(100% - 32px, 1120px)) / -2);
    border-bottom: 1px solid #e5e7eb;
    background: rgba(248, 250, 252, 0.95);
    padding: 16px calc((100% - min(100% - 32px, 1120px)) / 2);
    backdrop-filter: blur(12px);
  }

  .toolbar-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .search-wrap {
    position: relative;
    display: block;
    width: min(100%, 380px);
  }

  .search-wrap .icon-sm {
    position: absolute;
    left: 12px;
    top: 50%;
    color: #94a3b8;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    height: 44px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #ffffff;
    padding: 0 12px 0 40px;
    color: #111827;
    font-size: 14px;
    outline: 0;
    transition: border-color 160ms ease, box-shadow 160ms ease;
  }

  .search-input:focus {
    border-color: #0f766e;
    box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.16);
  }

  .category-tabs {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .category-tab {
    flex: 0 0 auto;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #ffffff;
    padding: 8px 12px;
    color: #334155;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    transition: border-color 160ms ease, color 160ms ease;
  }

  .category-tab:hover {
    border-color: #0f766e;
    color: #0f766e;
  }

  .group-list {
    display: grid;
    gap: 32px;
    margin-top: 32px;
  }

  .product-group {
    scroll-margin-top: 112px;
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

  .group-header p {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 14px;
  }

  .table-shell {
    overflow: hidden;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #ffffff;
    box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
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
    background: rgba(240, 253, 250, 0.72);
  }

  .product-name {
    color: #1f2937;
    font-size: 14px;
    line-height: 1.65;
  }

  .price-cell {
    width: 112px;
    white-space: nowrap;
    text-align: right;
    color: #334155;
    font-size: 16px;
    font-weight: 800;
  }

  .agent-price {
    color: #0f766e;
  }

  .mobile-cards {
    display: none;
  }

  .product-card {
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #ffffff;
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

  .price-block {
    border-radius: 8px;
    background: #f1f5f9;
    padding: 12px;
  }

  .price-block.is-agent {
    background: #f0fdfa;
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
    background: #ffffff;
  }

  .trust-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    padding: 32px 0;
  }

  .trust-item {
    display: flex;
    gap: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #f8fafc;
    padding: 16px;
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

  .icon-sm {
    width: 16px;
    height: 16px;
  }

  .icon-xs {
    width: 14px;
    height: 14px;
  }

  @media (max-width: 900px) {
    .toolbar-inner,
    .trust-grid {
      grid-template-columns: 1fr;
    }

    .toolbar-inner {
      display: flex;
      flex-direction: column;
      align-items: stretch;
    }

    .search-wrap {
      width: 100%;
    }
  }

  @media (max-width: 720px) {
    .container {
      width: min(100% - 24px, 1120px);
    }

    .topbar {
      align-items: flex-start;
      flex-direction: column;
    }

    .top-actions {
      width: 100%;
    }

    .button {
      justify-content: center;
      flex: 1 1 160px;
    }

    .hero-inner {
      padding: 24px 0;
    }

    h1 {
      font-size: 40px;
    }

    .catalog-toolbar {
      margin: 0 -12px;
      padding: 14px 12px;
    }

    .table-shell {
      display: none;
    }

    .mobile-cards {
      display: grid;
      gap: 12px;
    }

    .trust-grid {
      grid-template-columns: 1fr;
    }
  }
`;
