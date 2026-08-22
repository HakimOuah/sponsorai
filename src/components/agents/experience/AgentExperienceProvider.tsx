"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  AgentMission,
  AgentMissionStatus,
  StartMissionInput,
} from "./types";

const STORAGE_KEY = "vectis-agent-missions-v1";
const MAX_STORED_MISSIONS = 20;

interface AgentExperienceContextValue {
  missions: AgentMission[];
  isDockOpen: boolean;
  setDockOpen: (open: boolean) => void;
  startMission: (input: StartMissionInput) => string;
  updateMission: (
    id: string,
    patch: Partial<Omit<AgentMission, "id" | "startedAt">>,
  ) => void;
  finishMission: (
    id: string,
    detail: string,
    options?: {
      actionLabel?: string;
      actionHref?: string;
      nextAgentId?: AgentMission["nextAgentId"];
      status?: Extract<AgentMissionStatus, "completed" | "waiting">;
    },
  ) => void;
  failMission: (id: string, detail: string) => void;
  clearCompleted: () => void;
}

const AgentExperienceContext = createContext<AgentExperienceContextValue | null>(
  null,
);

function createMissionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `mission-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isMission(value: unknown): value is AgentMission {
  if (!value || typeof value !== "object") return false;
  const mission = value as Partial<AgentMission>;
  return Boolean(
    mission.id &&
      mission.agentId &&
      mission.title &&
      mission.detail &&
      mission.status &&
      mission.startedAt &&
      mission.updatedAt,
  );
}

export function AgentExperienceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [missions, setMissions] = useState<AgentMission[]>([]);
  const [isDockOpen, setDockOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? (JSON.parse(stored) as unknown) : [];
      if (Array.isArray(parsed)) {
        setMissions(parsed.filter(isMission).slice(0, MAX_STORED_MISSIONS));
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(missions.slice(0, MAX_STORED_MISSIONS)),
    );
  }, [isHydrated, missions]);

  const startMission = useCallback((input: StartMissionInput) => {
    const now = Date.now();
    const id = input.id || createMissionId();
    const mission: AgentMission = {
      id,
      agentId: input.agentId,
      title: input.title,
      detail: input.detail,
      status: "running",
      progress: input.progress,
      startedAt: now,
      updatedAt: now,
    };

    setMissions((current) => [
      mission,
      ...current.filter((item) => item.id !== id),
    ]);
    return id;
  }, []);

  const updateMission = useCallback(
    (
      id: string,
      patch: Partial<Omit<AgentMission, "id" | "startedAt">>,
    ) => {
      setMissions((current) =>
        current.map((mission) =>
          mission.id === id
            ? { ...mission, ...patch, updatedAt: Date.now() }
            : mission,
        ),
      );
    },
    [],
  );

  const finishMission = useCallback(
    (
      id: string,
      detail: string,
      options?: {
        actionLabel?: string;
        actionHref?: string;
        nextAgentId?: AgentMission["nextAgentId"];
        status?: Extract<AgentMissionStatus, "completed" | "waiting">;
      },
    ) => {
      setMissions((current) =>
        current.map((mission) =>
          mission.id === id
            ? {
                ...mission,
                detail,
                status: options?.status || "completed",
                progress: 100,
                actionLabel: options?.actionLabel,
                actionHref: options?.actionHref,
                nextAgentId: options?.nextAgentId,
                updatedAt: Date.now(),
              }
            : mission,
        ),
      );
    },
    [],
  );

  const failMission = useCallback((id: string, detail: string) => {
    setMissions((current) =>
      current.map((mission) =>
        mission.id === id
          ? { ...mission, detail, status: "error", updatedAt: Date.now() }
          : mission,
      ),
    );
  }, []);

  const clearCompleted = useCallback(() => {
    setMissions((current) =>
      current.filter(
        (mission) =>
          mission.status === "running" || mission.status === "waiting",
      ),
    );
  }, []);

  const value = useMemo<AgentExperienceContextValue>(
    () => ({
      missions,
      isDockOpen,
      setDockOpen,
      startMission,
      updateMission,
      finishMission,
      failMission,
      clearCompleted,
    }),
    [
      clearCompleted,
      failMission,
      finishMission,
      isDockOpen,
      missions,
      startMission,
      updateMission,
    ],
  );

  return (
    <AgentExperienceContext.Provider value={value}>
      {children}
    </AgentExperienceContext.Provider>
  );
}

export function useAgentExperience() {
  const value = useContext(AgentExperienceContext);
  if (!value) {
    throw new Error(
      "useAgentExperience must be used within AgentExperienceProvider",
    );
  }
  return value;
}

