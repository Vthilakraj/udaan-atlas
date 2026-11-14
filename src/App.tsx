import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  LayoutDashboard,
  UsersRound,
  MessagesSquare,
  BadgeCheck,
  Orbit,
  HeartHandshake,
  Menu,
  X,
  Plus,
  ArrowDownToLine,
  ChevronDown,
  Settings2,
  HelpCircle,
  LogOut,
  Check,
  ShieldCheck,
  Sparkles,
  LoaderCircle,
} from "lucide-react";
import {
  dayKey,
  latestOutcome,
  latestEvidence,
  type Action,
} from "../shared/model";
import { API_MODE, useWorkspace } from "./store";
import { Logo, Avatar } from "./ui";
import { AtlasContext, type Page, type Dialog } from "./context";
import {
  Overview,
  Learners,
  Followups,
  EvidenceDesk,
  SkillRadar,
  Portal,
} from "./pages";
import { Dialogs } from "./dialogs";
const navigation = [
  { id: "overview", label: "The big picture", icon: LayoutDashboard },
  { id: "learners", label: "Learner passports", icon: UsersRound },
  { id: "followups", label: "Follow-up studio", icon: MessagesSquare },
  { id: "evidence", label: "Evidence desk", icon: BadgeCheck },
  { id: "radar", label: "Skill radar", icon: Orbit },
  { id: "portal", label: "My next chapter", icon: HeartHandshake },
] as const;
export default function App() {
  const ws = useWorkspace();
  const [page, setPage] = useState<Page>("overview");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [district, setDistrict] = useState("All districts");
  const [course, setCourse] = useState("All courses");
  const [query, setQuery] = useState("");
  const [mobile, setMobile] = useState(false);
  const [toast, setToast] = useState("");
  const [jobFilter, setJobFilter] = useState("");
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = (text: string) => {
    setToast(text);
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setToast(""), 5500);
  };
  const go = (next: Page) => {
    setPage(next);
    setMobile(false);
    setQuery("");
  };
  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
    },
    [],
  );
  useEffect(() => {
    if (ws.actor.role === "employer") setPage("evidence");
    else if (ws.actor.role === "learner") setPage("portal");
    else setPage("overview");
    setDistrict("All districts");
    setCourse("All courses");
    setDialog(null);
  }, [ws.actor.role]);
  useEffect(() => {
    document.title = `${navigation.find((n) => n.id === page)?.label || "Workspace"} · Udaan Atlas`;
  }, [page]);
  const act = async (action: Action, message: string) => {
    try {
      await ws.dispatch(action);
      notify(message);
      return true;
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "That update could not be saved.",
      );
      return false;
    }
  };
  const state = ws.state;
  const learners = state.learners.filter(
    (l) =>
      (district === "All districts" || l.district === district) &&
      (course === "All courses" || l.courseId === course),
  );
  const due = state.followups.filter(
    (f) =>
      !f.completed &&
      f.due <= dayKey() &&
      state.learners.some((l) => l.id === f.learnerId && l.consent),
  ).length;
  const pending = state.learners.filter((l) => {
    const o = latestOutcome(l);
    return (
      l.consent &&
      o &&
      ["Employed", "Apprenticeship"].includes(o.status) &&
      !latestEvidence(state, o.id)
    );
  }).length;
  const navItems = navigation.filter(
    (n) =>
      ws.actor.role === "admin" ||
      (ws.actor.role === "employer"
        ? ["evidence", "radar"].includes(n.id)
        : ["portal", "radar"].includes(n.id)),
  );
  if (ws.loading)
    return (
      <div className="startup">
        <Logo />
        <LoaderCircle className="spin" />
        <p>Opening your atlas…</p>
      </div>
    );
  if (!ws.authenticated) return <Login login={ws.login} />;
  return (
    <AtlasContext.Provider
      value={{
        ws,
        page,
        go,
        open: setDialog,
        notify,
        act,
        district,
        setDistrict,
        course,
        setCourse,
        learners,
        query,
        setQuery,
        jobFilter,
        setJobFilter,
      }}
    >
      <div className="app-shell">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {mobile && (
          <button
            className="sidebar-overlay"
            aria-label="Close navigation"
            onClick={() => setMobile(false)}
          />
        )}
        <aside className={`sidebar ${mobile ? "open" : ""}`}>
          <a
            href="#"
            className="brand-link"
            onClick={(e) => {
              e.preventDefault();
              go(
                ws.actor.role === "admin"
                  ? "overview"
                  : ws.actor.role === "employer"
                    ? "evidence"
                    : "portal",
              );
            }}
          >
            <Logo />
          </a>
          <span className="brand-caption">SKILLS → POSSIBILITIES</span>
          <div className="workspace-switch">
            <span className="workspace-mark">M</span>
            <span>
              Maharashtra<span>Skills & livelihoods workspace</span>
            </span>
            <ChevronDown size={14} />
          </div>
          <span className="nav-label">MAKE AN IMPACT</span>
          <nav aria-label="Main navigation">
            {navItems.map((n) => (
              <button
                key={n.id}
                className={`nav-link ${page === n.id ? "active" : ""}`}
                onClick={() => go(n.id)}
                aria-current={page === n.id ? "page" : undefined}
              >
                <n.icon size={19} strokeWidth={1.75} />
                <span>{n.label}</span>
                {n.id === "followups" && due > 0 && <b>{due}</b>}
                {n.id === "evidence" && pending > 0 && <i />}
              </button>
            ))}
          </nav>
          <div className="sidebar-mission">
            <span className="mission-spark">✳</span>
            <span className="eyebrow">THE BIGGER WHY</span>
            <h3>
              A certificate is
              <br />
              just the beginning.
            </h3>
            <p>
              Let’s make the next
              <br />
              chapter count.
            </p>
            <button onClick={() => setDialog({ type: "guide" })}>
              Meet your atlas <ArrowUpRight size={15} />
            </button>
            <span className="mission-ring" />
          </div>
          <div className="sidebar-bottom">
            <button onClick={() => setDialog({ type: "guide" })}>
              <HelpCircle size={17} />
              How it all connects
            </button>
            <button onClick={() => setDialog({ type: "settings" })}>
              <Settings2 size={17} />
              Workspace & data
            </button>
            <div className="sidebar-person">
              <Avatar name={ws.actor.name} color="#ded2ff" />
              <span>
                {ws.actor.name}
                <small>
                  {API_MODE ? "Private workspace" : "Interactive demo"}
                </small>
              </span>
              {API_MODE ? (
                <button
                  className="icon-button"
                  aria-label="Sign out"
                  onClick={() =>
                    void ws.logout().catch((e) => notify(e.message))
                  }
                >
                  <LogOut size={16} />
                </button>
              ) : (
                <span className="online-dot" />
              )}
            </div>
          </div>
        </aside>
        <div className="main-workspace">
          <header className="topbar">
            <div className="breadcrumb">
              <button
                className="icon-button mobile-menu"
                aria-label="Open navigation"
                onClick={() => setMobile(true)}
              >
                <Menu size={23} />
              </button>
              <span>Workspace</span>
              <span className="breadcrumb-dot">/</span>
              <strong>{navigation.find((n) => n.id === page)?.label}</strong>
            </div>
            <div className="topbar-actions">
              <button
                className={`environment-pill ${API_MODE ? "connected" : ""}`}
                onClick={() => setDialog({ type: "guide" })}
              >
                <span />
                {API_MODE ? "Connected workspace" : "Explore the demo"}
                <ArrowUpRight size={12} />
              </button>
              {!API_MODE && (
                <label className="role-switch">
                  <span>View as</span>
                  <select
                    aria-label="Demo role"
                    value={ws.actor.role}
                    onChange={(e) => ws.changeRole(e.target.value)}
                  >
                    <option value="admin">Programme team</option>
                    <option value="employer">Employer</option>
                    <option value="learner">Learner</option>
                  </select>
                </label>
              )}
              <button
                className="profile-button"
                aria-label="Open workspace settings"
                onClick={() => setDialog({ type: "settings" })}
              >
                <Avatar name={ws.actor.name} color="#fce4d6" />
              </button>
            </div>
          </header>
          <main id="main" tabIndex={-1}>
            {!API_MODE && (
              <div className="demo-ribbon">
                <Sparkles size={13} />
                <span>
                  A working demo with fictional learners. Your edits stay in
                  this browser.
                </span>
                <button onClick={() => setDialog({ type: "guide" })}>
                  What can I try? <ArrowRight size={12} />
                </button>
              </div>
            )}
            {ws.warning && (
              <div className="warning" role="alert">
                {ws.warning}
              </div>
            )}
            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  <span className="purple-dot" />
                  {page === "overview"
                    ? "PEOPLE. PROGRESS. POSSIBILITIES."
                    : page === "learners"
                      ? "EVERY JOURNEY HAS A STORY"
                      : page === "followups"
                        ? "STAY CLOSE TO THE JOURNEY"
                        : page === "evidence"
                          ? "CONFIDENCE COMES FROM CLARITY"
                          : page === "radar"
                            ? "BUILD THE BRIDGE TO WHAT’S NEXT"
                            : "YOUR JOURNEY IS STILL UNFOLDING"}
                </span>
                <h1>
                  {page === "overview" ? (
                    <>
                      Your impact,
                      <br className="mobile-only" /> in full <em>color.</em>
                      <span className="heading-star">✳</span>
                    </>
                  ) : page === "learners" ? (
                    <>
                      People, not just <em>numbers.</em>
                    </>
                  ) : page === "followups" ? (
                    <>
                      A timely hello.
                      <br className="mobile-only" /> A bigger{" "}
                      <em>difference.</em>
                    </>
                  ) : page === "evidence" ? (
                    <>
                      Good stories.
                      <br className="mobile-only" /> Stronger <em>evidence.</em>
                    </>
                  ) : page === "radar" ? (
                    <>
                      Small gaps.
                      <br className="mobile-only" /> Big <em>possibilities.</em>
                    </>
                  ) : (
                    <>
                      Your skills.
                      <br className="mobile-only" /> Your next <em>chapter.</em>
                    </>
                  )}
                </h1>
                <p>
                  {page === "overview"
                    ? "Connect the dots between learning, earning, and lasting change."
                    : page === "learners"
                      ? "One passport for every learner. A clearer picture of every possibility."
                      : page === "followups"
                        ? "Turn missed updates into meaningful conversations."
                        : page === "evidence"
                          ? "Keep reported outcomes and independently confirmed evidence distinct."
                          : page === "radar"
                            ? "Match learner strengths with employer needs, one practical step at a time."
                            : "A little support for the journey from learning to earning."}
                </p>
              </div>
              <div className="heading-actions">
                {ws.actor.role === "admin" && (
                  <button
                    className="button light"
                    onClick={() => setDialog({ type: "report" })}
                  >
                    <ArrowDownToLine size={16} />
                    Impact report
                  </button>
                )}
                {ws.actor.role === "admin" && (
                  <button
                    className="button purple"
                    onClick={() => setDialog({ type: "enroll" })}
                  >
                    <Plus size={17} />
                    Add learner
                  </button>
                )}
              </div>
            </div>
            {ws.actor.role === "admin" && (
              <div className="cohort-toolbar">
                <span className="cohort-label">
                  <span />
                  YOUR LENS
                </span>
                <label>
                  <span className="sr-only">District filter</span>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  >
                    <option>All districts</option>
                    {[
                      ...new Set(
                        state.learners
                          .filter((l) => l.consent)
                          .map((l) => l.district),
                      ),
                    ]
                      .sort()
                      .map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                  </select>
                </label>
                <label>
                  <span className="sr-only">Course filter</span>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                  >
                    <option>All courses</option>
                    {state.courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="as-of">
                  As of{" "}
                  {new Date().toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  <span className="tiny-green" />
                </span>
              </div>
            )}
            {page === "overview" && <Overview />}
            {page === "learners" && <Learners />}
            {page === "followups" && <Followups />}
            {page === "evidence" && <EvidenceDesk />}
            {page === "radar" && <SkillRadar />}
            {page === "portal" && <Portal />}
            <footer className="page-footer">
              <span>
                <span>✳</span>Every skill deserves a next chapter.
              </span>
              <button onClick={() => setDialog({ type: "guide" })}>
                <ShieldCheck size={13} />
                Consent first. People always.
              </button>
              <span>UDAAN ATLAS · SIH26135</span>
            </footer>
          </main>
        </div>
        {dialog && <Dialogs dialog={dialog} close={() => setDialog(null)} />}
        {toast && (
          <div className="toast" role="status">
            <span>
              <Check size={16} />
            </span>
            {toast}
            <button
              onClick={() => setToast("")}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </AtlasContext.Provider>
  );
}
function Login({
  login,
}: {
  login: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="login-screen">
      <section className="login-story">
        <Logo />
        <span className="eyebrow">A FUTURE WORTH FOLLOWING</span>
        <h1>
          Skills open doors.
          <br />
          <em>
            Stay for the
            <br />
            next chapter.
          </em>
        </h1>
        <span className="login-spark">✳</span>
        <p>
          A shared picture of learning, earning,
          <br />
          and possibilities taking shape.
        </p>
      </section>
      <form
        className="login-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await login(email, password);
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <BadgeCheck size={34} />
        <h2>Welcome to your atlas.</h2>
        <p>Sign in to your private programme workspace.</p>
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <div role="alert" className="form-error">
            {error}
          </div>
        )}
        <button className="button purple" disabled={busy}>
          {busy ? "Signing in…" : "Open my workspace"}
          <ArrowRight size={17} />
        </button>
        <small>Your programme administrator provides your account.</small>
      </form>
    </div>
  );
}
