import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  LEARNING_EVENT_TYPES,
  recordLearningEvent,
  type LearningEventType,
} from "@/lib/learning/events";

const PROVIDER_EVENT_TYPES = ["DELIVERED", "OPENED", "BOUNCED"] as const;

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.OUTREACH_WEBHOOK_SECRET;
  if (!configuredSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }
  if (request.headers.get("x-sponsorai-webhook-secret") !== configuredSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { messageId, type, providerEventId, occurredAt, metadata } = body;
  if (!messageId || !PROVIDER_EVENT_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid provider event" }, { status: 400 });
  }

  const persistedProviderEventId =
    providerEventId || `derived:${messageId}:${type}:${occurredAt || "unspecified"}`;
  const existingEvent = await prisma.outreachEvent.findUnique({
    where: { providerEventId: persistedProviderEventId },
  });
  if (existingEvent) {
    return NextResponse.json({ success: true, duplicate: true });
  }

  const email = await prisma.email.findFirst({ where: { messageId } });
  if (!email) return NextResponse.json({ error: "Email not found" }, { status: 404 });

  let event;
  try {
    event = await prisma.outreachEvent.create({
      data: {
        emailId: email.id,
        type,
        provider: email.provider || "unknown",
        providerEventId: persistedProviderEventId,
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
        metadata: metadata || undefined,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ success: true, duplicate: true });
    }
    throw error;
  }

  if (type === "DELIVERED") {
    await prisma.email.update({
      where: { id: email.id },
      data: { status: "delivered" },
    });
  } else if (type === "OPENED") {
    await prisma.email.update({
      where: { id: email.id },
      data: { status: "opened", openedAt: event.occurredAt },
    });
  } else if (type === "BOUNCED") {
    await prisma.email.update({ where: { id: email.id }, data: { status: "bounced" } });
  }

  const learningType = type as LearningEventType;
  if (LEARNING_EVENT_TYPES.includes(learningType)) {
    await recordLearningEvent({
      type: learningType,
      idempotencyKey: `provider:${persistedProviderEventId}`,
      emailId: email.id,
      occurredAt: event.occurredAt,
      extraContext: { providerMetadata: metadata || null },
    });
  }

  return NextResponse.json({ success: true });
}
