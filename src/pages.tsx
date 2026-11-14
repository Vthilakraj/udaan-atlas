import { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  UsersRound,
  TrendingUp,
  BadgeCheck,
  MessagesSquare,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  Plus,
  Clock3,
  Copy,
  Phone,
  CalendarDays,
  Check,
  ShieldCheck,
  MapPin,
  BriefcaseBusiness,
  BookOpen,
  Download,
  Target,
  HeartHandshake,
  Orbit,
  ExternalLink,
  Layers3,
  TriangleAlert,
  X,
  Milestone,
  MoveUpRight,
} from "lucide-react";
import { useAtlas } from "./context";
import {
  Avatar,
  Badge,
  Status,
  EvidenceTag,
  Empty,
  SectionTitle,
  ArrowCircle,
  money,
  prettyDate,
} from "./ui";
import { OrbitArt, Spark } from "./Art";
import { CourseChart, JourneyDonut } from "./charts";
import {
  dayKey,
  daysBetween,
  latestOutcome,
  evidenceLabel,
  metrics,
  priority,
  skillMatches,
  inWork,
  type Learner,
} from "../shared/model";

export function Overview() {
  const { ws, learners, go, open } = useAtlas();
  const s = ws.state;
  const m = metrics(s, learners);
  const active = learners.filter((l) => l.consent);
  const ids = new Set(active.map((l) => l.id));
  const due = s.followups.filter(
    (f) => ids.has(f.learnerId) && !f.completed && f.due <= dayKey(),
  );
  const needs = active
    .map((l) => ({ l, ...priority(s, l) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const skillCounts: Record<string, number> = {};
  for (const l of active) {
    for (const skill of latestOutcome(l)?.skillsNeeded || [])
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
  }
  const skills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  return (
    <>
      <section className="impact-hero">
        <div className="hero-text">
          <span className="hero-kicker">
            <span />
            BIG DREAMS. VISIBLE PROGRESS.
          </span>
          <h2>
            A skill is a start.
            <br />
            <em>
              A livelihood
              <br />
              is the leap.
            </em>
          </h2>
          <p>
            Follow every learner beyond the classroom.
            <br />
            Find the gaps. Build the bridges. See what changes.
          </p>
          <div className="hero-actions">
            <button className="button ink" onClick={() => go("learners")}>
              Explore the journeys <ArrowUpRight size={18} />
            </button>
            <button
              className="hero-tour"
              onClick={() => open({ type: "guide" })}
            >
              <span>↗</span>See how it connects
            </button>
          </div>
          <div className="hero-people">
            <div className="avatar-stack">
              {active.slice(0, 4).map((l) => (
                <Avatar key={l.id} name={l.name} color={l.color} />
              ))}
            </div>
            <span>
              <strong>{active.length} unique journeys.</strong> One shared
              ambition.
            </span>
          </div>
        </div>
        <OrbitArt />
        <span className="hero-bottom-tag">POSSIBILITY, IN PROGRESS ↗</span>
      </section>
      <div className="metric-grid">
        <Metric
          tone="violet"
          label="Journeys we’re following"
          value={m.total.toString()}
          icon={<UsersRound size={20} />}
          detail="Consenting learners in this view"
          action={() => go("learners")}
        />
        <Metric
          tone="lime"
          label="A next chapter in work"
          value={`${m.placementRate}%`}
          icon={<TrendingUp size={20} />}
          detail={`${m.working} employed, self-employed or apprenticing`}
          action={() => go("learners")}
        />
        <Metric
          tone="peach"
          label="Employer-confirmed stories"
          value={m.verified.toString().padStart(2, "0")}
          icon={<BadgeCheck size={21} />}
          detail="Latest work outcomes confirmed by employers"
          action={() => go("evidence")}
        />
        <Metric
          tone="blue"
          label="Conversations to start"
          value={due.length.toString().padStart(2, "0")}
          icon={<MessagesSquare size={20} />}
          detail="Due milestones, not unique learners"
          action={() => go("followups")}
        />
      </div>
      <div className="overview-grid">
        <section className="panel progress-panel">
          <SectionTitle
            eyebrow="THE JOURNEY, AT A GLANCE"
            title="From learning to earning"
            action={
              <button
                className="icon-button"
                aria-label="Explain programme metrics"
                onClick={() => open({ type: "report" })}
              >
                <ArrowUpRight size={19} />
              </button>
            }
          />
          <div className="chart-legend">
            <span>
              <i className="pale" />
              Completed training
            </span>
            <span>
              <i />
              Currently in work
            </span>
          </div>
          {active.length ? (
            <CourseChart state={s} learners={active} />
          ) : (
            <Empty
              title="Your next story starts here"
              detail="Add a consenting learner or adjust your filters."
            />
          )}
          <div className="chart-footnote">
            <span className="small-spark">✳</span>Different paths. The same
            chance to move forward.
            <button onClick={() => open({ type: "report" })}>
              How we count <ArrowUpRight size={12} />
            </button>
          </div>
        </section>
        <section className="support-panel">
          <div className="support-top">
            <span className="eyebrow">A LITTLE SUPPORT GOES A LONG WAY</span>
            <span className="support-orbit">◎</span>
          </div>
          <h2>
            Who needs
            <br />
            <em>a nudge next?</em>
          </h2>
          <p>Clear reasons. A thoughtful next step.</p>
          <div className="support-list">
            {needs.length ? (
              needs.map(({ l, score, reasons }) => (
                <button
                  key={l.id}
                  onClick={() => open({ type: "passport", learnerId: l.id })}
                >
                  <Avatar name={l.name} color={l.color} />
                  <span>
                    <strong>{l.name}</strong>
                    <small>{reasons[0]}</small>
                  </span>
                  <span className="priority-number">
                    {score}
                    <ArrowUpRight size={13} />
                  </span>
                </button>
              ))
            ) : (
              <div className="support-empty">
                You’re all caught up in this view. A good place to be.
              </div>
            )}
          </div>
          <button className="support-bottom" onClick={() => go("followups")}>
            Open the follow-up studio <ArrowRight size={16} />
          </button>
        </section>
      </div>
      <div className="overview-lower">
        <section className="panel journey-panel">
          <SectionTitle
            eyebrow="THERE’S MORE THAN ONE WAY FORWARD"
            title="Where journeys stand"
          />
          <JourneyDonut learners={active} />
          <div className="donut-note">
            Fictional sample cohort in demo mode. “No update” is shown
            separately.
          </div>
        </section>
        <section className="bridge-panel">
          <div className="bridge-heading">
            <span className="eyebrow">THE SKILL-TO-OPPORTUNITY BRIDGE</span>
            <Spark />
          </div>
          <h2>
            A small skill.
            <br />
            <em>A bigger possibility.</em>
          </h2>
          <p>
            Listen to what learners are missing.
            <br />
            Connect it to a practical next step.
          </p>
          <div className="skill-hints">
            {skills.length ? (
              skills.map(([skill, n]) => (
                <button key={skill} onClick={() => go("radar")}>
                  <span>{skill}</span>
                  <b>{n} learners</b>
                  <ArrowUpRight size={15} />
                </button>
              ))
            ) : (
              <p>No skill gaps reported in this view yet.</p>
            )}
          </div>
          <button className="text-button" onClick={() => go("radar")}>
            Find the next bridge <ArrowRight size={16} />
          </button>
        </section>
      </div>
      <section className="panel activity-panel">
        <SectionTitle
          eyebrow="SMALL STEPS, RECORDED"
          title="A trail you can trust"
          action={
            <Badge tone="green">
              <ShieldCheck size={12} />
              Consent-led
            </Badge>
          }
        />
        <div className="activity-items">
          {s.audit
            .slice(-3)
            .reverse()
            .map((a, i) => (
              <div key={a.id}>
                <span className={`activity-icon activity-${i}`}>
                  <Check size={15} />
                </span>
                <span>
                  <strong>{a.action}</strong>
                  <small>
                    {a.actor} ·{" "}
                    {new Date(a.at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                    {a.learnerId ? ` · ${a.learnerId}` : ""}
                  </small>
                </span>
                <span className="activity-done">
                  RECORDED <ArrowUpRight size={13} />
                </span>
              </div>
            ))}
        </div>
      </section>
    </>
  );
}
function Metric({
  tone,
  label,
  value,
  icon,
  detail,
  action,
}: {
  tone: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  detail: string;
  action: () => void;
}) {
  return (
    <button className={`metric-card ${tone}`} onClick={action}>
      <div>
        <span>{label}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <strong>
        {value}
        <ArrowUpRight size={19} />
      </strong>
      <p>{detail}</p>
    </button>
  );
}

export function Learners() {
  const { ws, learners, query, setQuery, open, jobFilter, setJobFilter } =
    useAtlas();
  const [status, setStatus] = useState("All journeys");
  const [page, setPage] = useState(0);
  const s = ws.state;
  const job = s.jobs.find((j) => j.id === jobFilter);
  const filtered = learners.filter(
    (l) =>
      (
        l.name +
        " " +
        l.id +
        " " +
        l.district +
        " " +
        s.courses.find((c) => c.id === l.courseId)?.title
      )
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "All journeys" ||
        (status === "No update"
          ? !latestOutcome(l)
          : latestOutcome(l)?.status === status)) &&
      (!job ||
        skillMatches(s, l).some((j) => j.id === job.id && j.match >= 50)),
  );
  const actualPage = Math.min(
    page,
    Math.max(0, Math.ceil(filtered.length / 8) - 1),
  );
  const shown = filtered.slice(actualPage * 8, actualPage * 8 + 8);
  return (
    <>
      {job && (
        <div className="match-banner">
          <Orbit size={19} />
          <span>
            Showing learners with at least a 50% skills match for{" "}
            <strong>{job.title}</strong>.
          </span>
          <button
            className="icon-button"
            aria-label="Clear opportunity filter"
            onClick={() => setJobFilter("")}
          >
            <X size={17} />
          </button>
        </div>
      )}
      <section className="panel roster-panel">
        <div className="roster-toolbar">
          <label className="search-field">
            <Search size={18} />
            <input
              placeholder="Find a name, district, course or passport ID…"
              aria-label="Search learners"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
            />
          </label>
          <label className="status-filter">
            <Filter size={15} />
            <span className="sr-only">Journey status</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
            >
              {[
                "All journeys",
                "Employed",
                "Self-employed",
                "Apprenticeship",
                "Seeking work",
                "Left job",
                "Further study",
                "No update",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <span className="result-count">{filtered.length} journeys</span>
        </div>
        <div className="table-scroll">
          <table className="learner-table">
            <thead>
              <tr>
                <th>THE PERSON</th>
                <th>THE STARTING POINT</th>
                <th>THE NEXT CHAPTER</th>
                <th>EVIDENCE</th>
                <th>MONTHLY INCOME</th>
                <th>
                  <span className="sr-only">View passport</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((l) => {
                const o = latestOutcome(l);
                const c = s.courses.find((c) => c.id === l.courseId);
                return (
                  <tr key={l.id}>
                    <td>
                      <button
                        className="person-cell"
                        onClick={() =>
                          open({ type: "passport", learnerId: l.id })
                        }
                      >
                        <Avatar name={l.name} color={l.color} />
                        <span>
                          <strong>{l.name}</strong>
                          <small>
                            {l.id} · {l.district}
                          </small>
                        </span>
                      </button>
                    </td>
                    <td>
                      <span
                        className="course-dot"
                        style={{ background: c?.color }}
                      />
                      {c?.title}
                      <small className="table-sub">
                        Completed {prettyDate(l.trainedOn)}
                      </small>
                    </td>
                    <td>
                      <Status
                        status={
                          !l.consent
                            ? "Consent withdrawn"
                            : o?.status || "No update"
                        }
                      />
                    </td>
                    <td>
                      <EvidenceTag label={evidenceLabel(s, o)} />
                    </td>
                    <td>
                      <strong className="income-cell">
                        {o && inWork(o.status) && o.income
                          ? money(o.income)
                          : "—"}
                      </strong>
                      <small className="table-sub">
                        {o
                          ? `Updated ${prettyDate(o.date)}`
                          : "Awaiting first update"}
                      </small>
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={`Open passport for ${l.name}`}
                        onClick={() =>
                          open({ type: "passport", learnerId: l.id })
                        }
                      >
                        <ArrowUpRight size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!shown.length && (
          <Empty
            title="No journeys in this view"
            detail="Try a different search, status, district, or course."
          />
        )}
        <div className="table-footer">
          <span>
            Showing {filtered.length ? actualPage * 8 + 1 : 0}–
            {Math.min((actualPage + 1) * 8, filtered.length)} of{" "}
            {filtered.length} journeys
          </span>
          <span>Each person. One continuous story.</span>
          <div>
            <button
              className="icon-button"
              disabled={actualPage === 0}
              aria-label="Previous learners page"
              onClick={() => setPage(actualPage - 1)}
            >
              <ChevronLeft size={17} />
            </button>
            <span>{actualPage + 1}</span>
            <button
              className="icon-button"
              disabled={(actualPage + 1) * 8 >= filtered.length}
              aria-label="Next learners page"
              onClick={() => setPage(actualPage + 1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>
      <div className="passport-promise">
        <span>◎</span>
        <div>
          <h2>A passport for possibility.</h2>
          <p>
            Training, self-reported outcomes, employer evidence, and support —
            connected in one journey.
          </p>
        </div>
        <Badge tone="violet">OUTCOME PASSPORT</Badge>
      </div>
    </>
  );
}

export function Followups() {
  const { ws, learners, open, notify } = useAtlas();
  const [tab, setTab] = useState("Due now");
  const s = ws.state;
  const ids = new Set(learners.filter((l) => l.consent).map((l) => l.id));
  const all = s.followups.filter((f) => ids.has(f.learnerId));
  const items = all
    .filter((f) =>
      tab === "Completed"
        ? f.completed
        : !f.completed &&
          (tab === "Due now" ? f.due <= dayKey() : f.due > dayKey()),
    )
    .sort((a, b) => a.due.localeCompare(b.due));
  const copy = async (l: Learner) => {
    try {
      await navigator.clipboard.writeText(
        `Hello ${l.name.split(" ")[0]}, this is your training support team. With your consent, we would like to check how things are going after training. Are you working, learning, or looking for support? Sharing an update is optional. You can withdraw consent at any time.`,
      );
      notify("Check-in copied. Review it before contacting the learner.");
    } catch {
      notify(
        "Clipboard is unavailable in this browser. Open a passport and use the learner’s contact details for an assisted check-in.",
      );
    }
  };
  return (
    <>
      <section className="followup-banner">
        <div>
          <span className="eyebrow">RIGHT MOMENT. HUMAN CONNECTION.</span>
          <h2>
            A hello can open
            <br />
            <em>a whole new door.</em>
          </h2>
          <p>
            Scheduled milestones keep the conversation going.
            <br />
            Priority scores show their reasons, so people make the final call.
          </p>
        </div>
        <div className="milestone-path">
          {[30, 90, 180, 365].map((n, i) => (
            <div key={n}>
              <span className={i === 1 ? "current" : ""}>
                {i === 0 ? <Check size={20} /> : <MessagesSquare size={20} />}
              </span>
              <strong>Day {n}</strong>
              <small>
                {
                  [
                    "First steps",
                    "Find the rhythm",
                    "Lasting progress",
                    "The bigger picture",
                  ][i]
                }
              </small>
            </div>
          ))}
        </div>
      </section>
      <div className="queue-heading">
        <div className="large-tabs">
          {["Due now", "Upcoming", "Completed"].map((t) => (
            <button
              key={t}
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
            >
              {t}
              <span>
                {
                  all.filter((f) =>
                    t === "Completed"
                      ? f.completed
                      : !f.completed &&
                        (t === "Due now"
                          ? f.due <= dayKey()
                          : f.due > dayKey()),
                  ).length
                }
              </span>
            </button>
          ))}
        </div>
        <Badge tone="violet">
          <Clock3 size={12} />
          Earlier due dates first
        </Badge>
      </div>
      <div className="followup-grid">
        {items.slice(0, 18).map((f) => {
          const l = s.learners.find((l) => l.id === f.learnerId)!;
          const p = priority(s, l);
          const overdue = Math.max(0, daysBetween(f.due, dayKey()));
          return (
            <article className="panel followup-card" key={f.id}>
              <div className="followup-card-top">
                <Badge
                  tone={
                    f.completed ? "green" : overdue > 30 ? "coral" : "violet"
                  }
                >
                  {f.completed ? <Check size={12} /> : <Clock3 size={12} />}{" "}
                  {f.milestone}
                </Badge>
                <span>
                  {f.completed
                    ? "Completed"
                    : overdue
                      ? `${overdue} days overdue`
                      : prettyDate(f.due)}
                </span>
              </div>
              <button
                className="followup-person"
                onClick={() => open({ type: "passport", learnerId: l.id })}
              >
                <Avatar name={l.name} color={l.color} large />
                <span>
                  <strong>{l.name}</strong>
                  <small>
                    {s.courses.find((c) => c.id === l.courseId)?.title} ·{" "}
                    {l.district}
                  </small>
                </span>
                <ArrowUpRight size={18} />
              </button>
              <div className="support-reasons">
                <span>
                  SUPPORT PRIORITY <b>{p.score}/100</b>
                </span>
                <p>{p.reasons.join(" · ")}</p>
              </div>
              {f.note && <p className="followup-note">{f.note}</p>}
              {!f.completed && (
                <div className="followup-actions">
                  <button
                    className="button purple"
                    onClick={() =>
                      open({
                        type: "outcome",
                        learnerId: l.id,
                        followupId: f.id,
                      })
                    }
                  >
                    <Phone size={14} />
                    Record check-in
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Copy check-in for ${l.name}, ${f.milestone}`}
                    onClick={() => void copy(l)}
                  >
                    <Copy size={17} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Schedule support for ${l.name}, ${f.milestone}`}
                    onClick={() => open({ type: "schedule", learnerId: l.id })}
                  >
                    <CalendarDays size={17} />
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
      {!items.length && (
        <section className="panel">
          <Empty
            title={
              tab === "Due now"
                ? "A little breathing room."
                : "Nothing here just yet."
            }
            detail="New milestones appear when learners are enrolled or support is scheduled."
          />
        </section>
      )}
      {items.length > 18 && (
        <p className="list-limit">
          Showing the earliest 18 of {items.length} milestones. Record check-ins
          to work through the queue.
        </p>
      )}
      <p className="privacy-note">
        <ShieldCheck size={16} />
        Contact is optional and consent-led. Copying a check-in does not send a
        message.
      </p>
    </>
  );
}

export function EvidenceDesk() {
  const { ws, learners, open } = useAtlas();
  const [filter, setFilter] = useState("Needs a look");
  const s = ws.state;
  const candidates = learners
    .filter((l) => l.consent)
    .map((l) => ({ l, o: latestOutcome(l) }))
    .filter(
      (x): x is { l: Learner; o: NonNullable<typeof x.o> } =>
        !!x.o && !!x.o.employerId,
    );
  const shown = candidates.filter(
    ({ o }) =>
      filter === "All records" ||
      (filter === "Employer confirmed"
        ? evidenceLabel(s, o) === "Employer confirmed"
        : evidenceLabel(s, o) !== "Employer confirmed"),
  );
  return (
    <>
      <section className="evidence-banner">
        <div className="evidence-badge">
          <BadgeCheck size={42} />
        </div>
        <div>
          <span className="eyebrow">TRUST HAS A PAPER TRAIL</span>
          <h2>
            Reported. Reviewed. <em>Clearly distinguished.</em>
          </h2>
          <p>
            {ws.actor.role === "employer"
              ? "Confirm only the outcomes linked to your organization."
              : "Programme reviews stay separate from independent employer confirmation. Switch to the demo Employer role to try employer verification."}
          </p>
        </div>
        <span className="evidence-seal">
          EVIDENCE
          <br />
          <strong>OVER</strong>
          <br />
          ASSUMPTIONS
        </span>
      </section>
      <div className="queue-heading">
        <div className="large-tabs">
          {["Needs a look", "Employer confirmed", "All records"].map((f) => (
            <button
              key={f}
              className={filter === f ? "active" : ""}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="result-count">{shown.length} latest outcomes</span>
      </div>
      <div className="evidence-grid">
        {shown.map(({ l, o }) => (
          <article key={o.id} className="panel evidence-card">
            <div className="evidence-company">
              <span
                style={{
                  background: s.employers.find((e) => e.id === o.employerId)
                    ?.color,
                }}
              >
                <BriefcaseBusiness size={20} />
              </span>
              <div>
                <strong>
                  {s.employers.find((e) => e.id === o.employerId)?.name}
                </strong>
                <small>LINKED EMPLOYER</small>
              </div>
              <ArrowUpRight size={18} />
            </div>
            <div className="evidence-person">
              <Avatar name={l.name} color={l.color} />
              <div>
                <h3>{l.name}</h3>
                <p>{o.role || "Role awaiting details"}</p>
              </div>
            </div>
            <div className="evidence-facts">
              <span>
                Reported monthly income<strong>{money(o.income)}</strong>
              </span>
              <span>
                Outcome date<strong>{prettyDate(o.date)}</strong>
              </span>
            </div>
            <div className="evidence-bottom">
              <EvidenceTag label={evidenceLabel(s, o)} />
              <button
                className="text-button"
                onClick={() =>
                  open({ type: "verify", learnerId: l.id, outcomeId: o.id })
                }
              >
                {ws.actor.role === "employer"
                  ? "Verify outcome"
                  : "Review record"}{" "}
                <ArrowRight size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>
      {!shown.length && (
        <section className="panel">
          <Empty
            title="A clearer picture. A good feeling."
            detail="There are no matching latest employer-linked outcomes in this view."
          />
        </section>
      )}
      <div className="evidence-explainer">
        <div>
          <span>01</span>
          <h3>Learner reports</h3>
          <p>
            A person shares their work status and income. It starts as
            self-reported.
          </p>
        </div>
        <div>
          <span>02</span>
          <h3>The employer confirms</h3>
          <p>
            A bound employer account reviews the exact outcome. A mismatch stays
            visible.
          </p>
        </div>
        <div>
          <span>03</span>
          <h3>The story keeps moving</h3>
          <p>
            A new outcome needs new evidence. Old confirmations never verify a
            new claim.
          </p>
        </div>
      </div>
    </>
  );
}

export function SkillRadar() {
  const { ws, learners, go, setJobFilter, open } = useAtlas();
  const s = ws.state;
  const active = learners.filter((l) => l.consent);
  const gaps: Record<string, number> = {};
  for (const l of active) {
    const match = skillMatches(s, l)[0];
    if (match)
      for (const skill of match.missing) gaps[skill] = (gaps[skill] || 0) + 1;
  }
  const ranked = Object.entries(gaps)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  return (
    <>
      <div className="radar-intro">
        <div className="radar-intro-copy">
          <span className="eyebrow">STRENGTHS MEET OPPORTUNITY</span>
          <h2>
            The bridge is often
            <br />
            <em>one skill away.</em>
          </h2>
          <p>
            Transparent skill matching connects learner strengths to
            employer-entered roles. Every gap is a place to begin.
          </p>
          <div className="radar-key">
            <span>✳</span>Matches use shared skills, not sensitive
            demographics.
          </div>
        </div>
        <div className="radar-visual" aria-hidden="true">
          <div className="radar-ring ring-one" />
          <div className="radar-ring ring-two" />
          <div className="radar-core">
            <Orbit size={48} />
          </div>
          <span className="radar-chip chip-a">YOUR STRENGTHS</span>
          <span className="radar-chip chip-b">WHAT’S NEXT ↗</span>
          <Spark />
        </div>
      </div>
      <div className="radar-columns">
        <section className="panel gap-panel">
          <SectionTitle
            eyebrow="PRACTICAL LEARNING OPPORTUNITIES"
            title="Where a bridge could help"
          />
          <p>Missing skills in each learner’s best-matching listed role.</p>
          <div className="gap-bars">
            {ranked.map(([skill, n], i) => (
              <div key={skill}>
                <div>
                  <strong>{skill}</strong>
                  <span>{n} learners</span>
                </div>
                <span>
                  <i
                    style={{
                      width: `${(n / Math.max(active.length, 1)) * 100}%`,
                      background: [
                        "#8857e8",
                        "#b6d758",
                        "#fa9d83",
                        "#79b0ef",
                        "#dd8fc2",
                      ][i],
                    }}
                  />
                </span>
              </div>
            ))}
          </div>
          {!ranked.length && (
            <Empty
              title="No gaps to show"
              detail="Add learner skills and employer role requirements to compare them."
            />
          )}
          <small>
            Skills match is a checklist comparison, not a prediction of hiring
            success.
          </small>
        </section>
        <section className="pathway-card">
          <span className="pathway-icon">
            <Milestone size={34} />
          </span>
          <span className="eyebrow">FROM INSIGHT TO A NEXT STEP</span>
          <h2>
            Don’t just spot
            <br />
            <em>the gap. Bridge it.</em>
          </h2>
          <p>
            Open a learner’s passport to see missing skills and schedule a
            practical support check-in.
          </p>
          <button
            className="button ink"
            onClick={() => {
              if (ws.actor.role === "admin") go("learners");
              else if (ws.actor.role === "learner") go("portal");
              else go("evidence");
            }}
          >
            Explore a journey <ArrowUpRight size={17} />
          </button>
        </section>
      </div>
      <section className="opportunities">
        <SectionTitle
          eyebrow="EMPLOYER-ENTERED OPPORTUNITIES"
          title="A few doors worth opening"
          action={
            ws.actor.role !== "learner" ? (
              <button
                className="button light"
                onClick={() => open({ type: "opportunity" })}
              >
                <Plus size={15} />
                Add opportunity
              </button>
            ) : undefined
          }
        />
        <p className="section-subtitle">
          Sample roles in the public demo. No live vacancy feed or hiring
          guarantee.
        </p>
        <div className="job-grid">
          {s.jobs.map((job) => {
            const e = s.employers.find((e) => e.id === job.employerId);
            const matched = active.filter((l) =>
              skillMatches(s, l).some((j) => j.id === job.id && j.match >= 50),
            ).length;
            return (
              <article className="panel job-card" key={job.id}>
                <div className="job-card-top">
                  <span style={{ background: e?.color }}>
                    <BriefcaseBusiness size={22} />
                  </span>
                  <Badge tone="gray">
                    {s.courses.find((c) =>
                      c.skills.some((skill) => job.skills.includes(skill)),
                    )?.sector || "Opportunity"}
                  </Badge>
                </div>
                <h3>{job.title}</h3>
                <p>{e?.name}</p>
                <div className="job-details">
                  <span>
                    <MapPin size={13} />
                    {job.district}
                  </span>
                  <strong>
                    {money(job.minPay)}–{money(job.maxPay)}
                    <small>/mo</small>
                  </strong>
                </div>
                <div className="skill-tags">
                  {job.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
                <div className="job-card-bottom">
                  <span>{matched} learners with ≥50% match</span>
                  {ws.actor.role === "admin" ? (
                    <button
                      className="text-button"
                      onClick={() => {
                        setJobFilter(job.id);
                        go("learners");
                      }}
                    >
                      Find learners <ArrowUpRight size={15} />
                    </button>
                  ) : (
                    <Badge tone="violet">
                      {ws.actor.role === "learner"
                        ? `${skillMatches(s, active[0] || { skills: [] }).find((j) => j.id === job.id)?.match || 0}% skills match`
                        : "Requirements visible"}
                    </Badge>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}

export function Portal() {
  const { ws, open } = useAtlas();
  const [selected, setSelected] = useState("");
  const s = ws.state;
  const available = s.learners.filter((l) => l.consent);
  const learner = available.find((l) => l.id === selected) || available[0];
  if (!learner)
    return (
      <section className="panel">
        <Empty
          title="Your privacy comes first"
          detail="No active learner passport is available. Contact your programme team if you need support."
        />
      </section>
    );
  const l = learner;
  const o = latestOutcome(l);
  const matches = skillMatches(s, l);
  const best = matches[0];
  return (
    <>
      {ws.actor.role === "admin" && (
        <label className="portal-picker">
          Preview a learner journey
          <select value={l.id} onChange={(e) => setSelected(e.target.value)}>
            {available.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} · {l.id}
              </option>
            ))}
          </select>
        </label>
      )}
      <section className="learner-hero">
        <div>
          <span className="eyebrow">
            HELLO, {l.name.split(" ")[0].toUpperCase()} 👋
          </span>
          <h2>
            Your certificate
            <br />
            is a start.
            <br />
            <em>Let’s keep going.</em>
          </h2>
          <p>
            You’ve learned something valuable.
            <br />
            Let’s give your next chapter a little room to grow.
          </p>
          <button
            className="button ink"
            onClick={() => open({ type: "outcome", learnerId: l.id })}
          >
            Share an update <ArrowUpRight size={17} />
          </button>
        </div>
        <div className="learner-passport-card">
          <span className="passport-mini-brand">UDAAN / OUTCOME PASSPORT</span>
          <Avatar name={l.name} color={l.color} large />
          <h3>{l.name}</h3>
          <p>
            {l.id} · {l.district}
          </p>
          <span className="passport-course">
            {s.courses.find((c) => c.id === l.courseId)?.title}
          </span>
          <Status status={o?.status || "Ready for a first update"} />
          <div className="passport-barcode">
            |||| ||| |||||| || |||| ||| || |||||
          </div>
          <span>ONE PERSON. MANY POSSIBILITIES.</span>
        </div>
        <Spark className="learner-hero-spark" />
      </section>
      <div className="portal-grid">
        <section className="panel">
          <SectionTitle
            eyebrow="YOUR NEXT CHAPTER, SO FAR"
            title="A little progress, made visible"
            action={
              <button
                className="icon-button"
                aria-label="Open my full passport"
                onClick={() => open({ type: "passport", learnerId: l.id })}
              >
                <ArrowUpRight size={19} />
              </button>
            }
          />
          <div className="portal-status">
            <Status status={o?.status || "No update yet"} />
            <EvidenceTag label={evidenceLabel(s, o)} />
          </div>
          <div className="portal-income">
            <span>
              Latest reported monthly income
              <strong>
                {o && inWork(o.status) ? money(o.income) : "Not recorded"}
              </strong>
            </span>
            <span>
              Last check-in
              <strong>{o ? prettyDate(o.date) : "Let’s start today"}</strong>
            </span>
          </div>
          <h3 className="small-title">Strengths you’re taking forward</h3>
          <div className="skill-tags owned">
            {l.skills.map((skill) => (
              <span key={skill}>
                <Check size={12} />
                {skill}
              </span>
            ))}
          </div>
        </section>
        <section className="portal-next-step">
          <span className="eyebrow">ONE PRACTICAL NEXT STEP</span>
          <h2>
            {best?.missing.length ? (
              <>
                A little learning.
                <br />
                <em>A new possibility.</em>
              </>
            ) : (
              <>
                Look at those skills.
                <br />
                <em>You’re building something.</em>
              </>
            )}
          </h2>
          <p>
            {best
              ? `${best.title} is a ${best.match}% match with your recorded skills.`
              : "Your programme team can help you explore your next opportunity."}
          </p>
          <div className="skill-tags">
            {best?.missing.map((skill) => (
              <span key={skill}>+ {skill}</span>
            ))}
          </div>
          <button
            className="text-button"
            onClick={() => open({ type: "passport", learnerId: l.id })}
          >
            See your full journey <ArrowRight size={16} />
          </button>
        </section>
      </div>
      <section className="consent-card">
        <ShieldCheck size={29} />
        <div>
          <h3>Your story. Your choice.</h3>
          <p>
            Sharing updates is optional. Withdrawing removes personal outcome
            records and stops future follow-ups in this workspace.
          </p>
        </div>
        <button
          className="text-button danger"
          onClick={() => open({ type: "passport", learnerId: l.id })}
        >
          Manage consent <ArrowUpRight size={15} />
        </button>
      </section>
    </>
  );
}
