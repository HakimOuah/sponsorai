import { getCurrentUserAccess } from "@/lib/auth/access";
import { createQualificationHandlers } from "@/lib/contacts/scan-qualification-handler";
import { advanceStoredScanQualification, listOwnScanQualifications, readScanQualification } from "@/lib/contacts/scan-qualification-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
export const { GET, POST } = createQualificationHandlers({
  getAccess: getCurrentUserAccess,
  list: listOwnScanQualifications,
  read: readScanQualification,
  advance: advanceStoredScanQualification,
});
