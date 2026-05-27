export type Product = {
  name: string;
  retail: number;
  agent: number;
};

export type ProductGroup = {
  id: string;
  name: string;
  products: Product[];
};

export const contact = {
  wechat: "mxcsgnh",
  proofUrl: "https://www.yuque.com/u8042174/kb/blw1efg3dfnuaxh6?singleDoc#",
  proofText: "真实成交图片"
};

export const productGroups: ProductGroup[] = [
  {
    id: "chatgpt",
    name: "ChatGPT 系列",
    products: [
      { name: "Codex 手机号接码", retail: 10, agent: 2.5 },
      { name: "Gpt Plus 日抛 Sub2/Cpa格式【已过手机接码】", retail: 10, agent: 3.5 },
      {
        name: "GPT Plus 1个月成品号【100单平均 大部分存活超过半个月 2~3单 4-5天】【无质保，介意勿购】",
        retail: 48,
        agent: 30
      },
      { name: "GPT Plus 1个月直充【保证正规渠道充值，无其他质保】", retail: 118, agent: 96 },
      { name: "GPT Plus 1个月直充【IOS老牌土区稳定】【质保订阅 30天】", retail: 138, agent: 106 },
      { name: "GPT Pro 5x 1个月直充【质保 30天】【可开发票】", retail: 758, agent: 718 },
      { name: "GPT Pro 20x 1个月直充【质保 30天】【可开发票】", retail: 1288, agent: 1178 },
      { name: "GPT Cyber(TAC) KYC 认证服务", retail: 88, agent: 66 }
    ]
  },
  {
    id: "claude",
    name: "Claude 系列",
    products: [
      { name: "Claude Pro 1个月 官方直充【保证正规渠道充值，无其他质保】", retail: 148, agent: 118 },
      { name: "Claude MAX 5x 成品号【质保订阅/封号30天】【预定制】【可开发票】", retail: 858, agent: 740 },
      { name: "Claude MAX 20x 1个月成品号【质保订阅/封号30天】【预定制】【可开发票】", retail: 1588, agent: 1338 },
      { name: "Claude MAX 20x 1个月成品号【无质保】【预定制】【可开发票】", retail: 838, agent: 728 },
      { name: "Claude KYC 认证服务", retail: 88, agent: 66 },
      { name: "Claude MAX 5x 成品号【质保订阅30天】【已过KYC认证】", retail: 968, agent: 868 },
      { name: "Claude MAX 20x 官方直充【质保订阅30天】【可开发票】", retail: 1288, agent: 938 }
    ]
  },
  {
    id: "google",
    name: "Google 系列",
    products: [
      { name: "Gemini Pro 1年订阅成品号", retail: 38, agent: 22 },
      { name: "Gemini Pro 1年 官方直充【质保1年】【Pixel自动绑卡丝滑激活】", retail: 69, agent: 49 },
      { name: "google邮箱【稳定老号】【22-24年】", retail: 16, agent: 8.5 }
    ]
  },
  {
    id: "grok",
    name: "Grok 系列",
    products: [
      { name: "SuperGrok 官方直充 1个月会员【质保订阅30天】", retail: 106, agent: 85 },
      { name: "SuperGrok 官方直充 1年会员【质保订阅365天】", retail: 698, agent: 626 }
    ]
  },
  {
    id: "telegram",
    name: "Telegram 系列",
    products: [
      { name: "1个月新号", retail: 28, agent: 16 },
      { name: "半年~1年", retail: 38, agent: 26 },
      { name: "2-3年", retail: 68, agent: 36 },
      { name: "4年+", retail: 98, agent: 46 }
    ]
  }
];

export const allProducts = productGroups.flatMap((group) =>
  group.products.map((product) => ({
    ...product,
    groupId: group.id,
    groupName: group.name
  }))
);
