import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/stock-items";

export async function GET() {
  const result = await checkDatabaseConnection();
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
