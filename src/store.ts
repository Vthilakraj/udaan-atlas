import { useEffect, useState } from "react";
import {
  applyAction,
  parseBackup,
  scopeState,
  latestOutcome,
  evidenceLabel,
  type State,
  type Action,
  type Actor,
} from "../shared/model";
import { createSeed } from "../shared/seed";
export const STORAGE_KEY = "udaan-atlas:v1";
export const API_MODE = import.meta.env.VITE_DATA_MODE === "api";
export const programmeActor: Actor = {
  id: "demo-team",
  name: "Programme team",
  role: "admin",
};
async function request(path: string, body?: unknown) {
  const response = await fetch(`/api${path}`, {
    method: body ? "POST" : "GET",
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error || "Request failed.") as Error & {
      status: number;
      state?: State;
    };
    error.status = response.status;
    error.state = result.state;
    throw error;
  }
  return result;
}
export function useWorkspace() {
  const [original] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return { data: raw ? parseBackup(raw) : createSeed(), warning: "" };
    } catch {
      return {
        data: createSeed(),
        warning:
          "Saved demo data could not be read. Your stored copy is preserved until you make an edit.",
      };
    }
  });
  const [rawState, setRawState] = useState<State>(
    API_MODE ? createSeed(undefined, true) : original.data,
  );
  const [actor, setActor] = useState<Actor>(programmeActor);
  const [loading, setLoading] = useState(API_MODE);
  const [authenticated, setAuthenticated] = useState(!API_MODE);
  const [busy, setBusy] = useState(false);
  const [warning, setWarning] = useState(original.warning);
  useEffect(() => {
    if (!API_MODE) {
      if (original.warning && rawState === original.data) return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rawState));
        setWarning("");
      } catch {
        setWarning(
          "Browser storage is unavailable or full. Export a backup to keep your demo changes.",
        );
      }
    }
  }, [rawState, original]);
  useEffect(() => {
    if (API_MODE)
      request("/state")
        .then((r) => {
          setRawState(r.state);
          setActor(r.actor);
          setAuthenticated(true);
        })
        .catch((e) => {
          if (e.status !== 401) setWarning(e.message);
        })
        .finally(() => setLoading(false));
  }, []);
  const dispatch = async (action: Action) => {
    if (busy) throw new Error("Please wait for the current update.");
    setBusy(true);
    try {
      if (API_MODE) {
        const r = await request("/actions", {
          expectedRevision: rawState.revision,
          action,
        });
        setRawState(r.state);
      } else setRawState(applyAction(rawState, action, actor));
    } catch (e) {
      const error = e as Error & { state?: State };
      if (error.state) setRawState(error.state);
      throw error;
    } finally {
      setBusy(false);
    }
  };
  const login = async (email: string, password: string) => {
    await request("/login", { email, password });
    const r = await request("/state");
    setRawState(r.state);
    setActor(r.actor);
    setAuthenticated(true);
  };
  const logout = async () => {
    await request("/logout", {});
    setAuthenticated(false);
    setRawState(createSeed(undefined, true));
  };
  const changeRole = (role: string) => {
    if (API_MODE) return;
    setActor(
      role === "employer"
        ? {
            id: "demo-employer",
            name: "NovaGrid employer",
            role: "employer",
            employerId: "grid",
          }
        : role === "learner"
          ? {
              id: "demo-learner",
              name: rawState.learners.find((l) => l.consent)?.name || "Learner",
              role: "learner",
              learnerId: rawState.learners.find((l) => l.consent)?.id,
            }
          : programmeActor,
    );
  };
  return {
    state: scopeState(rawState, actor),
    rawState,
    actor,
    loading,
    busy,
    authenticated,
    warning,
    dispatch,
    login,
    logout,
    changeRole,
    restore: (raw: string) => {
      if (API_MODE)
        throw new Error("Restore is available only in the browser demo.");
      const next = parseBackup(raw);
      setRawState(next);
      setActor(programmeActor);
    },
    reset: () => {
      if (!API_MODE) {
        setRawState(createSeed());
        setActor(programmeActor);
      }
    },
    createAccount: (body: unknown) => request("/users", body),
  };
}
export function download(
  name: string,
  content: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportCsv(state: State) {
  const header = [
    "Learner ID",
    "Name",
    "District",
    "Course",
    "Provider",
    "Gender",
    "Training completed",
    "Latest status",
    "Monthly income",
    "Evidence",
  ];
  const rows = state.learners
    .filter((l) => l.consent)
    .map((l) => {
      const o = latestOutcome(l);
      return [
        l.id,
        l.name,
        l.district,
        state.courses.find((c) => c.id === l.courseId)?.title || "",
        state.providers.find((p) => p.id === l.providerId)?.name || "",
        l.gender,
        l.trainedOn,
        o?.status || "No update",
        o?.income ?? "",
        evidenceLabel(state, o),
      ];
    });
  const cell = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}
