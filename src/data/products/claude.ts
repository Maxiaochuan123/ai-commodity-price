import type { ProductGroup } from "../products";
import {
  lemonWatermelonChannel,
  planktonChannel,
  wufengChannel
} from "../channels";

export const claudeGroup: ProductGroup = {
  id: "claude",
  name: "Claude 系列",
  products: [
    {
      name: "Claude Pro 1个月 官方直充【仅保证正规渠道】【无其他质保】",
      cost: 100,
      retail: 148,
      agent: 10,
      docUrl: "https://www.yuque.com/u8042174/kb/cp8vmveom283hqmg?singleDoc#",
      channel: lemonWatermelonChannel
    },
    {
      name: "Claude MAX 5x 1个月 成品号【已过KYC认证】【质保订阅】【可开发票】",
      cost: 660,
      retail: 858,
      agent: 48,
      docUrl: "https://www.yuque.com/u8042174/kb/apavgzlvissdz3e3?singleDoc#",
      channel: wufengChannel
    },
    {
      name: "Claude MAX 20x 1个月 成品号【已过KYC认证】【质保订阅】【可开发票】",
      cost: 930,
      retail: 1298,
      agent: 98,
      docUrl: "https://www.yuque.com/u8042174/kb/apavgzlvissdz3e3?singleDoc#",
      channel: wufengChannel
    },
    {
      name: "Claude KYC 认证服务【秒封不收费】",
      cost: 55,
      retail: 98,
      agent: 10,
      docUrl: "https://www.yuque.com/u8042174/kb/ymhnuv3ci6pfv8ga?singleDoc#",
      channel: planktonChannel
    }
  ],
  subgroups: [
    {
      name: "Claude 系列【黑充，无质保！无质保！无质保！】",
      products: [
        {
          name: "Claude Pro 5x 1个月 成品号/黑充【无质保！无质保！无质保！】",
          cost: 430,
          retail: 530,
          agent: 48,
          docUrl: "https://www.yuque.com/u8042174/kb/useot3mtc2ofki0h?singleDoc#",
          channel: lemonWatermelonChannel
        }
      ]
    }
  ]
};
