import { describe, it, expect } from "vitest";
import { createSeed } from "../shared/seed";
import {
  applyAction,
  metrics,
  evidenceLabel,
  latestOutcome,
  priority,
  scopeState,
  parseBackup,
  shiftDay,
  type Actor,
} from "../shared/model";
const admin: Actor = { id: "admin", name: "Programme lead", role: "admin" };
const today = "2026-11-14";
describe("outcome passports and evidence", () => {
  it("keeps missing outcomes separate and computes metrics from the consenting cohort", () => {
    const s = createSeed(today);
    const m = metrics(s, s.learners, today);
    expect(m.total).toBe(48);
    expect(m.unreported).toBe(4);
    expect(m.working).toBe(
      s.learners.filter((l) =>
        ["Employed", "Self-employed", "Apprenticeship"].includes(
          latestOutcome(l, today)?.status || "",
        ),
      ).length,
    );
    const empty = metrics(s, [], today);
    expect(empty.coverage).toBe(0);
    expect(empty.medianIncome).toBe(0);
  });
  it("does not transfer employer confirmation to a new outcome", () => {
    const s = createSeed(today);
    const l = s.learners.find(
      (l) => evidenceLabel(s, latestOutcome(l, today)) === "Employer confirmed",
    )!;
    const o = latestOutcome(l, today)!;
    const next = applyAction(
      s,
      {
        type: "recordOutcome",
        learnerId: l.id,
        outcome: { ...o, date: today, income: 25000 },
      },
      admin,
      today,
    );
    expect(
      evidenceLabel(
        next,
        latestOutcome(next.learners.find((x) => x.id === l.id)!, today),
      ),
    ).toBe("Self-reported");
    expect(evidenceLabel(next, o)).toBe("Employer confirmed");
  });
  it("labels staff reviews separately and rejects a learner verifying their own claim", () => {
    const s = createSeed(today);
    const l = s.learners.find((l) => latestOutcome(l, today)?.employerId)!;
    const o = latestOutcome(l, today)!;
    const action = {
      type: "verify",
      learnerId: l.id,
      outcomeId: o.id,
      verdict: "Confirmed",
      note: "A staff-assisted document review.",
    };
    const next = applyAction(s, action, admin, today);
    expect(evidenceLabel(next, o)).toBe("Team reviewed");
    expect(() =>
      applyAction(
        s,
        action,
        { id: "learner", name: l.name, role: "learner", learnerId: l.id },
        today,
      ),
    ).toThrow();
    expect(() =>
      applyAction(
        s,
        action,
        {
          id: "employer",
          name: "Other employer",
          role: "employer",
          employerId: "not-linked",
        },
        today,
      ),
    ).toThrow();
  });
  it("withdraws consent, deletes identifying outcome data, and blocks future contact", () => {
    const s = createSeed(today);
    const l = s.learners[0];
    const next = applyAction(
      s,
      { type: "withdraw", learnerId: l.id },
      admin,
      today,
    );
    const removed = next.learners[0];
    expect(removed.name).toBe("Consent withdrawn");
    expect(removed.email).toBe("");
    expect(removed.outcomes).toEqual([]);
    expect(next.followups.some((f) => f.learnerId === l.id)).toBe(false);
    expect(next.evidence.some((e) => e.learnerId === l.id)).toBe(false);
    expect(metrics(next, next.learners, today).total).toBe(47);
    expect(() =>
      applyAction(
        next,
        { type: "schedule", learnerId: l.id, due: today, note: "test" },
        admin,
        today,
      ),
    ).toThrow("Consent");
  });
  it("creates milestones from the training date and prevents future outcomes and crossed follow-ups", () => {
    const s = createSeed(today, true);
    const next = applyAction(
      s,
      {
        type: "addLearner",
        learner: {
          name: "Kavya Patil",
          email: "kavya@example.test",
          district: "Pune",
          courseId: "solar",
          providerId: "p1",
          gender: "Woman",
          trainedOn: "2026-10-01",
          baselineIncome: null,
          consent: true,
          skills: ["Wiring"],
        },
      },
      admin,
      today,
    );
    expect(next.followups.map((f) => f.due)).toEqual(
      [30, 90, 180, 365].map((n) => shiftDay("2026-10-01", n)),
    );
    const l = next.learners[0];
    const outcome = {
      date: "2027-01-01",
      status: "Seeking work",
      income: 0,
      employerId: "",
      role: "",
      skillsNeeded: [],
      note: "",
    };
    expect(() =>
      applyAction(
        next,
        { type: "recordOutcome", learnerId: l.id, outcome },
        admin,
        today,
      ),
    ).toThrow("between");
    expect(() =>
      applyAction(
        next,
        {
          type: "recordOutcome",
          learnerId: l.id,
          outcome: { ...outcome, date: today },
          followupId: "foreign",
        },
        admin,
        today,
      ),
    ).toThrow("belong");
  });
  it("makes support reasons explainable and ignores gender, district, and baseline income", () => {
    const s = createSeed(today);
    const l = s.learners[0];
    const first = priority(s, l, today);
    expect(
      priority(
        s,
        {
          ...l,
          gender: "Non-binary",
          district: "Other",
          baselineIncome: 99999,
        },
        today,
      ),
    ).toEqual(first);
    expect(first.reasons.length).toBeGreaterThan(0);
  });
  it("scopes employer and learner views at the data boundary", () => {
    const s = createSeed(today);
    const learner = scopeState(s, {
      id: "a",
      name: "Learner",
      role: "learner",
      learnerId: s.learners[0].id,
    });
    expect(learner.learners).toHaveLength(1);
    const employer = scopeState(s, {
      id: "b",
      name: "Employer",
      role: "employer",
      employerId: "grid",
    });
    expect(employer.followups).toEqual([]);
    for (const l of employer.learners) {
      expect(l.email).toBe("");
      expect(l.outcomes.every((o) => o.employerId === "grid")).toBe(true);
    }
    expect(employer.learners.length).toBeLessThan(s.learners.length);
  });
  it("validates backup versions, calendar dates, duplicates, and broken evidence links", () => {
    const s = createSeed(today);
    expect(parseBackup(JSON.stringify(s)).learners).toHaveLength(48);
    expect(() => parseBackup(JSON.stringify({ ...s, version: 2 }))).toThrow();
    expect(() =>
      parseBackup(
        JSON.stringify({ ...s, learners: [s.learners[0], s.learners[0]] }),
      ),
    ).toThrow("Duplicate");
    expect(() =>
      parseBackup(
        JSON.stringify({
          ...s,
          evidence: [{ ...s.evidence[0], outcomeId: "missing" }],
        }),
      ),
    ).toThrow("matching");
    const bad = structuredClone(s);
    bad.learners[0].trainedOn = "2026-02-30";
    expect(() => parseBackup(JSON.stringify(bad))).toThrow();
  });
});
