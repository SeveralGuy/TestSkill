import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { newDb } from "pg-mem";
import { Pool } from "pg";
import type { StockItem, StockItemInput, StockStatus } from "@/types/stock";

const initialItems: StockItem[] = [
  {
    id: randomUUID(),
    sku: "SKU-1001",
    name: "Wireless Mouse",
    category: "Accessories",
    quantity: 12,
    price: 29.99,
    status: "in_stock",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    sku: "SKU-1002",
    name: "Mechanical Keyboard",
    category: "Accessories",
    quantity: 4,
    price: 89.5,
    status: "low_stock",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let memoryItems: StockItem[] = initialItems.map((item) => ({ ...item }));
let pool: Pool | null = null;
let pgMemInitialized = false;

function getPool() {
  if (!process.env.DATABASE_URL) {
    if (!pgMemInitialized) {
      const db = newDb();
      const { Pool: PgMemPool } = db.adapters.createPg();
      pool = new PgMemPool() as unknown as Pool;
      pgMemInitialized = true;
    }

    return pool;
  }

  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  return pool;
}

function deriveStatus(quantity: number): StockStatus {
  if (quantity <= 0) {
    return "out_of_stock";
  }

  if (quantity <= 5) {
    return "low_stock";
  }

  return "in_stock";
}

function normalizeItem(input: StockItemInput): Omit<StockItem, "id" | "createdAt" | "updatedAt"> {
  const quantity = Math.max(0, input.quantity ?? 0);
  const price = Number(input.price ?? 0);

  return {
    sku: input.sku.trim(),
    name: input.name.trim(),
    category: input.category?.trim() || "general",
    quantity,
    price,
    status: input.status ?? deriveStatus(quantity),
  };
}

async function ensureSchema() {
  const db = getPool();
  if (!db) {
    return;
  }

  const schemaPath = path.join(process.cwd(), "src", "lib", "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  await db.query(schemaSql);
}

function mapRow(row: Record<string, unknown>): StockItem {
  const id = row.id instanceof String ? row.id.toString() : typeof row.id === "string" ? row.id : "";
  const sku = row.sku instanceof String ? row.sku.toString() : typeof row.sku === "string" ? row.sku : "";
  const name = row.name instanceof String ? row.name.toString() : typeof row.name === "string" ? row.name : "";
  const category = row.category instanceof String ? row.category.toString() : typeof row.category === "string" ? row.category : "";
  const quantity = Number(row.quantity ?? 0);
  const price = Number(row.price ?? 0);
  const status = typeof row.status === "string" ? (row.status as StockStatus) : "in_stock";
  const createdAt = row.created_at instanceof String ? row.created_at.toString() : typeof row.created_at === "string" ? row.created_at : "";
  const updatedAt = row.updated_at instanceof String ? row.updated_at.toString() : typeof row.updated_at === "string" ? row.updated_at : "";

  return {
    id,
    sku,
    name,
    category,
    quantity,
    price,
    status,
    createdAt,
    updatedAt,
  };
}

export async function checkDatabaseConnection(): Promise<{ ok: boolean; message: string }> {
  const db = getPool();

  if (!db) {
    return { ok: false, message: "DATABASE_URL is not configured." };
  }

  try {
    await ensureSchema();
    await db.query("SELECT 1");
    return { ok: true, message: "PostgreSQL-compatible connection successful." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, message: `PostgreSQL connection failed: ${message}` };
  }
}

export async function listStockItems(): Promise<StockItem[]> {
  const db = getPool();

  if (!db) {
    return memoryItems;
  }

  await ensureSchema();
  const result = await db.query(
    `SELECT id, sku, name, category, quantity, price, status, created_at, updated_at
     FROM stock_items
     ORDER BY created_at DESC`
  );

  return result.rows.map(mapRow);
}

export async function createStockItem(input: StockItemInput): Promise<StockItem> {
  const db = getPool();
  const payload = normalizeItem(input);

  if (!db) {
    const item: StockItem = {
      id: randomUUID(),
      ...payload,
      status: payload.status ?? deriveStatus(payload.quantity),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryItems = [item, ...memoryItems];
    return item;
  }

  await ensureSchema();
  const now = new Date().toISOString();
  const id = randomUUID();
  const result = await db.query(
    `INSERT INTO stock_items (id, sku, name, category, quantity, price, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, sku, name, category, quantity, price, status, created_at, updated_at`,
    [id, payload.sku, payload.name, payload.category, payload.quantity, payload.price, payload.status, now, now]
  );

  return mapRow(result.rows[0]);
}

export async function updateStockItem(id: string, input: StockItemInput): Promise<StockItem | null> {
  const db = getPool();
  const payload = normalizeItem(input);

  if (!db) {
    const index = memoryItems.findIndex((item) => item.id === id);
    if (index === -1) {
      return null;
    }

    const updatedItem: StockItem = {
      ...memoryItems[index],
      ...payload,
      status: payload.status ?? deriveStatus(payload.quantity),
      updatedAt: new Date().toISOString(),
    };
    memoryItems[index] = updatedItem;
    return updatedItem;
  }

  await ensureSchema();
  const now = new Date().toISOString();
  const result = await db.query(
    `UPDATE stock_items
     SET sku = $1, name = $2, category = $3, quantity = $4, price = $5, status = $6, updated_at = $7
     WHERE id = $8
     RETURNING id, sku, name, category, quantity, price, status, created_at, updated_at`,
    [payload.sku, payload.name, payload.category, payload.quantity, payload.price, payload.status, now, id]
  );

  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function deleteStockItem(id: string): Promise<boolean> {
  const db = getPool();

  if (!db) {
    const before = memoryItems.length;
    memoryItems = memoryItems.filter((item) => item.id !== id);
    return memoryItems.length !== before;
  }

  await ensureSchema();
  const result = await db.query("DELETE FROM stock_items WHERE id = $1", [id]);
  return Number(result.rowCount ?? 0) > 0;
}
