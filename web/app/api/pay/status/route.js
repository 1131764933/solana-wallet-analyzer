import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const store = await cookies();
  const unlocked = store.get("pro_unlocked")?.value === "true";
  return NextResponse.json({ unlocked });
}
