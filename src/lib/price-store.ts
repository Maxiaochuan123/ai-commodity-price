import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { kv } from "@vercel/kv";
import {
  PRICE_CHANGES_KEY,
  PRICES_KEY,
  mergePriceMap
} from "@/lib/pricing";
import type { PriceMap, PublicPriceChangeBatch } from "@/lib/pricing";

type LocalStore = {
  changes?: PublicPriceChangeBatch | null;
  prices?: PriceMap;
};

const localStorePath = path.join(os.tmpdir(), "ai-commodity-price-store.json");

export async function readPrices() {
  if (hasKv()) {
    const prices = await kv.get<PriceMap>(PRICES_KEY);
    return mergePriceMap(prices);
  }

  const store = await readLocalStore();
  return mergePriceMap(store.prices);
}

export async function writePrices(prices: PriceMap) {
  if (hasKv()) {
    await kv.set(PRICES_KEY, prices);
    return;
  }

  const store = await readLocalStore();
  await writeLocalStore({ ...store, prices });
}

export async function readLatestChanges() {
  if (hasKv()) {
    return kv.get<PublicPriceChangeBatch>(PRICE_CHANGES_KEY);
  }

  const store = await readLocalStore();
  return store.changes ?? null;
}

export async function writeLatestChanges(changes: PublicPriceChangeBatch | null) {
  if (hasKv()) {
    if (changes) {
      await kv.set(PRICE_CHANGES_KEY, changes);
    } else {
      await kv.del(PRICE_CHANGES_KEY);
    }
    return;
  }

  const store = await readLocalStore();
  await writeLocalStore({ ...store, changes });
}

export async function deletePrices() {
  if (hasKv()) {
    await kv.del(PRICES_KEY);
    await kv.del(PRICE_CHANGES_KEY);
    return;
  }

  try {
    await fs.unlink(localStorePath);
  } catch {
    // Ignore
  }
}

function hasKv() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function readLocalStore(): Promise<LocalStore> {
  try {
    const raw = await fs.readFile(localStorePath, "utf8");
    return JSON.parse(raw) as LocalStore;
  } catch {
    return {};
  }
}

async function writeLocalStore(store: LocalStore) {
  await fs.writeFile(localStorePath, JSON.stringify(store, null, 2), "utf8");
}
