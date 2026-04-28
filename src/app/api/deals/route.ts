import { NextRequest, NextResponse } from "next/server";
import { updateDealStage } from "@/lib/actions/deals";
import { isDealStage } from "@/lib/pipeline";

export async function PATCH(request: NextRequest) {
  const { dealId, stage } = await request.json();

  if (!dealId || !stage) {
    return NextResponse.json({ error: "dealId and stage required" }, { status: 400 });
  }

  if (!isDealStage(stage)) {
    return NextResponse.json({ error: "Invalid deal stage" }, { status: 400 });
  }

  await updateDealStage(dealId, stage);

  return NextResponse.json({ success: true });
}
