import { NextResponse } from "next/server";
import { deleteStockItem, updateStockItem } from "@/lib/stock-items";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body?.sku || !body?.name) {
      return NextResponse.json({ error: "sku and name are required" }, { status: 400 });
    }

    const item = await updateStockItem(id, body);
    if (!item) {
      return NextResponse.json({ error: "Stock item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Unable to update stock item" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const deleted = await deleteStockItem(id);

    if (!deleted) {
      return NextResponse.json({ error: "Stock item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete stock item" }, { status: 500 });
  }
}
