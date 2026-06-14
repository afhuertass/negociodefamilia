import { NextResponse } from "next/server";
import { getLastSyncTime } from "@/lib/sync-tracker";

export const dynamic = 'force-dynamic';

export async function GET() {
  const lastSync = getLastSyncTime();
  return NextResponse.json({ lastSync });
}
