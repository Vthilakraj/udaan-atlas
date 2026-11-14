import "dotenv/config";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { createApp, createDatabase, createUser } from "./app";
const password = process.env.ADMIN_PASSWORD || "";
const email = process.env.ADMIN_EMAIL || "";
const dbPath = process.env.DATABASE_PATH || "./data/atlas.sqlite";
mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
const db = createDatabase(dbPath, process.env.SEED_SAMPLE_DATA === "true");
if (!db.prepare("SELECT id FROM users WHERE role=?").get("admin")) {
  if (
    password.length < 12 ||
    password.includes("replace-with") ||
    !email.includes("@")
  )
    throw new Error(
      "Set ADMIN_EMAIL and a unique ADMIN_PASSWORD of at least 12 characters before first start.",
    );
  createUser(db, { email, password, name: "Programme lead", role: "admin" });
}
const port = Number(process.env.PORT || 4100);
const origin = process.env.PUBLIC_ORIGIN || `http://localhost:${port}`;
if (process.env.NODE_ENV === "production" && !origin.startsWith("https://"))
  throw new Error("Production requires an HTTPS PUBLIC_ORIGIN.");
const app = createApp(db, { origin, secure: origin.startsWith("https://") });
const server = app.listen(port, "0.0.0.0", () =>
  console.log(`Udaan Atlas API ready on port ${port}.`),
);
process.on("SIGTERM", () =>
  server.close(() => {
    db.close();
    process.exit(0);
  }),
);
process.on("SIGINT", () =>
  server.close(() => {
    db.close();
    process.exit(0);
  }),
);
