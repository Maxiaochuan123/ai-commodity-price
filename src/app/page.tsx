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
