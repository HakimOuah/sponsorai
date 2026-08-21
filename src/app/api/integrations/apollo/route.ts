import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { checkApolloConnection } from "@/lib/agents/apollo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await checkApolloConnection();
  const status = result.ok ? 200 : result.configured ? 502 : 503;

  return NextResponse.json(result, { status });
}
