import type { ProductGroup } from "../products";
import {
  chatgptCodexPhoneCode2Channel,
  lemonWatermelonChannel,
  planktonChannel,
  wufengChannel
} from "../channels";

export const chatgptGroup: ProductGroup = {
  id: "chatgpt",
  name: "ChatGPT 系列",
  products: [
    {
      name: "GptPlus 手机号接码【实体卡 长效30天左右】【无惧二次验证】",
      cost: 6.7,
      retail: 18,
      agent: 3,
      docUrl: "https://www.yuque.com/u8042174/kb/cl1zwst44tqd09er?singleDoc#",
      channel: chatgptCodexPhoneCode2Channel
    },
    {
      name: "GptPlus 1个月直充【土耳其渠道】【无其他质保】",
      cost: 88,
      retail: 118,
      agent: 10,
      docUrl: "https://www.yuque.com/u8042174/kb/cqmvx33vg7rct7d7?singleDoc#",
      channel: lemonWatermelonChannel
    },
    {
      name: "GptPlus 1个月直充【老牌土耳其IOS渠道】【质保订阅 30天】",
      cost: 95,
      retail: 138,
      agent: 15,
      docUrl: "https://www.yuque.com/u8042174/kb/xc6oydbfh9wnbwbe?singleDoc#",
      channel: planktonChannel
    },
    {
      name: "GptPro 5x 1个月埃及官方直充/成品号【质保订阅 30天】【可开发票】",
      cost: 660,
      retail: 758,
      agent: 48,
      docUrl: "https://www.yuque.com/u8042174/kb/tfros8clq21op37p?singleDoc#",
      channel: wufengChannel
    },
    {
      name: "GptPro 20x 1个月菲律官方直充/成品号【质保订阅 30天】【可开发票】",
      cost: 1100,
      retail: 1298,
      agent: 98,
      docUrl: "https://www.yuque.com/u8042174/kb/tfros8clq21op37p?singleDoc#",
      channel: wufengChannel
    },
  ],
  subgroups: [
    {
      name: "ChatGPT 系列【黑充，无质保！无质保！无质保！】",
      products: [
        {
          name: "GptPro 5x 1个月黑充【无质保！无质保！无质保！】",
          cost: 300,
          retail: 398,
          agent: 48,
          docUrl: "https://www.yuque.com/u8042174/kb/useot3mtc2ofki0h?singleDoc#",
          channel: lemonWatermelonChannel
        },
        {
          name: "GptPro 20x 1个月黑充【无质保！无质保！无质保！】",
          cost: 430,
          retail: 628,
          agent: 98,
          docUrl: "https://www.yuque.com/u8042174/kb/useot3mtc2ofki0h?singleDoc#",
          channel: lemonWatermelonChannel
        }
      ]
    }
  ]
};
