import type { ProductGroup } from "../products";

export const telegramGroup: ProductGroup = {
  id: "telegram",
  name: "Telegram 系列",
  products: [
    { name: "1个月新号", cost: 9, retail: 28, primaryAgent: 16, secondaryAgent: 20, docUrl: "https://www.yuque.com/u8042174/kb/sfbha3704krzt2c3?singleDoc#" },
    { name: "半年~1年", cost: 12, retail: 38, primaryAgent: 20, secondaryAgent: 26, docUrl: "https://www.yuque.com/u8042174/kb/sfbha3704krzt2c3?singleDoc#" },
    { name: "2-3年", cost: 17, retail: 58, primaryAgent: 28, secondaryAgent: 32, docUrl: "https://www.yuque.com/u8042174/kb/sfbha3704krzt2c3?singleDoc#" },
    { name: "4年+", cost: 25, retail: 78, primaryAgent: 32, secondaryAgent: 38, docUrl: "https://www.yuque.com/u8042174/kb/sfbha3704krzt2c3?singleDoc#" }
  ]
};
