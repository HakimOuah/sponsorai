"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAgentExperience } from "@/components/agents/experience/AgentExperienceProvider";

/** Refresh only after a persistence event or a mission's terminal transition. */
export function ProspectionRefresh() {
  const router = useRouter();
  const { missions } = useAgentExperience();
  const previousStatuses = useRef(new Map<string, string>());
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const refresh = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => router.refresh(), 500);
  }, [router]);

  useEffect(() => {
    window.addEventListener("vectis:contacts-updated", refresh);
    return () => {
      window.removeEventListener("vectis:contacts-updated", refresh);
      clearTimeout(timer.current);
    };
  }, [refresh]);

  useEffect(() => {
    let changed = false;
    for (const mission of missions) {
      if (mission.agentId !== "enrichisseur" && mission.agentId !== "scout")
        continue;
      if (
        previousStatuses.current.get(mission.id) === "running" &&
        mission.status !== "running"
      )
        changed = true;
    }
    previousStatuses.current = new Map(
      missions.map((mission) => [mission.id, mission.status]),
    );
    if (changed) refresh();
  }, [missions, refresh]);

  return null;
}
