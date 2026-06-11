import { chatgptGroup } from "./products/chatgpt";
import { claudeGroup } from "./products/claude";
import { geminiGroup } from "./products/gemini";
import { googleGroup } from "./products/google";
import { grokGroup } from "./products/grok";
import { telegramGroup } from "./products/telegram";

export type Product = {
  id?: string;
  name: string;
  active?: boolean;
  channel?: ProductChannel;
  cost: number;
  retail: number;
  primaryAgent: number;
  secondaryAgent?: number;
  docUrl?: string;
};

export type ProductChannel = {
  contacts?: {
    label: string;
    value: string;
  }[];
  name: string;
  storeUrl?: string;
};

export type ProductGroup = {
  id: string;
  name: string;
  products: Product[];
  subgroups?: {
    name: string;
    products: Product[];
  }[];
};

export const contact = {
  wechat: "mxcsgnh",
  proofUrl: "https://www.yuque.com/u8042174/kb/blw1efg3dfnuaxh6?singleDoc# 《真实成交图片》",
  proofText: "真实成交图片"
};

const rawProductGroups: ProductGroup[] = [
  chatgptGroup,
  claudeGroup,
  geminiGroup,
  googleGroup,
  grokGroup,
  telegramGroup
];

export const productGroups: ProductGroup[] = rawProductGroups.map((group) => {
  const fillId = (p: Product, index: number, prefix = "") => ({
    ...p,
    id: p.id || `${group.id}${prefix}-${index}`
  });

  return {
    ...group,
    products: group.products.map((p, idx) => fillId(p, idx)),
    subgroups: group.subgroups?.map((sub) => ({
      ...sub,
      products: sub.products.map((p, idx) => fillId(p, idx, `-${sub.name}`))
    }))
  };
});

export const allProducts = productGroups.flatMap((group) =>
  [...group.products, ...(group.subgroups ?? []).flatMap((subgroup) => subgroup.products)].map((product) => ({
    ...product,
    groupId: group.id,
    groupName: group.name
  }))
);
