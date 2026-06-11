import type { ProductGroup } from "../products";
import { lemonWatermelonChannel, wangliuChannel } from "../channels";

export const grokGroup: ProductGroup = {
  id: "grok",
  name: "Grok 系列",
  products: [
    {
      name: "SuperGrok 官方直充 1个月会员【质保订阅30天】",
      cost: 65,
      retail: 128,
      primaryAgent: 75,
      secondaryAgent: 85,
      docUrl: "https://www.yuque.com/u8042174/kb/dgvudgqubz32eii4?singleDoc#",
      channel: lemonWatermelonChannel
    },
    {
      name: "SuperGrok 官方直充 1年会员【质保订阅365天】",
      cost: 588,
      retail: 728,
      primaryAgent: 613,
      secondaryAgent: 623,
      docUrl: "https://www.yuque.com/u8042174/kb/hhq0v56ntgkkvosh?singleDoc#",
      channel: wangliuChannel
    }
  ]
};
