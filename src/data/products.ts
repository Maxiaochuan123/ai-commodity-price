export type Product = {
  id: string;
  name: string;
  active?: boolean;
  channel?: ProductChannel;
  cost: number;
  retail: number;
  agent: number;
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

const productChannels: Record<string, ProductChannel> = {
  "chatgpt-codex-phone-code": {
    contacts: [{ label: "TG", value: "https://t.me/freeteamxz" }],
    name: "GPT专卖-cw",
    storeUrl: "https://caowo.store/cat/2"
  },
  "chatgpt-codex-phone-code-2": {
    contacts: [{ label: "QQ群", value: "1085440916" }],
    name: "Plus源头",
    storeUrl: "https://pay.ldxp.cn/shop/IY16OXB7"
  },
  "chatgpt-plus-account-1m-no-warranty": {
    contacts: [{ label: "QQ号", value: "634016189" }],
    name: "QQ渠道"
  },
  "chatgpt-plus-direct-1m-standard": {
    contacts: [{ label: "QQ号", value: "3488303242" }],
    name: "柠檬西瓜",
    storeUrl: "https://lemon-watermelon.com/user/recharge"
  },
  "grok-supergrok-direct-1m": {
    contacts: [{ label: "QQ号", value: "3488303242" }],
    name: "柠檬西瓜",
    storeUrl: "https://lemon-watermelon.com/user/recharge"
  },
  "claude-channel2-max-5x-account-1m-kyc": {
    contacts: [
      { label: "微信号", value: "q1796ty，ye73u2g" },
      { label: "QQ号", value: "3910731708" }
    ],
    name: "无风"
  },
  "claude-channel2-max-20x-account-1m-kyc": {
    contacts: [
      { label: "微信号", value: "q1796ty，ye73u2g" },
      { label: "QQ号", value: "3910731708" }
    ],
    name: "无风"
  },
  "grok-supergrok-direct-1y": {
    contacts: [{ label: "QQ号", value: "2393739708" }],
    name: "网流工作室",
    storeUrl: "https://pay.ldxp.cn/shop/SIS7JIN8"
  }
};

const planktonChannel: ProductChannel = {
  contacts: [
    { label: "微信", value: "rc336027" },
    { label: "QQ群", value: "1102757222" }
  ],
  name: "痞老板",
  storeUrl: "https://pay.ldxp.cn/shop/plankton"
};

for (const productId of [
  "chatgpt-plus-direct-1m-ios-tr",
  "chatgpt-cyber-tac-kyc",
  "chatgpt-pro-20x-direct-1m",
  "chatgpt-pro-5x-direct-1m",
  "claude-kyc",
  "claude-max-20x-account-1m-no-warranty",
  "claude-max-20x-account-1m-preorder",
  "claude-max-5x-account-1m-preorder",
  "claude-pro-direct-1m-standard",
  "google-gmail-old-22-24",
  "google-gemini-pro-direct-1y-pixel",
  "google-gemini-pro-account-1y"
]) {
  productChannels[productId] = planktonChannel;
}

const rawProductGroups: ProductGroup[] = [
  {
    id: "chatgpt",
    name: "ChatGPT 系列",
    products: [
      {
        id: "chatgpt-codex-phone-code",
        name: "Codex 手机号接码【虚拟卡 一次性】",
        cost: 0.9,
        retail: 10,
        agent: 2.5,
        docUrl: "https://www.yuque.com/u8042174/kb/pog9pz364owob5bg?singleDoc# 《Codex 手机接码教程》"
      },
      {
        id: "chatgpt-codex-phone-code-2",
        name: "Codex 手机号接码【实体卡 长效31~90天】【无惧二次验证】",
        cost: 6,
        retail: 16,
        agent: 9,
        docUrl: "https://www.yuque.com/u8042174/kb/pog9pz364owob5bg?singleDoc# 《Codex 手机接码教程》"
      },
      {
        id: "chatgpt-plus-day-sub2-cpa",
        name: "Gpt Plus 日抛 Sub2/Cpa格式【已过手机接码】",
        cost: 3,
        retail: 10,
        agent: 4,
        docUrl: "https://www.yuque.com/u8042174/kb/kvm4yl8dnh69eypc?singleDoc# 《Codex 日抛 sub2 使用教程》"
      },
      {
        id: "chatgpt-plus-account-1m-no-warranty",
        name: "GPT Plus 1个月成品号 10单起售【100单 中 90% 活超过半个月 10% 一周左右】【无质保，介意勿购】",
        cost: 25,
        retail: 48,
        agent: 30
      },
      {
        id: "chatgpt-plus-direct-1m-standard",
        name: "GPT Plus 1个月直充【保证正规渠道充值，无其他质保】",
        cost: 88,
        retail: 118,
        agent: 96,
        docUrl: "https://www.yuque.com/u8042174/kb/cqmvx33vg7rct7d7?singleDoc# 《GPT Plus土区官方直充月卡【保证正规充值其他无质保】》"
      },
      {
        id: "chatgpt-plus-direct-1m-ios-tr",
        name: "GPT Plus 1个月直充【IOS老牌土区稳定】【质保订阅 30天】",
        cost: 95,
        retail: 138,
        agent: 106,
        docUrl: "https://www.yuque.com/u8042174/kb/xc6oydbfh9wnbwbe?singleDoc# 《GPT Plus 1个月直充【IOS老牌土区稳定】【质保订阅 30天】》"
      },
      {
        id: "chatgpt-pro-5x-direct-1m",
        name: "GPT Pro 5x 1个月直充【质保订阅 30天】【可开发票】",
        cost: 690,
        retail: 758,
        agent: 718,
        docUrl: "https://www.yuque.com/u8042174/kb/kllzfrv73xxvmwhc?singleDoc# 《GPT Pro 5x 1个月直充【质保订阅 30天】【可开发票】》"
      },
      {
        id: "chatgpt-pro-20x-direct-1m",
        name: "GPT Pro 20x 1个月直充【质保订阅 30天】【可开发票】",
        cost: 1150,
        retail: 1288,
        agent: 1178,
        docUrl: "https://www.yuque.com/u8042174/kb/ik28za8v1h2g1e6t?singleDoc# 《GPT Pro 20x 1个月直充【质保订阅 30天】【可开发票】》"
      },
      {
        id: "chatgpt-cyber-tac-kyc",
        name: "GPT Cyber(TAC) KYC 认证服务",
        cost: 55,
        retail: 88,
        agent: 66,
        docUrl: "https://www.yuque.com/u8042174/kb/zs2eop2qoxteului?singleDoc# 《GPT Cyber(TAC) KYC 认证服务》"
      }
    ]
  },
  {
    id: "claude",
    name: "Claude 系列",
    products: [
      {
        id: "claude-pro-direct-1m-standard",
        name: "Claude Pro 1个月 官方直充【仅保证正规尼区】【无其他质保】",
        cost: 100,
        retail: 148,
        agent: 118,
        docUrl: "https://www.yuque.com/u8042174/kb/cp8vmveom283hqmg?singleDoc# 《Claude Pro 1个月 官方直充【仅保证正规尼区】【无其他质保】》"
      },
      {
        id: "claude-max-5x-account-1m-preorder",
        name: "Claude MAX 5x 1个月成品号【质保订阅/封号30天】【预定制】【可开发票】",
        cost: 720,
        retail: 858,
        agent: 740,
        docUrl: "https://www.yuque.com/u8042174/kb/apavgzlvissdz3e3?singleDoc# 《Claude MAX 5x 成品号【质保订阅/封号30天】【预定制】》"
      },
      {
        id: "claude-max-20x-account-1m-preorder",
        name: "Claude MAX 20x 1个月成品号【质保订阅/封号30天】【预定制】【可开发票】",
        cost: 1390,
        retail: 1588,
        agent: 1338,
        docUrl: "https://www.yuque.com/u8042174/kb/lborbzimcmhgg3lp?singleDoc# 《Claude MAX 20x 成品号【质保订阅/封号30天】【预定制】》"
      },
      {
        id: "claude-max-20x-account-1m-no-warranty",
        name: "Claude MAX 20x 1个月成品号【无质保】【预定制】【可开发票】",
        cost: 680,
        retail: 838,
        agent: 728,
        docUrl: "https://www.yuque.com/u8042174/kb/gggi0vooedag0gbb?singleDoc# 《Claude MAX 20x 成品号【预定制】》"
      },
      {
        id: "claude-kyc",
        name: "Claude KYC 认证服务",
        cost: 55,
        retail: 88,
        agent: 66,
        docUrl: "https://www.yuque.com/u8042174/kb/ymhnuv3ci6pfv8ga?singleDoc# 《Claude KYC 认证服务》"
      }
    ],
    subgroups: [
      {
        name: "Claude 系列【渠道二】",
        products: [
          {
            id: "claude-channel2-max-5x-account-1m-kyc",
            name: "Claude MAX 5x 1个月代充/成品号【质保订阅30天】【已过KYC认证】",
            cost: 790,
            retail: 968,
            agent: 868,
            docUrl: "https://www.yuque.com/u8042174/kb/intlhmoqg8okx9oy?singleDoc# 《Claude MAX 5x 成品号【质保订阅30天】【已过KYC认证】》"
          },
          {
            id: "claude-channel2-max-20x-account-1m-kyc",
            name: "Claude MAX 20x 1个月代充/成品号【质保订阅30天】【已过KYC认证】【可开发票】",
            cost: 950,
            retail: 1298,
            agent: 948,
            docUrl: "https://www.yuque.com/u8042174/kb/nzh75cxmtqcf03k4?singleDoc# 《Claude MAX 20x 官方直充【质保订阅30天】》"
          }
        ]
      }
    ]
  },
  {
    id: "google",
    name: "Google 系列",
    products: [
      {
        id: "google-gemini-pro-account-1y",
        name: "Gemini Pro 1年订阅成品号",
        cost: 15,
        retail: 38,
        agent: 22,
        docUrl: "https://www.yuque.com/u8042174/kb/zk0lqnv0fui9v94w"
      },
      {
        id: "google-gemini-pro-direct-1y-pixel",
        name: "Gemini Pro 1年 官方直充【质保1年】【Pixel自动绑卡丝滑激活】",
        cost: 39,
        retail: 69,
        agent: 49,
        docUrl: "https://www.yuque.com/u8042174/kb/gtadnlkp2c0cgfyb?singleDoc#"
      },
      {
        id: "google-gmail-old-22-24",
        name: "google邮箱【稳定老号】【22-24年】",
        cost: 4.5,
        retail: 16,
        agent: 8.5,
        docUrl: "https://www.yuque.com/u8042174/kb/gkhtil3pzub0wz5t"
      }
    ]
  },
  {
    id: "grok",
    name: "Grok 系列",
    products: [
      {
        id: "grok-supergrok-direct-1m",
        name: "SuperGrok 官方直充 1个月会员【质保订阅30天】",
        cost: 65,
        retail: 106,
        agent: 85,
        docUrl: "https://www.yuque.com/u8042174/kb/dgvudgqubz32eii4?singleDoc#"
      },
      {
        id: "grok-supergrok-direct-1y",
        name: "SuperGrok 官方直充 1年会员【质保订阅365天】",
        cost: 588,
        retail: 698,
        agent: 626,
        docUrl: "https://www.yuque.com/u8042174/kb/hhq0v56ntgkkvosh?singleDoc#"
      }
    ]
  },
  {
    id: "telegram",
    name: "Telegram 系列",
    products: [
      { id: "telegram-new-1m", name: "1个月新号", cost: 9, retail: 28, agent: 16 },
      { id: "telegram-half-to-1y", name: "半年~1年", cost: 12, retail: 38, agent: 26 },
      { id: "telegram-2-to-3y", name: "2-3年", cost: 17, retail: 58, agent: 36 },
      { id: "telegram-4y-plus", name: "4年+", cost: 25, retail: 78, agent: 46 }
    ]
  }
];

export const productGroups: ProductGroup[] = rawProductGroups.map((group) => ({
  ...group,
  products: group.products.map(withChannel),
  subgroups: group.subgroups?.map((subgroup) => ({
    ...subgroup,
    products: subgroup.products.map(withChannel)
  }))
}));

function withChannel(product: Product): Product {
  return {
    ...product,
    channel: productChannels[product.id]
  };
}

export const allProducts = productGroups.flatMap((group) =>
  [...group.products, ...(group.subgroups ?? []).flatMap((subgroup) => subgroup.products)].map((product) => ({
    ...product,
    groupId: group.id,
    groupName: group.name
  }))
);
