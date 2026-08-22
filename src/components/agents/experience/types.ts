export type AgentId =
  | "scout"
  | "matchmaker"
  | "enrichisseur"
  | "redacteur"
  | "dispatcher"
  | "veilleur"
  | "relanceur"
  | "veille-concurrence";

export type AgentMissionStatus =
  | "running"
  | "waiting"
  | "completed"
  | "error";

export interface AgentMission {
  id: string;
  agentId: AgentId;
  title: string;
  detail: string;
  status: AgentMissionStatus;
  progress?: number;
  startedAt: number;
  updatedAt: number;
  actionLabel?: string;
  actionHref?: string;
  nextAgentId?: AgentId;
}

export interface StartMissionInput {
  id?: string;
  agentId: AgentId;
  title: string;
  detail: string;
  progress?: number;
}

