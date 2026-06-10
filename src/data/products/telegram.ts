import type { ProductGroup } from "../products";

export const telegramGroup: ProductGroup = {
  id: "telegram",
  name: "Telegram 系列",
  products: [
    { name: "1个月新号", cost: 9, retail: 28, agent: 5, docUrl: "https://www.yuque.com/u8042174/kb/sfbha3704krzt2c3?singleDoc#" },
    { name: "半年~1年", cost: 12, retail: 38, agent: 8, docUrl: "https://www.yuque.com/u8042174/kb/sfbha3704krzt2c3?singleDoc#" },
    { name: "2-3年", cost: 17, retail: 58, agent: 12, docUrl: "https://www.yuque.com/u8042174/kb/sfbha3704krzt2c3?singleDoc#" },
    { name: "4年+", cost: 25, retail: 78, agent: 16, docUrl: "https://www.yuque.com/u8042174/kb/sfbha3704krzt2c3?singleDoc#" }
  ]
};
