export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface StockItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  status: StockStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StockItemInput {
  sku: string;
  name: string;
  category?: string;
  quantity?: number;
  price?: number;
  status?: StockStatus;
}
