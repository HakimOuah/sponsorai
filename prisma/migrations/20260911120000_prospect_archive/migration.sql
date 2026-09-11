ALTER TABLE "Prospect" ADD COLUMN "archivedAt" TIMESTAMP(3);
CREATE INDEX "Prospect_playerId_archivedAt_idx" ON "Prospect"("playerId", "archivedAt");
