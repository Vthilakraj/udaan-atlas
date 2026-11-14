import { beforeEach, afterEach, describe, it, expect } from "vitest";
import request from "supertest";
import { createApp, createDatabase, createUser } from "../server/app";
import { latestOutcome } from "../shared/model";
let db: ReturnType<typeof createDatabase>;
let app: ReturnType<typeof createApp>;
const origin = "http://localhost:5173";
const password = "test-only-long-password";
beforeEach(() => {
  db = createDatabase(":memory:");
  createUser(db, {
    email: "admin@example.test",
    password,
    name: "Team",
    role: "admin",
  });
  createUser(db, {
    email: "learner@example.test",
    password,
    name: "Learner",
    role: "learner",
    binding: "UA-1001",
  });
  createUser(db, {
    email: "employer@example.test",
    password,
    name: "Employer",
    role: "employer",
    binding: "grid",
  });
  app = createApp(db, { origin, staticDir: "/no-static-files" });
});
afterEach(() => db.close());
const signIn = async (email: string) => {
  const agent = request.agent(app);
  const response = await agent
    .post("/api/login")
    .set("Origin", origin)
    .send({ email, password });
  expect(response.status).toBe(200);
  expect(response.headers["set-cookie"][0]).toContain("HttpOnly");
  return agent;
};
describe("private API", () => {
  it("requires authentication and rejects cross-origin writes", async () => {
    expect((await request(app).get("/api/state")).status).toBe(401);
    expect(
      (
        await request(app)
          .post("/api/login")
          .set("Origin", "https://untrusted.example")
          .send({ email: "admin@example.test", password })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post("/api/login")
          .set("Origin", origin)
          .send({ email: "admin@example.test", password: "wrong" })
      ).status,
    ).toBe(401);
  });
  it("isolates learner data and forbids another learner’s updates and self-verification", async () => {
    const agent = await signIn("learner@example.test");
    const result = await agent.get("/api/state");
    expect(result.body.state.learners).toHaveLength(1);
    const s = result.body.state;
    const o = latestOutcome(s.learners[0])!;
    const denied = await agent
      .post("/api/actions")
      .set("Origin", origin)
      .send({
        expectedRevision: s.revision,
        action: {
          type: "verify",
          learnerId: "UA-1001",
          outcomeId: o.id,
          verdict: "Confirmed",
          note: "Trying to confirm myself",
        },
      });
    expect(denied.status).toBe(403);
    const foreign = await agent
      .post("/api/actions")
      .set("Origin", origin)
      .send({
        expectedRevision: s.revision,
        action: {
          type: "recordOutcome",
          learnerId: "UA-1002",
          outcome: { ...o, date: o.date },
        },
      });
    expect(foreign.status).toBe(403);
  });
  it("stores a valid update and returns a conflict for stale concurrent writes", async () => {
    const agent = await signIn("admin@example.test");
    const result = await agent.get("/api/state");
    const s = result.body.state;
    const payload = {
      expectedRevision: s.revision,
      action: {
        type: "schedule",
        learnerId: "UA-1001",
        due: "2099-01-01",
        note: "Skill bridge session",
      },
    };
    expect(
      (await agent.post("/api/actions").set("Origin", origin).send(payload))
        .status,
    ).toBe(200);
    const conflict = await agent
      .post("/api/actions")
      .set("Origin", origin)
      .send(payload);
    expect(conflict.status).toBe(409);
    expect(conflict.body.state.revision).toBe(s.revision + 1);
  });
  it("allows a bound employer to confirm its own outcomes and invalidates logout sessions", async () => {
    const agent = await signIn("employer@example.test");
    const response = await agent.get("/api/state");
    const s = response.body.state;
    expect(s.followups).toHaveLength(0);
    const l = s.learners[0];
    const o = latestOutcome(l)!;
    const result = await agent
      .post("/api/actions")
      .set("Origin", origin)
      .send({
        expectedRevision: s.revision,
        action: {
          type: "verify",
          learnerId: l.id,
          outcomeId: o.id,
          verdict: "Confirmed",
          note: "Role and salary checked by our organization.",
        },
      });
    expect(result.status).toBe(200);
    expect(result.body.state.evidence.at(-1).source).toBe("Employer");
    expect(
      (await agent.post("/api/logout").set("Origin", origin).send({})).status,
    ).toBe(200);
    expect((await agent.get("/api/state")).status).toBe(401);
  });
  it("permits only administrators to provision bound accounts and rejects invalid JSON", async () => {
    const learner = await signIn("learner@example.test");
    expect(
      (await learner.post("/api/users").set("Origin", origin).send({})).status,
    ).toBe(403);
    const admin = await signIn("admin@example.test");
    expect(
      (
        await admin
          .post("/api/users")
          .set("Origin", origin)
          .send({
            email: "new@example.test",
            name: "New learner",
            password,
            role: "learner",
            binding: "missing",
          })
      ).status,
    ).toBe(400);
    expect(
      (
        await admin
          .post("/api/users")
          .set("Origin", origin)
          .send({
            email: "new@example.test",
            name: "New learner",
            password,
            role: "learner",
            binding: "UA-1002",
          })
      ).status,
    ).toBe(201);
    expect(
      (
        await admin
          .post("/api/actions")
          .set("Origin", origin)
          .set("Content-Type", "application/json")
          .send("broken")
      ).status,
    ).toBe(400);
  });
});
