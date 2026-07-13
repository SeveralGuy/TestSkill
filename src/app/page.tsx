"use client";

import { useEffect, useState } from "react";
import type { StockItem, StockItemInput } from "@/types/stock";

const emptyForm: StockItemInput = {
  sku: "",
  name: "",
  category: "",
  quantity: 0,
  price: 0,
  status: "in_stock",
};

export default function Home() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [form, setForm] = useState<StockItemInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    const response = await fetch("/api/stock-items");
    const data = await response.json();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchItems();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const submitItem = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      ...form,
      quantity: Number(form.quantity ?? 0),
      price: Number(form.price ?? 0),
    };

    const url = editingId ? `/api/stock-items/${editingId}` : "/api/stock-items";
    const method = editingId ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setForm(emptyForm);
      setEditingId(null);
      fetchItems();
    }
  };

  const startEdit = (item: StockItem) => {
    setEditingId(item.id);
    setForm({
      sku: item.sku,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      price: item.price,
      status: item.status,
    });
  };

  const deleteItem = async (id: string) => {
    const response = await fetch(`/api/stock-items/${id}`, { method: "DELETE" });
    if (response.ok) {
      fetchItems();
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:px-8">
        <header className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-black/20">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Stock control</p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Manage stock items</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Create, edit, and track inventory with a PostgreSQL-ready backend structure.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
              <div className="font-medium">Backend mode</div>
              <div className="mt-1 text-slate-500">Uses in-memory fallback or PostgreSQL when DATABASE_URL is set.</div>
            </div>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/10">
            <h2 className="text-xl font-semibold">{editingId ? "Edit item" : "Add new item"}</h2>
            <form className="mt-6 space-y-4" onSubmit={submitItem}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-slate-300">
                  SKU
                  <input
                    required
                    value={form.sku}
                    onChange={(event) => setForm({ ...form, sku: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                  />
                </label>
                <label className="text-sm text-slate-300">
                  Name
                  <input
                    required
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-slate-300">
                  Category
                  <input
                    value={form.category}
                    onChange={(event) => setForm({ ...form, category: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                  />
                </label>
                <label className="text-sm text-slate-300">
                  Status
                  <select
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value as StockItem["status"] })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                  >
                    <option value="in_stock">In stock</option>
                    <option value="low_stock">Low stock</option>
                    <option value="out_of_stock">Out of stock</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-slate-300">
                  Quantity
                  <input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                  />
                </label>
                <label className="text-sm text-slate-300">
                  Price
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => setForm({ ...form, price: Number(event.target.value) })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                  />
                </label>
              </div>

              <div className="flex gap-3">
                <button className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-cyan-400" type="submit">
                  {editingId ? "Save item" : "Create item"}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setForm(emptyForm);
                    }}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Inventory overview</h2>
              <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-300">
                {items.length} items
              </span>
            </div>

            {loading ? (
              <p className="mt-6 text-sm text-slate-400">Loading items…</p>
            ) : (
              <div className="mt-6 space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="mt-1 text-sm text-slate-400">{item.sku} · {item.category}</div>
                      </div>
                      <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs capitalize text-slate-300">
                        {item.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                      <span>Qty: {item.quantity}</span>
                      <span>Price: ${item.price.toFixed(2)}</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm transition hover:border-cyan-500 hover:text-cyan-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="rounded-lg border border-rose-700/50 px-3 py-1.5 text-sm text-rose-300 transition hover:bg-rose-900/30"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
