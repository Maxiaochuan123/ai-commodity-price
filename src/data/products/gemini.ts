import type { ProductGroup } from "../products";
import { planktonChannel } from "../channels";

export const geminiGroup: ProductGroup = {
  id: "gemini",
  name: "Gemini 系列",
  products: [
    {
      name: "Gemini Pro 1年订阅成品号",
      cost: 15,
      retail: 38,
      agent: 5,
      docUrl: "https://www.yuque.com/u8042174/kb/zk0lqnv0fui9v94w",
      channel: planktonChannel
    },
    {
      name: "Gemini Pro 1年 官方直充【质保1年】【Pixel自动绑卡丝滑激活】",
      cost: 39,
      retail: 89,
      agent: 15,
      docUrl: "https://www.yuque.com/u8042174/kb/gtadnlkp2c0cgfyb?singleDoc#",
      channel: planktonChannel
    },
  ]
};
