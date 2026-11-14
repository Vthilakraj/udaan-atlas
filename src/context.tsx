import { createContext, useContext } from "react";
import type { Action, Learner } from "../shared/model";
import type { useWorkspace } from "./store";
export type Page =
  | "overview"
  | "learners"
  | "followups"
  | "evidence"
  | "radar"
  | "portal";
export type Dialog =
  | {
      type: "passport" | "outcome" | "schedule" | "verify";
      learnerId: string;
      outcomeId?: string;
      followupId?: string;
    }
  | { type: "enroll" | "settings" | "guide" | "report" | "opportunity" }
  | null;
export type Atlas = {
  ws: ReturnType<typeof useWorkspace>;
  page: Page;
  go: (p: Page) => void;
  open: (d: Dialog) => void;
  notify: (s: string) => void;
  act: (a: Action, message: string) => Promise<boolean>;
  district: string;
  setDistrict: (s: string) => void;
  course: string;
  setCourse: (s: string) => void;
  learners: Learner[];
  query: string;
  setQuery: (s: string) => void;
  jobFilter: string;
  setJobFilter: (s: string) => void;
};
export const AtlasContext = createContext<Atlas | null>(null);
export function useAtlas() {
  const value = useContext(AtlasContext);
  if (!value) throw new Error("Workspace unavailable.");
  return value;
}
