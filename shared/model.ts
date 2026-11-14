import { z } from "zod";
export const statuses = [
  "Employed",
  "Self-employed",
  "Apprenticeship",
  "Seeking work",
  "Left job",
  "Further study",
] as const;
export const inWork = (status?: string) =>
  ["Employed", "Self-employed", "Apprenticeship"].includes(status || "");
export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function shiftDay(date: string, n: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}
export function daysBetween(a: string, b: string) {
  return Math.round(
    (Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000,
  );
}
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(`${v}T12:00:00`);
    return !Number.isNaN(d.getTime()) && dayKey(d) === v;
  }, "Use a valid date");
const id = z.string().min(1).max(100);
const short = z.string().trim().min(1).max(160);
const skills = z.array(z.string().trim().min(1).max(80)).max(30);
export const outcomeSchema = z.object({
  id,
  date,
  status: z.enum(statuses),
  income: z.number().min(0).max(1000000),
  employerId: z.string().max(100),
  role: z.string().max(160),
  note: z.string().max(2000),
  skillsNeeded: skills,
  source: z.enum(["Learner", "Programme team"]),
});
export const learnerSchema = z.object({
  id,
  name: short,
  email: z.union([z.email(), z.literal("")]),
  district: short,
  courseId: id,
  providerId: id,
  gender: z.enum(["Woman", "Man", "Non-binary", "Prefer not to say"]),
  trainedOn: date,
  baselineIncome: z.number().min(0).max(1000000).nullable(),
  consent: z.boolean(),
  skills,
  outcomes: z.array(outcomeSchema).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});
export const followupSchema = z.object({
  id,
  learnerId: id,
  due: date,
  milestone: z.enum([
    "30-day",
    "90-day",
    "180-day",
    "365-day",
    "Support check-in",
  ]),
  completed: z.boolean(),
  note: z.string().max(2000),
});
export const evidenceSchema = z.object({
  id,
  learnerId: id,
  outcomeId: id,
  verdict: z.enum(["Confirmed", "Mismatch"]),
  note: z.string().max(2000),
  at: z.string().datetime(),
  actor: id,
  source: z.enum(["Employer", "Programme review"]),
});
export const courseSchema = z.object({
  id,
  title: short,
  sector: short,
  skills,
  color: z.string(),
});
export const employerSchema = z.object({ id, name: short, color: z.string() });
export const jobSchema = z.object({
  id,
  title: short,
  employerId: id,
  district: short,
  skills,
  minPay: z.number(),
  maxPay: z.number(),
});
export const auditSchema = z.object({
  id,
  at: z.string().datetime(),
  actor: short,
  action: short,
  learnerId: z.string().max(100),
});
export const stateSchema = z.object({
  version: z.literal(1),
  revision: z.number().int().min(0),
  learners: z.array(learnerSchema).max(10000),
  followups: z.array(followupSchema).max(50000),
  evidence: z.array(evidenceSchema).max(50000),
  courses: z.array(courseSchema).max(200),
  employers: z.array(employerSchema).max(1000),
  jobs: z.array(jobSchema).max(5000),
  providers: z.array(z.object({ id, name: short })).max(1000),
  audit: z.array(auditSchema).max(10000),
});
export type State = z.infer<typeof stateSchema>;
export type Learner = z.infer<typeof learnerSchema>;
export type Outcome = z.infer<typeof outcomeSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type Followup = z.infer<typeof followupSchema>;
export type Actor = {
  id: string;
  name: string;
  role: "admin" | "employer" | "learner";
  employerId?: string;
  learnerId?: string;
};
export const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("addLearner"),
    learner: learnerSchema.omit({ id: true, outcomes: true, color: true }),
  }),
  z.object({
    type: z.literal("recordOutcome"),
    learnerId: id,
    outcome: outcomeSchema.omit({ id: true, source: true }),
    followupId: z.string().optional(),
  }),
  z.object({
    type: z.literal("verify"),
    learnerId: id,
    outcomeId: id,
    verdict: z.enum(["Confirmed", "Mismatch"]),
    note: z.string().min(5).max(2000),
  }),
  z.object({
    type: z.literal("schedule"),
    learnerId: id,
    due: date,
    note: z.string().max(2000),
  }),
  z.object({ type: z.literal("withdraw"), learnerId: id }),
  z.object({ type: z.literal("addJob"), job: jobSchema.omit({ id: true }) }),
  z.object({ type: z.literal("addEmployer"), name: short }),
]);
export type Action = z.infer<typeof actionSchema>;
export const uid = () => crypto.randomUUID();
export function latestOutcome(l: Learner, asOf = dayKey()) {
  return l.outcomes
    .filter((o) => o.date <= asOf)
    .reduce<
      Outcome | undefined
    >((a, b) => (!a || b.date >= a.date ? b : a), undefined);
}
export function latestEvidence(state: State, outcomeId: string) {
  return state.evidence.filter((e) => e.outcomeId === outcomeId).at(-1);
}
export function evidenceLabel(state: State, o?: Outcome) {
  if (!o) return "No update";
  const e = latestEvidence(state, o.id);
  return !e
    ? "Self-reported"
    : e.verdict === "Mismatch"
      ? "Needs review"
      : e.source === "Employer"
        ? "Employer confirmed"
        : "Team reviewed";
}
export function metrics(
  state: State,
  learners: Learner[] = state.learners,
  asOf = dayKey(),
) {
  const active = learners.filter((l) => l.consent);
  const known = active.map((l) => ({ l, o: latestOutcome(l, asOf) }));
  const working = known.filter((x) => inWork(x.o?.status));
  const incomes = working.map((x) => x.o!.income).filter((n) => n > 0);
  const gains = working
    .filter((x) => x.l.baselineIncome !== null && x.o!.income > 0)
    .map((x) => x.o!.income - x.l.baselineIncome!);
  const continuityEligible = active.filter((l) =>
    l.outcomes.some((o) => o.date <= shiftDay(asOf, -90) && inWork(o.status)),
  );
  const continuityWorking = continuityEligible.filter((l) =>
    inWork(latestOutcome(l, asOf)?.status),
  ).length;
  const verified = working.filter(
    (x) => evidenceLabel(state, x.o) === "Employer confirmed",
  ).length;
  const fresh = known.filter(
    (x) => x.o && daysBetween(x.o.date, asOf) <= 90,
  ).length;
  return {
    total: active.length,
    known: known.filter((x) => x.o).length,
    working: working.length,
    verified,
    unreported: known.filter((x) => !x.o).length,
    coverage: active.length ? Math.round((fresh / active.length) * 100) : 0,
    placementRate: active.length
      ? Math.round((working.length / active.length) * 100)
      : 0,
    medianIncome: median(incomes),
    incomeGain: median(gains),
    gainCount: gains.length,
    continuityEligible: continuityEligible.length,
    continuityWorking,
    continuityRate: continuityEligible.length
      ? Math.round((continuityWorking / continuityEligible.length) * 100)
      : 0,
  };
}
export function median(values: number[]) {
  if (!values.length) return 0;
  const v = [...values].sort((a, b) => a - b);
  const i = Math.floor(v.length / 2);
  return v.length % 2 ? v[i] : (v[i - 1] + v[i]) / 2;
}
export function skillMatches(state: State, l: Pick<Learner, "skills">) {
  return state.jobs
    .map((job) => {
      const missing = job.skills.filter(
        (s) => !l.skills.some((have) => have.toLowerCase() === s.toLowerCase()),
      );
      return {
        ...job,
        missing,
        match: job.skills.length
          ? Math.round(
              ((job.skills.length - missing.length) / job.skills.length) * 100,
            )
          : 100,
      };
    })
    .sort((a, b) => b.match - a.match);
}
export function priority(state: State, l: Learner, asOf = dayKey()) {
  if (!l.consent)
    return { score: 0, reasons: ["Consent withdrawn"], label: "Paused" };
  const o = latestOutcome(l, asOf);
  const due = state.followups.filter(
    (f) => f.learnerId === l.id && !f.completed && f.due <= asOf,
  );
  let score = 0;
  const reasons: string[] = [];
  if (!o) {
    score += 35;
    reasons.push("No outcome recorded");
  }
  if (o?.status === "Left job") {
    score += 40;
    reasons.push("Reported leaving work");
  }
  if (o?.status === "Seeking work") {
    score += 22;
    reasons.push("Still looking for work");
  }
  if (due.length) {
    const days = Math.max(...due.map((f) => daysBetween(f.due, asOf)));
    score += Math.min(35, 15 + Math.floor(days / 5));
    reasons.push(`${days} days overdue`);
  }
  if (o && daysBetween(o.date, asOf) > 90) {
    score += 20;
    reasons.push("Update older than 90 days");
  }
  if (o?.skillsNeeded.length) {
    score += Math.min(15, o.skillsNeeded.length * 5);
    reasons.push(`${o.skillsNeeded.length} reported skill gaps`);
  }
  if (o && evidenceLabel(state, o) === "Needs review") {
    score += 20;
    reasons.push("Employer evidence differs");
  }
  score = Math.min(100, score);
  return {
    score,
    reasons: reasons.length ? reasons : ["Recent outcome on record"],
    label: score >= 65 ? "Act now" : score >= 30 ? "Check in" : "On track",
  };
}
export function scopeState(state: State, actor: Actor): State {
  if (actor.role === "admin") return state;
  const learners = state.learners
    .filter(
      (l) =>
        l.consent &&
        (actor.role === "learner"
          ? l.id === actor.learnerId
          : l.outcomes.some((o) => o.employerId === actor.employerId)),
    )
    .map((l) =>
      actor.role === "employer"
        ? {
            ...l,
            email: "",
            baselineIncome: null,
            outcomes: l.outcomes.filter(
              (o) => o.employerId === actor.employerId,
            ),
          }
        : l,
    );
  const allowed = new Set(learners.map((l) => l.id));
  return {
    ...state,
    learners,
    followups:
      actor.role === "employer"
        ? []
        : state.followups.filter((f) => allowed.has(f.learnerId)),
    evidence: state.evidence.filter(
      (e) =>
        allowed.has(e.learnerId) &&
        learners.some((l) => l.outcomes.some((o) => o.id === e.outcomeId)),
    ),
    audit: state.audit.filter((a) => allowed.has(a.learnerId)),
    providers: state.providers,
  };
}
export function applyAction(
  input: State,
  raw: unknown,
  actor: Actor,
  asOf = dayKey(),
): State {
  const action = actionSchema.parse(raw);
  const state = structuredClone(input);
  let learnerId = "";
  const admin = actor.role === "admin";
  if (action.type === "addLearner") {
    if (!admin) throw new Error("Only the programme team can enroll learners.");
    if (!action.learner.consent)
      throw new Error("Consent is required before enrollment.");
    if (action.learner.trainedOn > asOf)
      throw new Error("Training completion cannot be in the future.");
    if (
      !state.courses.some((c) => c.id === action.learner.courseId) ||
      !state.providers.some((p) => p.id === action.learner.providerId)
    )
      throw new Error("Choose a valid course and provider.");
    learnerId = uid();
    const learner = {
      ...action.learner,
      id: learnerId,
      color: "#ede7ff",
      outcomes: [],
    };
    state.learners.push(learner);
    for (const n of [30, 90, 180, 365] as const)
      state.followups.push({
        id: uid(),
        learnerId,
        due: shiftDay(learner.trainedOn, n),
        milestone: `${n}-day`,
        completed: false,
        note: "",
      });
  } else if (action.type === "addEmployer") {
    if (!admin)
      throw new Error(
        "Only the programme team can add employer organizations.",
      );
    state.employers.push({ id: uid(), name: action.name, color: "#e9e2fa" });
  } else if (action.type === "addJob") {
    if (
      !admin &&
      !(actor.role === "employer" && actor.employerId === action.job.employerId)
    )
      throw new Error("You cannot post roles for another employer.");
    if (
      !state.employers.some((e) => e.id === action.job.employerId) ||
      action.job.minPay > action.job.maxPay
    )
      throw new Error("Choose a valid employer and salary range.");
    state.jobs.push({ ...action.job, id: uid() });
  } else {
    learnerId = action.learnerId;
    const l = state.learners.find((l) => l.id === learnerId);
    if (!l) throw new Error("Learner not found.");
    if (!l.consent)
      throw new Error(
        "Consent is withdrawn. New contact and updates are paused.",
      );
    if (action.type === "recordOutcome") {
      if (!admin && !(actor.role === "learner" && actor.learnerId === l.id))
        throw new Error("You cannot update another learner’s outcome.");
      if (action.outcome.date > asOf || action.outcome.date < l.trainedOn)
        throw new Error("Choose a date between training completion and today.");
      if (!inWork(action.outcome.status) && action.outcome.income !== 0)
        throw new Error("Use zero income for a non-working outcome.");
      if (
        ["Employed", "Apprenticeship"].includes(action.outcome.status) &&
        !state.employers.some((e) => e.id === action.outcome.employerId)
      )
        throw new Error("Choose the employer for this outcome.");
      if (action.followupId) {
        const f = state.followups.find(
          (f) => f.id === action.followupId && f.learnerId === l.id,
        );
        if (!f) throw new Error("Follow-up does not belong to this learner.");
        f.completed = true;
        f.note = action.outcome.note;
      }
      l.outcomes.push({
        ...action.outcome,
        id: uid(),
        source: actor.role === "learner" ? "Learner" : "Programme team",
      });
    } else if (action.type === "verify") {
      const o = l.outcomes.find((o) => o.id === action.outcomeId);
      if (!o) throw new Error("Outcome not found.");
      if (
        !admin &&
        !(actor.role === "employer" && o.employerId === actor.employerId)
      )
        throw new Error(
          "You can only verify outcomes linked to your employer.",
        );
      if (actor.role === "learner")
        throw new Error("A learner cannot verify their own employment.");
      state.evidence.push({
        id: uid(),
        learnerId: l.id,
        outcomeId: o.id,
        verdict: action.verdict,
        note: action.note,
        at: new Date().toISOString(),
        actor: actor.id,
        source: actor.role === "employer" ? "Employer" : "Programme review",
      });
    } else if (action.type === "schedule") {
      if (!admin)
        throw new Error("Only the programme team can schedule support.");
      if (action.due < asOf) throw new Error("Choose today or a future date.");
      state.followups.push({
        id: uid(),
        learnerId: l.id,
        due: action.due,
        milestone: "Support check-in",
        completed: false,
        note: action.note,
      });
    } else if (action.type === "withdraw") {
      if (!admin && !(actor.role === "learner" && actor.learnerId === l.id))
        throw new Error("You cannot withdraw another learner’s consent.");
      l.name = "Consent withdrawn";
      l.email = "";
      l.skills = [];
      l.outcomes = [];
      l.baselineIncome = null;
      l.consent = false;
      state.evidence = state.evidence.filter((e) => e.learnerId !== l.id);
      state.followups = state.followups.filter((f) => f.learnerId !== l.id);
    }
  }
  state.revision += 1;
  state.audit.push({
    id: uid(),
    at: new Date().toISOString(),
    actor: actor.role === "learner" ? "Learner account" : actor.name,
    action: {
      addLearner: "Learner enrolled with consent",
      recordOutcome: "Outcome recorded",
      verify:
        actor.role === "employer"
          ? "Employer evidence recorded"
          : "Programme review recorded",
      schedule: "Support check-in scheduled",
      withdraw: "Consent withdrawn and personal records removed",
      addJob: "Opportunity added",
      addEmployer: "Employer organization added",
    }[action.type],
    learnerId,
  });
  state.audit = state.audit.slice(-10000);
  return state;
}
export function parseBackup(raw: string) {
  if (raw.length > 15_000_000)
    throw new Error("Backup must be smaller than 15 MB.");
  const s = stateSchema.parse(JSON.parse(raw));
  const ids = new Set(s.learners.map((l) => l.id));
  if (ids.size !== s.learners.length)
    throw new Error("Duplicate learner identifiers.");
  if (s.followups.some((f) => !ids.has(f.learnerId)))
    throw new Error("A follow-up has no matching learner.");
  if (
    s.evidence.some(
      (e) =>
        !s.learners.some(
          (l) =>
            l.id === e.learnerId &&
            l.outcomes.some((o) => o.id === e.outcomeId),
        ),
    )
  )
    throw new Error("Evidence has no matching outcome.");
  return s;
}
