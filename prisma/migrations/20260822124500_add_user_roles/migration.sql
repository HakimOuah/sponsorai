ALTER TABLE "User"
ADD COLUMN "role" TEXT NOT NULL DEFAULT 'client';

-- Existing accounts predate client access and belong to the operator team.
UPDATE "User"
SET "role" = 'admin';
