import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { DatabaseSync } from "node:sqlite";
import {
  randomBytes,
  createHash,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  applyAction,
  scopeState,
  type State,
  type Actor,
} from "../shared/model";
import { createSeed } from "../shared/seed";
type User = {
  id: string;
  email: string;
  name: string;
  role: Actor["role"];
  binding: string;
  hash: string;
  salt: string;
};
const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export function createDatabase(filename: string, seed = true) {
  const db = new DatabaseSync(filename);
  db.exec(
    "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS workspace (id INTEGER PRIMARY KEY CHECK(id=1), payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL, binding TEXT NOT NULL, hash TEXT NOT NULL, salt TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);",
  );
  if (!db.prepare("SELECT id FROM workspace WHERE id=1").get())
    db.prepare("INSERT INTO workspace(id,payload) VALUES(1,?)").run(
      JSON.stringify(
        seed
          ? createSeed()
          : { ...createSeed(undefined, true), employers: [], jobs: [] },
      ),
    );
  return db;
}
export function createUser(
  db: DatabaseSync,
  input: {
    email: string;
    password: string;
    name: string;
    role: Actor["role"];
    binding?: string;
  },
) {
  const salt = randomBytes(24).toString("hex");
  const hash = scryptSync(input.password, salt, 64).toString("hex");
  const user = {
    id: randomBytes(16).toString("hex"),
    email: input.email.toLowerCase(),
    name: input.name,
    role: input.role,
    binding: input.binding || "",
    hash,
    salt,
  };
  db.prepare(
    "INSERT INTO users(id,email,name,role,binding,hash,salt) VALUES(?,?,?,?,?,?,?)",
  ).run(user.id, user.email, user.name, user.role, user.binding, hash, salt);
  return user;
}
const actorOf = (user: User): Actor => ({
  id: user.id,
  name: user.name,
  role: user.role,
  employerId: user.role === "employer" ? user.binding : undefined,
  learnerId: user.role === "learner" ? user.binding : undefined,
});
const readState = (db: DatabaseSync): State =>
  JSON.parse(
    (
      db.prepare("SELECT payload FROM workspace WHERE id=1").get() as {
        payload: string;
      }
    ).payload,
  );
export function createApp(
  db: DatabaseSync,
  options: { origin?: string; secure?: boolean; staticDir?: string } = {},
) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "512kb" }));
  const origin = options.origin || "http://localhost:5173";
  const secure = options.secure || false;
  const attempts = new Map<string, { count: number; until: number }>();
  const cookieName = "atlas_session";
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("X-Frame-Options", "DENY");
    if (req.path.startsWith("/api")) res.setHeader("Cache-Control", "no-store");
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.headers.origin !== origin
    ) {
      res.status(403).json({ error: "Request origin is not allowed." });
      return;
    }
    next();
  });
  const auth = (req: Request, res: Response, next: NextFunction) => {
    const raw = req.headers.cookie
      ?.split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1);
    if (!raw || raw.length > 256) {
      res.status(401).json({ error: "Sign in to continue." });
      return;
    }
    const user = db
      .prepare(
        "SELECT users.* FROM users JOIN sessions ON users.id=sessions.user_id WHERE sessions.token_hash=? AND sessions.expires>?",
      )
      .get(digest(raw), Date.now()) as User | undefined;
    if (!user) {
      res
        .status(401)
        .json({ error: "Your session expired. Please sign in again." });
      return;
    }
    res.locals.actor = actorOf(user);
    next();
  };
  const admin = (_req: Request, res: Response, next: NextFunction) => {
    if (res.locals.actor.role !== "admin") {
      res.status(403).json({ error: "Programme-team access required." });
      return;
    }
    next();
  };
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.post("/api/login", (req, res) => {
    const key = req.ip || "local";
    const entry = attempts.get(key);
    if (entry && entry.until > Date.now() && entry.count >= 15) {
      res
        .status(429)
        .json({ error: "Too many attempts. Try again in 15 minutes." });
      return;
    }
    const parsed = z
      .object({ email: z.email(), password: z.string().min(1).max(200) })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Enter your email and password." });
      return;
    }
    const user = db
      .prepare("SELECT * FROM users WHERE email=?")
      .get(parsed.data.email.toLowerCase()) as User | undefined;
    const expected = Buffer.from(user?.hash || "00".repeat(64), "hex");
    const computed = scryptSync(
      parsed.data.password,
      user?.salt || "invalid-user-salt",
      64,
    );
    if (!user || !timingSafeEqual(expected, computed)) {
      attempts.set(key, {
        count: entry && entry.until > Date.now() ? entry.count + 1 : 1,
        until: Date.now() + 15 * 60 * 1000,
      });
      res.status(401).json({ error: "Email or password is incorrect." });
      return;
    }
    attempts.delete(key);
    const token = randomBytes(32).toString("hex");
    db.prepare("DELETE FROM sessions WHERE expires<=?").run(Date.now());
    db.prepare(
      "INSERT INTO sessions(token_hash,user_id,expires) VALUES(?,?,?)",
    ).run(digest(token), user.id, Date.now() + 8 * 60 * 60 * 1000);
    res.cookie(cookieName, token, {
      httpOnly: true,
      secure,
      sameSite: "strict",
      maxAge: 8 * 60 * 60 * 1000,
      path: "/api",
    });
    res.json({ actor: actorOf(user) });
  });
  app.post("/api/logout", auth, (req, res) => {
    const raw = req.headers.cookie
      ?.split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1);
    if (raw)
      db.prepare("DELETE FROM sessions WHERE token_hash=?").run(digest(raw));
    res.clearCookie(cookieName, {
      httpOnly: true,
      secure,
      sameSite: "strict",
      path: "/api",
    });
    res.json({ ok: true });
  });
  app.get("/api/state", auth, (_req, res) =>
    res.json({
      actor: res.locals.actor,
      state: scopeState(readState(db), res.locals.actor),
    }),
  );
  app.post("/api/actions", auth, (req, res) => {
    const parsed = z
      .object({
        expectedRevision: z.number().int().min(0),
        action: z.unknown(),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "A valid workspace revision and action are required." });
      return;
    }
    try {
      db.exec("BEGIN IMMEDIATE");
      const current = readState(db);
      if (current.revision !== parsed.data.expectedRevision) {
        db.exec("ROLLBACK");
        res
          .status(409)
          .json({
            error:
              "Someone updated this workspace. Your view has been refreshed; review it before retrying.",
            state: scopeState(current, res.locals.actor),
          });
        return;
      }
      const next = applyAction(current, parsed.data.action, res.locals.actor);
      db.prepare("UPDATE workspace SET payload=? WHERE id=1").run(
        JSON.stringify(next),
      );
      db.exec("COMMIT");
      res.json({ state: scopeState(next, res.locals.actor) });
    } catch (error) {
      if (db.isTransaction) db.exec("ROLLBACK");
      res
        .status(error instanceof z.ZodError ? 400 : 403)
        .json({
          error:
            error instanceof z.ZodError
              ? "Some fields are invalid. Check the form and try again."
              : error instanceof Error
                ? error.message
                : "This action could not be completed.",
        });
    }
  });
  app.post("/api/users", auth, admin, (req, res) => {
    const parsed = z
      .object({
        email: z.email(),
        password: z.string().min(12).max(200),
        name: z.string().trim().min(1).max(100),
        role: z.enum(["admin", "employer", "learner"]),
        binding: z.string().max(100).optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({
          error:
            "Use a valid email, name, role, and password of at least 12 characters.",
        });
      return;
    }
    const input = parsed.data;
    const state = readState(db);
    if (
      (input.role === "employer" &&
        !state.employers.some((e) => e.id === input.binding)) ||
      (input.role === "learner" &&
        !state.learners.some((l) => l.id === input.binding && l.consent))
    ) {
      res
        .status(400)
        .json({
          error:
            "Bind this account to an existing employer or consenting learner.",
        });
      return;
    }
    try {
      const user = createUser(db, input);
      res
        .status(201)
        .json({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            binding: user.binding,
          },
        });
    } catch {
      res.status(409).json({ error: "This email already has an account." });
    }
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "API route not found." }),
  );
  const staticDir = options.staticDir || path.resolve("dist");
  if (existsSync(path.join(staticDir, "index.html"))) {
    app.use(express.static(staticDir));
    app.get("/{*path}", (_req, res) =>
      res.sendFile(path.join(staticDir, "index.html")),
    );
  }
  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      res
        .status(400)
        .json({
          error:
            error instanceof SyntaxError
              ? "Invalid JSON request."
              : "The request could not be processed.",
        });
    },
  );
  return app;
}
