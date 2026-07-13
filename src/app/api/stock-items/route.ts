import { NextResponse } from "next/server";
import { createStockItem, listStockItems } from "@/lib/stock-items";

export async function GET() {
  const items = await listStockItems();
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body?.sku || !body?.name) {
      return NextResponse.json({ error: "sku and name are required" }, { status: 400 });
    }

    const item = await createStockItem(body);
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create stock item" }, { status: 500 });
  }
}
