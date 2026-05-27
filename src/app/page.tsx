import type { ReactNode } from "react";
import { ArrowUpRight, BadgeCheck, MessageCircle, ShieldCheck, Sparkles, Users } from "lucide-react";
import { PriceCatalog } from "@/components/price-catalog";
import { allProducts, contact, productGroups } from "@/data/products";

const formatter = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 1
});

function formatPrice(price: number) {
  return formatter.format(price);
}

export default function Home() {
  const productCount = allProducts.length;
  const lowestPrice = Math.min(...allProducts.map((product) => product.agent));
  const highestPrice = Math.max(...allProducts.map((product) => product.retail));

  return (
    <main className="min-h-screen">
      <section className="border-b border-line bg-white/82">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
          <nav className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand">
              <Sparkles className="h-4 w-4" />
              AI 数字商品价目表
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <a
                className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-3 py-2 transition hover:border-brand hover:text-brand"
                href={contact.proofUrl}
                rel="noreferrer"
                target="_blank"
              >
                {contact.proofText}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <a
                className="inline-flex items-center gap-1 rounded-md bg-ink px-3 py-2 font-semibold text-white transition hover:bg-slate-700"
                href={`weixin://`}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                微信：{contact.wechat}
              </a>
            </div>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="mb-3 inline-flex rounded-md border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800">
                160+ 售后群 · 招代理 · 可合作
              </p>
              <h1 className="max-w-3xl text-4xl font-bold tracking-normal text-ink sm:text-5xl">
                AI 产品价格
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                ChatGPT、Claude、Google、Grok、Telegram 等产品价格集中展示，支持快速查看零售价与代理价。
              </p>
            </div>

            <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-line bg-white shadow-soft">
              <Metric label="商品" value={`${productCount}`} />
              <Metric label="代理起" value={`¥${formatPrice(lowestPrice)}`} />
              <Metric label="最高价" value={`¥${formatPrice(highestPrice)}`} />
            </div>
          </div>
        </div>
      </section>

      <PriceCatalog groups={productGroups} />

      <section className="border-t border-line bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
          <TrustItem icon={<BadgeCheck className="h-5 w-5" />} title="真实成交可查" text="公开成交图片，方便下单前核验。" />
          <TrustItem icon={<ShieldCheck className="h-5 w-5" />} title="售后群支持" text="160+ 售后群沉淀，交付和售后更稳。" />
          <TrustItem icon={<Users className="h-5 w-5" />} title="代理合作" text={`添加微信 ${contact.wechat} 咨询代理价。`} />
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-line px-4 py-5 last:border-r-0">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-ink">{value}</div>
    </div>
  );
}

function TrustItem({ icon, text, title }: { icon: ReactNode; text: string; title: string }) {
  return (
    <div className="flex gap-3 rounded-lg border border-line bg-slate-50 p-4">
      <div className="mt-0.5 text-brand">{icon}</div>
      <div>
        <h3 className="font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
      </div>
    </div>
  );
}
