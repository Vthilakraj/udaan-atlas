import { useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Plus,
  ShieldCheck,
  Download,
  Upload,
  RotateCcw,
  CalendarDays,
  BadgeCheck,
  BriefcaseBusiness,
  LockKeyhole,
  Trash2,
  BookOpen,
  Layers3,
  Sparkles,
  MessagesSquare,
  HeartHandshake,
  UsersRound,
  Link2,
} from "lucide-react";
import { type Dialog, useAtlas } from "./context";
import {
  Avatar,
  Badge,
  Status,
  EvidenceTag,
  Modal,
  Empty,
  SectionTitle,
  money,
  prettyDate,
} from "./ui";
import { API_MODE, download, exportCsv } from "./store";
import {
  dayKey,
  shiftDay,
  latestOutcome,
  evidenceLabel,
  metrics,
  priority,
  skillMatches,
  inWork,
  statuses,
  type Learner,
  type Outcome,
} from "../shared/model";
const splitSkills = (value: string) => [
  ...new Set(
    value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  ),
];
const text = (form: FormData, name: string) =>
  String(form.get(name) || "").trim();
export function Dialogs({
  dialog,
  close,
}: {
  dialog: NonNullable<Dialog>;
  close: () => void;
}) {
  const { ws } = useAtlas();
  if (dialog.type === "opportunity") return <Opportunity close={close} />;
  if (dialog.type === "enroll") return <Enroll close={close} />;
  if (dialog.type === "settings") return <Settings close={close} />;
  if (dialog.type === "guide") return <Guide close={close} />;
  if (dialog.type === "report") return <Report close={close} />;
  if (!("learnerId" in dialog)) return null;
  const l = ws.state.learners.find((l) => l.id === dialog.learnerId);
  if (!l)
    return (
      <Modal title="Journey unavailable" close={close}>
        <Empty
          title="This passport isn’t in your view"
          detail="It may have been removed or be outside your account’s permissions."
        />
      </Modal>
    );
  if (dialog.type === "passport") return <Passport l={l} close={close} />;
  if (dialog.type === "outcome")
    return <OutcomeForm l={l} followupId={dialog.followupId} close={close} />;
  if (dialog.type === "schedule") return <Schedule l={l} close={close} />;
  if (dialog.type === "verify") {
    const o = l.outcomes.find((o) => o.id === dialog.outcomeId);
    return o ? <Verify l={l} o={o} close={close} /> : null;
  }
  return null;
}
function Enroll({ close }: { close: () => void }) {
  const { ws, act } = useAtlas();
  const [course, setCourse] = useState(ws.state.courses[0]?.id || "");
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const ok = await act(
      {
        type: "addLearner",
        learner: {
          name: text(f, "name"),
          email: text(f, "email"),
          district: text(f, "district"),
          courseId: course,
          providerId: text(f, "provider"),
          gender: text(f, "gender") as Learner["gender"],
          trainedOn: text(f, "trainedOn"),
          baselineIncome:
            text(f, "baseline") === "" ? null : Number(text(f, "baseline")),
          consent: f.get("consent") === "on",
          skills: splitSkills(text(f, "skills")),
        },
      },
      "A new journey, with consent. Four follow-up milestones are ready.",
    );
    if (ok) close();
  };
  return (
    <Modal title="A new journey starts here." wide close={close}>
      <p className="modal-intro">
        Create one outcome passport. Keep following the person beyond the
        certificate.
      </p>
      <form className="atlas-form" onSubmit={submit}>
        <div className="form-grid">
          <label>
            Full name
            <input
              name="name"
              required
              maxLength={100}
              placeholder="e.g. Kavya Patil"
            />
          </label>
          <label>
            Email address
            <input
              name="email"
              type="email"
              required
              placeholder="learner@example.test"
            />
          </label>
          <label>
            District
            <input
              aria-label="District"
              name="district"
              required
              maxLength={100}
              list="districts"
              placeholder="e.g. Pune"
            />
            <datalist id="districts">
              {[
                "Pune",
                "Nagpur",
                "Nashik",
                "Mumbai",
                "Chhatrapati Sambhajinagar",
                "Kolhapur",
              ].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </datalist>
          </label>
          <label>
            Gender
            <select name="gender">
              <option>Prefer not to say</option>
              <option>Woman</option>
              <option>Man</option>
              <option>Non-binary</option>
            </select>
          </label>
          <label>
            Completed course
            <select
              name="course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            >
              {ws.state.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Training provider
            <select name="provider">
              {ws.state.providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Training completion date
            <input
              name="trainedOn"
              type="date"
              required
              max={dayKey()}
              defaultValue={shiftDay(dayKey(), -30)}
            />
          </label>
          <label>
            Monthly income before training (₹)
            <input
              name="baseline"
              type="number"
              min="0"
              max="1000000"
              placeholder="Leave blank if unknown"
            />
          </label>
        </div>
        <label key={course}>
          Skills gained <small>Separate skills with commas.</small>
          <input
            name="skills"
            maxLength={2000}
            defaultValue={ws.state.courses
              .find((c) => c.id === course)
              ?.skills.join(", ")}
          />
        </label>
        <label className="consent-check">
          <input type="checkbox" name="consent" required />
          <span>
            <strong>The learner has agreed to outcome tracking.</strong>They
            understand the purpose, optional follow-ups, data use, and how to
            withdraw. Do not add real data to the public demo.
          </span>
        </label>
        <FormFooter
          close={close}
          busy={ws.busy}
          label="Create outcome passport"
        />
      </form>
    </Modal>
  );
}
function OutcomeForm({
  l,
  followupId,
  close,
}: {
  l: Learner;
  followupId?: string;
  close: () => void;
}) {
  const { ws, act } = useAtlas();
  const current = latestOutcome(l);
  const [status, setStatus] = useState<Outcome["status"]>(
    current?.status || "Seeking work",
  );
  const employerNeeded = status === "Employed" || status === "Apprenticeship";
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const ok = await act(
      {
        type: "recordOutcome",
        learnerId: l.id,
        followupId,
        outcome: {
          date: text(f, "date"),
          status,
          income: inWork(status) ? Number(text(f, "income")) : 0,
          employerId: employerNeeded ? text(f, "employer") : "",
          role: inWork(status) ? text(f, "role") : "",
          note: text(f, "note"),
          skillsNeeded: splitSkills(text(f, "missing")),
        },
      },
      followupId
        ? "Check-in recorded. The milestone is complete."
        : "A new chapter recorded. Employer evidence starts fresh for this update.",
    );
    if (ok) close();
  };
  return (
    <Modal title="How’s the next chapter going?" wide close={close}>
      <div className="form-person">
        <Avatar name={l.name} color={l.color} />
        <div>
          <strong>{l.name}</strong>
          <span>
            {l.id} · {l.district}
          </span>
        </div>
        <Badge tone="violet">
          {ws.actor.role === "learner" ? "Your update" : "Assisted check-in"}
        </Badge>
      </div>
      <form className="atlas-form" onSubmit={submit}>
        <div className="form-grid">
          <label>
            Current situation
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Outcome["status"])}
            >
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Outcome date
            <input
              type="date"
              name="date"
              required
              min={l.trainedOn}
              max={dayKey()}
              defaultValue={dayKey()}
            />
          </label>
          {inWork(status) && (
            <>
              <label>
                Monthly income (₹)
                <input
                  name="income"
                  required
                  type="number"
                  min="0"
                  max="1000000"
                  defaultValue={current?.income || ""}
                  placeholder="0 if not yet paid"
                />
              </label>
              <label>
                Role or livelihood
                <input
                  name="role"
                  required
                  maxLength={160}
                  placeholder={
                    status === "Self-employed"
                      ? "e.g. Independent solar installer"
                      : "e.g. Solar Service Technician"
                  }
                  defaultValue={current?.role}
                />
              </label>
            </>
          )}
          {employerNeeded && (
            <label className="full-field">
              Linked employer
              <select
                name="employer"
                defaultValue={current?.employerId || ""}
                required
              >
                <option value="" disabled>
                  Choose the employer
                </option>
                {ws.state.employers.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <label>
          Skills or support still needed
          <small>
            Separate skills with commas. Leave blank when there’s no reported
            gap.
          </small>
          <input
            name="missing"
            maxLength={2000}
            placeholder="e.g. Inverter diagnostics, Business communication"
          />
        </label>
        <label>
          What would you like the team to know?
          <textarea
            name="note"
            maxLength={2000}
            rows={3}
            placeholder="A small win, a challenge, or a next step…"
          />
        </label>
        <div className="form-note">
          <ShieldCheck size={16} />
          <p>
            This update is self-reported. It does not become employer-confirmed
            until a bound employer account reviews this specific outcome.
          </p>
        </div>
        <FormFooter
          close={close}
          busy={ws.busy}
          label={followupId ? "Save check-in" : "Save this chapter"}
        />
      </form>
    </Modal>
  );
}
function Schedule({ l, close }: { l: Learner; close: () => void }) {
  const { ws, act } = useAtlas();
  return (
    <Modal title="Plan one helpful next step." close={close}>
      <div className="form-person">
        <Avatar name={l.name} color={l.color} />
        <div>
          <strong>{l.name}</strong>
          <span>Support, at the right moment.</span>
        </div>
      </div>
      <form
        className="atlas-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          if (
            await act(
              {
                type: "schedule",
                learnerId: l.id,
                due: text(f, "due"),
                note: text(f, "note"),
              },
              "Support check-in added to the studio.",
            )
          )
            close();
        }}
      >
        <label>
          When should the team check in?
          <input
            type="date"
            name="due"
            min={dayKey()}
            required
            defaultValue={shiftDay(dayKey(), 7)}
          />
        </label>
        <label>
          What would help?
          <textarea
            name="note"
            required
            maxLength={2000}
            rows={4}
            placeholder="e.g. Discuss a short course in inverter diagnostics and nearby opportunities."
          />
        </label>
        <div className="form-note">
          <CalendarDays size={17} />
          <p>
            This schedules a task in the studio. No message or external calendar
            invitation is sent.
          </p>
        </div>
        <FormFooter close={close} busy={ws.busy} label="Schedule support" />
      </form>
    </Modal>
  );
}
function Verify({
  l,
  o,
  close,
}: {
  l: Learner;
  o: Outcome;
  close: () => void;
}) {
  const { ws, act } = useAtlas();
  const employer = ws.state.employers.find((e) => e.id === o.employerId);
  const isEmployer = ws.actor.role === "employer";
  const history = ws.state.evidence.filter((e) => e.outcomeId === o.id);
  return (
    <Modal
      title={
        isEmployer
          ? "Give the story stronger evidence."
          : "Review the evidence, clearly."
      }
      wide
      close={close}
    >
      <div className="verification-claim">
        <div className="form-person">
          <Avatar name={l.name} color={l.color} />
          <div>
            <strong>{l.name}</strong>
            <span>
              {o.role} · {employer?.name}
            </span>
          </div>
          <EvidenceTag label={evidenceLabel(ws.state, o)} />
        </div>
        <div className="claim-facts">
          <span>
            Reported status<strong>{o.status}</strong>
          </span>
          <span>
            Monthly income<strong>{money(o.income)}</strong>
          </span>
          <span>
            Outcome date<strong>{prettyDate(o.date)}</strong>
          </span>
        </div>
        <p>{o.note}</p>
      </div>
      {history.length > 0 && (
        <div className="evidence-history">
          {history.map((e) => (
            <div key={e.id}>
              <Badge tone={e.verdict === "Confirmed" ? "green" : "coral"}>
                {e.verdict}
              </Badge>
              <span>
                <strong>{e.source}</strong>
                <p>{e.note}</p>
                <small>{new Date(e.at).toLocaleString("en-IN")}</small>
              </span>
            </div>
          ))}
        </div>
      )}
      <form
        className="atlas-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          if (
            await act(
              {
                type: "verify",
                learnerId: l.id,
                outcomeId: o.id,
                verdict: text(f, "verdict") as "Confirmed" | "Mismatch",
                note: text(f, "note"),
              },
              isEmployer
                ? "Employer evidence recorded for this outcome."
                : "Programme review saved. This remains distinct from employer confirmation.",
            )
          )
            close();
        }}
      >
        <div className="form-note">
          <BadgeCheck size={19} />
          <p>
            {isEmployer
              ? "You are reviewing as the linked employer. Confirm only what you can substantiate."
              : "You are reviewing as programme staff. This action records a team review, not an employer confirmation."}
          </p>
        </div>
        <label>
          What does the available evidence show?
          <select name="verdict">
            <option value="Confirmed">
              Details match the available evidence
            </option>
            <option value="Mismatch">
              Details differ or need clarification
            </option>
          </select>
        </label>
        <label>
          Evidence note
          <textarea
            name="note"
            required
            minLength={5}
            maxLength={2000}
            rows={3}
            placeholder="What was checked, how, and what needs clarification? Avoid sensitive document numbers."
          />
        </label>
        <FormFooter
          close={close}
          busy={ws.busy}
          label={
            isEmployer ? "Record employer verification" : "Record team review"
          }
        />
      </form>
    </Modal>
  );
}
function Passport({ l, close }: { l: Learner; close: () => void }) {
  const { ws, open, act } = useAtlas();
  const s = ws.state;
  const o = latestOutcome(l);
  const course = s.courses.find((c) => c.id === l.courseId);
  const p = priority(s, l);
  const match = skillMatches(s, l)[0];
  return (
    <Modal title="An outcome passport." wide close={close}>
      <div className="passport-header" style={{ background: l.color }}>
        <Avatar name={l.name} color="#ffffff90" large />
        <div>
          <span className="eyebrow">{l.id} / ONE CONTINUOUS JOURNEY</span>
          <h3>{l.name}</h3>
          <p>
            {l.district} · {course?.title}
          </p>
        </div>
        {l.consent ? (
          <Badge tone="green">
            <ShieldCheck size={12} />
            Consent active
          </Badge>
        ) : (
          <Badge tone="gray">Tracking stopped</Badge>
        )}
      </div>
      <div className="passport-metrics">
        <div>
          <small>LATEST CHAPTER</small>
          <Status status={o?.status || "No outcome yet"} />
        </div>
        <div>
          <small>MONTHLY INCOME</small>
          <strong>{o && inWork(o.status) ? money(o.income) : "—"}</strong>
        </div>
        <div>
          <small>EVIDENCE</small>
          <EvidenceTag label={evidenceLabel(s, o)} />
        </div>
      </div>
      <div className="passport-body">
        <section>
          <h3 className="small-title">THE STORY SO FAR</h3>
          <div className="timeline">
            <div>
              <span className="timeline-dot">
                <BookOpen size={15} />
              </span>
              <small>{prettyDate(l.trainedOn)}</small>
              <h4>Training became a starting point.</h4>
              <p>
                {course?.title} ·{" "}
                {s.providers.find((p) => p.id === l.providerId)?.name}
              </p>
            </div>
            {l.outcomes.map((item) => (
              <div key={item.id}>
                <span className="timeline-dot">
                  <BriefcaseBusiness size={15} />
                </span>
                <small>
                  {prettyDate(item.date)} · {item.source}
                </small>
                <h4>
                  {item.status}
                  {inWork(item.status) ? ` · ${money(item.income)}/month` : ""}
                </h4>
                <p>
                  {item.role}
                  {item.role && item.note ? " · " : ""}
                  {item.note}
                </p>
                <EvidenceTag label={evidenceLabel(s, item)} />
              </div>
            ))}
            {!l.outcomes.length && (
              <div>
                <span className="timeline-dot">
                  <MessagesSquare size={15} />
                </span>
                <h4>A new chapter is waiting.</h4>
                <p>
                  A first check-in will help the team understand what comes
                  next.
                </p>
              </div>
            )}
          </div>
        </section>
        <aside>
          <div className="passport-support">
            <span className="eyebrow">EXPLAINABLE SUPPORT PRIORITY</span>
            <strong>
              {p.score}
              <small>/100</small>
            </strong>
            <Badge tone={p.score >= 65 ? "coral" : "violet"}>{p.label}</Badge>
            <ul>
              {p.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <small>
              A rules-based support prompt. No demographic features or automated
              adverse decisions.
            </small>
          </div>
          <h3 className="small-title">STRENGTHS TO BUILD ON</h3>
          <div className="skill-tags">
            {l.skills.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
          {match && (
            <div className="passport-bridge">
              <span className="eyebrow">A POSSIBLE BRIDGE</span>
              <h4>{match.title}</h4>
              <p>{match.match}% of listed skills match.</p>
              {match.missing.map((skill) => (
                <span key={skill}>+ {skill}</span>
              ))}
            </div>
          )}
        </aside>
      </div>
      {l.consent && (
        <div className="passport-actions">
          {ws.actor.role !== "employer" && (
            <button
              className="button purple"
              onClick={() => open({ type: "outcome", learnerId: l.id })}
            >
              <Plus size={15} />
              Record an update
            </button>
          )}
          {ws.actor.role === "admin" && (
            <button
              className="button light"
              onClick={() => open({ type: "schedule", learnerId: l.id })}
            >
              <CalendarDays size={15} />
              Plan support
            </button>
          )}
          {ws.actor.role !== "employer" && (
            <button
              className="text-button danger"
              onClick={async () => {
                if (
                  window.confirm(
                    "Withdraw consent and remove this learner’s name, email, skills, income history, evidence, and follow-ups from this workspace? This cannot be undone.",
                  )
                ) {
                  if (
                    await act(
                      { type: "withdraw", learnerId: l.id },
                      "Consent withdrawn. Personal outcome records and follow-ups were removed.",
                    )
                  )
                    close();
                }
              }}
            >
              Withdraw consent
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}
function Report({ close }: { close: () => void }) {
  const { ws, learners, district, course } = useAtlas();
  const m = metrics(ws.state, learners);
  const gender = ["Woman", "Man", "Non-binary", "Prefer not to say"]
    .map((g) => ({
      name: g,
      ...metrics(
        ws.state,
        learners.filter((l) => l.gender === g),
      ),
    }))
    .filter((g) => g.total);
  return (
    <Modal title="A picture of progress. With context." wide close={close}>
      <p className="modal-intro">
        {district} ·{" "}
        {course === "All courses"
          ? "All courses"
          : ws.state.courses.find((c) => c.id === course)?.title}{" "}
        · {prettyDate(dayKey())}
      </p>
      <div className="report-stats">
        <div>
          <span>IN WORK</span>
          <strong>
            {m.working}/{m.total}
          </strong>
          <small>{m.placementRate}% of consenting learners</small>
        </div>
        <div>
          <span>RECENT OUTCOME COVERAGE</span>
          <strong>{m.coverage}%</strong>
          <small>Updates within the last 90 days</small>
        </div>
        <div>
          <span>MEDIAN INCOME GAIN</span>
          <strong>{m.gainCount ? money(m.incomeGain) : "—"}</strong>
          <small>{m.gainCount} paired baseline/current incomes</small>
        </div>
        <div>
          <span>90-DAY WORK CONTINUITY</span>
          <strong>{m.continuityEligible ? `${m.continuityRate}%` : "—"}</strong>
          <small>
            {m.continuityWorking}/{m.continuityEligible} with a work report ≥90
            days ago are still in work
          </small>
        </div>
      </div>
      <div className="report-definitions">
        <h3>Numbers deserve clear definitions.</h3>
        <p>
          <strong>In work</strong> includes employment, self-employment, and
          apprenticeship from the latest available outcome. Missing updates are
          shown separately; they are not assumed to mean unemployment.
        </p>
        <p>
          <strong>Employer-confirmed</strong> means a linked employer reviewed
          the exact latest work outcome. Team reviews and historical
          confirmations do not count as independent employer confirmation.
        </p>
        <p>
          <strong>Income gain</strong> is the median difference between a known
          baseline and reported positive current monthly income for people in
          work. It describes this group; it does not prove that the programme
          caused the change.
        </p>
        <p>
          <strong>Work continuity</strong> shows whether learners with a
          recorded work outcome at least 90 days ago are in work in their latest
          update. It does not claim continuous employment or retention at the
          same employer.
        </p>
        <p>
          <strong>Support priority</strong> uses overdue milestones, stale or
          missing updates, leaving work, reported skill gaps, and conflicting
          evidence. It does not use gender, district, income, or protected
          attributes.
        </p>
      </div>
      <h3 className="small-title">TRAINING PROVIDER VIEW</h3>
      <div className="demographic-table">
        {ws.state.providers.map((provider) => {
          const p = metrics(
            ws.state,
            learners.filter((l) => l.providerId === provider.id),
          );
          return (
            <div key={provider.id}>
              <span>{provider.name}</span>
              <strong>{p.total} learners</strong>
              <span>{p.working} in work</span>
            </div>
          );
        })}
      </div>
      <h3 className="small-title">TRAINING COHORT VIEW</h3>
      <div className="demographic-table">
        {[
          ...new Set(
            learners
              .filter((l) => l.consent)
              .map((l) => l.trainedOn.slice(0, 7)),
          ),
        ]
          .sort()
          .map((month) => {
            const c = metrics(
              ws.state,
              learners.filter((l) => l.trainedOn.startsWith(month)),
            );
            return (
              <div key={month}>
                <span>{month}</span>
                <strong>{c.total} learners</strong>
                <span>{c.working} in work</span>
              </div>
            );
          })}
      </div>
      <h3 className="small-title">DEMOGRAPHIC VIEW · DESCRIPTIVE COUNTS</h3>
      <div className="demographic-table">
        {gender.map((g) => (
          <div key={g.name}>
            <span>{g.name}</span>
            <strong>{g.total} learners</strong>
            <span>{g.working} in work</span>
          </div>
        ))}
      </div>
      <div className="form-note">
        <ShieldCheck size={17} />
        <p>
          Small group counts may identify people. Share aggregate reports only
          with authorized recipients. The public demo contains fictional data.
        </p>
      </div>
      <div className="form-actions">
        <button
          className="button purple"
          onClick={() =>
            download(
              `udaan-impact-${dayKey()}.csv`,
              exportCsv({ ...ws.state, learners }),
              "text/csv;charset=utf-8",
            )
          }
        >
          <Download size={16} />
          Download this view
        </button>
      </div>
    </Modal>
  );
}
function Guide({ close }: { close: () => void }) {
  const { ws, go } = useAtlas();
  return (
    <Modal title="Follow the future, not just the form." wide close={close}>
      <div className="guide-hero">
        <span>✳</span>
        <h3>
          One person.
          <br />
          Many possibilities.
          <br />
          <em>One connected story.</em>
        </h3>
      </div>
      <div className="guide-grid">
        {[
          {
            n: "01",
            icon: UsersRound,
            title: "Create a passport",
            text: "Enroll with consent. Connect training, learner updates, evidence, and support in one journey.",
          },
          {
            n: "02",
            icon: MessagesSquare,
            title: "Stay close, over time",
            text: "Work through 30-, 90-, 180-, and 365-day follow-ups. Copy optional check-ins or record an assisted conversation.",
          },
          {
            n: "03",
            icon: BadgeCheck,
            title: "Make evidence visible",
            text: "Switch demo roles to try employer confirmation. Programme reviews stay distinct. New claims need new evidence.",
          },
          {
            n: "04",
            icon: HeartHandshake,
            title: "Bridge a practical gap",
            text: "Compare learner skills with listed roles, see missing requirements, and schedule a human support step.",
          },
        ].map((item) => (
          <div key={item.n}>
            <item.icon size={23} />
            <span>{item.n}</span>
            <h4>{item.title}</h4>
            <p>{item.text}</p>
          </div>
        ))}
      </div>
      <div className="form-note">
        <ShieldCheck size={19} />
        <p>
          {API_MODE
            ? "You are connected to a private server. Accounts are bound to roles; employer and learner data is scoped on the server."
            : "This public demo runs in your browser with fictional records. Role switching is a demonstration, not authentication. For real use, run the included private backend with server-enforced accounts."}{" "}
          No government employment databases, external messages, or live job
          feeds are connected.
        </p>
      </div>
      <button
        className="button purple full"
        onClick={() => {
          go(
            ws.actor.role === "admin"
              ? "learners"
              : ws.actor.role === "employer"
                ? "evidence"
                : "portal",
          );
          close();
        }}
      >
        Explore a journey <ArrowUpRight size={17} />
      </button>
    </Modal>
  );
}
function Settings({ close }: { close: () => void }) {
  const { ws, notify, act } = useAtlas();
  const file = useRef<HTMLInputElement>(null);
  const [role, setRole] = useState("learner");
  const [busy, setBusy] = useState(false);
  return (
    <Modal title="Your workspace, thoughtfully kept." wide close={close}>
      <div className="settings-section">
        <span className="eyebrow">
          {API_MODE ? "PRIVATE SERVER WORKSPACE" : "BROWSER DEMO WORKSPACE"}
        </span>
        <h3>
          {API_MODE
            ? "Connected, with account-based access."
            : "A safe place to explore."}
        </h3>
        <p>
          {API_MODE
            ? "Data lives in your server’s SQLite database. Sessions are private to the signed-in account, and role permissions are enforced by the server."
            : "Fictional records and your edits are stored only in this browser. Clearing site data removes them. Use a private backend deployment before collecting real personal information."}
        </p>
        <div className="settings-actions">
          <button
            className="button purple"
            onClick={() =>
              download(
                `udaan-backup-${dayKey()}.json`,
                JSON.stringify(API_MODE ? ws.state : ws.rawState, null, 2),
              )
            }
          >
            <Download size={16} />
            Export workspace
          </button>
          {!API_MODE && ws.actor.role === "admin" && (
            <>
              <button
                className="button light"
                disabled={busy}
                onClick={() => file.current?.click()}
              >
                <Upload size={16} />
                Restore backup
              </button>
              <input
                type="file"
                ref={file}
                className="sr-only"
                aria-label="Restore workspace backup"
                accept="application/json,.json"
                onChange={async (e) => {
                  const selected = e.target.files?.[0];
                  if (!selected) return;
                  setBusy(true);
                  try {
                    if (selected.size > 15000000)
                      throw new Error("Choose a backup smaller than 15 MB.");
                    const raw = await selected.text();
                    if (
                      window.confirm(
                        "Replace the current demo workspace with this backup? Export your current data first if you need a copy.",
                      )
                    ) {
                      ws.restore(raw);
                      notify("Demo workspace restored.");
                    }
                  } catch (error) {
                    notify(
                      error instanceof Error
                        ? error.message
                        : "Backup could not be restored.",
                    );
                  } finally {
                    setBusy(false);
                    if (file.current) file.current.value = "";
                  }
                }}
              />
            </>
          )}
        </div>
        <small>
          Exports may contain personal information in private mode. Store and
          share them carefully.
        </small>
      </div>
      {!API_MODE && ws.actor.role === "admin" && (
        <div className="settings-section">
          <h3>Begin again with the sample cohort.</h3>
          <p>
            Reset all browser-demo edits and load a fresh fictional sample. This
            cannot be undone unless you kept a backup.
          </p>
          <button
            className="text-button danger"
            onClick={() => {
              if (
                window.confirm(
                  "Replace all demo edits with a fresh sample cohort?",
                )
              ) {
                ws.reset();
                notify("A fresh sample cohort is ready.");
                close();
              }
            }}
          >
            <RotateCcw size={16} />
            Reset the demo
          </button>
        </div>
      )}
      {ws.actor.role === "admin" && (
        <div className="settings-section">
          <h3>Connect an employer organization.</h3>
          <p>
            Add the organization before binding an employer account or recording
            a placement. An account confirmation is evidence from that account,
            not a government verification.
          </p>
          <form
            className="atlas-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const f = new FormData(form);
              if (
                await act(
                  { type: "addEmployer", name: text(f, "organization") },
                  "Employer organization added.",
                )
              )
                form.reset();
            }}
          >
            <label>
              Organization name
              <input
                name="organization"
                required
                maxLength={160}
                placeholder="e.g. Sahyadri Solar Services"
              />
            </label>
            <button className="button light" disabled={ws.busy}>
              <Plus size={15} />
              Add organization
            </button>
          </form>
        </div>
      )}
      {API_MODE && ws.actor.role === "admin" && (
        <div className="settings-section">
          <h3>Invite someone into the journey.</h3>
          <p>
            Create a private account and give the password to its owner through
            a secure channel. Learner and employer accounts must be bound to an
            existing record.
          </p>
          <form
            className="atlas-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const f = new FormData(form);
              setBusy(true);
              try {
                await ws.createAccount({
                  name: text(f, "accountName"),
                  email: text(f, "accountEmail"),
                  password: text(f, "accountPassword"),
                  role,
                  binding: text(f, "binding"),
                });
                notify("Account created. Share access details securely.");
                form.reset();
              } catch (error) {
                notify((error as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="form-grid">
              <label>
                Name
                <input name="accountName" required maxLength={100} />
              </label>
              <label>
                Email
                <input name="accountEmail" type="email" required />
              </label>
              <label>
                Role
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="learner">Learner</option>
                  <option value="employer">Employer</option>
                  <option value="admin">Programme team</option>
                </select>
              </label>
              <label>
                Temporary password
                <input
                  name="accountPassword"
                  required
                  type="password"
                  minLength={12}
                  maxLength={200}
                  autoComplete="new-password"
                />
              </label>
              {role !== "admin" && (
                <label className="full-field">
                  Bind to {role}
                  <select name="binding" required>
                    {(role === "learner"
                      ? ws.state.learners
                          .filter((l) => l.consent)
                          .map((l) => ({ id: l.id, name: l.name }))
                      : ws.state.employers
                    ).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · {item.id}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <button className="button purple" disabled={busy}>
              <Plus size={15} />
              Create account
            </button>
          </form>
        </div>
      )}
      <div className="settings-section">
        <h3>Built for clarity, from the start.</h3>
        <p>
          Udaan Atlas is an independent prototype for SIH26135. It is not an
          official government service. The repository includes the frontend,
          private backend, tests, and deployment instructions.
        </p>
        <a
          className="text-button"
          href="https://github.com/Vthilakraj/udaan-atlas"
          target="_blank"
          rel="noreferrer"
        >
          View the source project <ArrowUpRight size={15} />
        </a>
      </div>
    </Modal>
  );
}
function FormFooter({
  close,
  busy,
  label,
}: {
  close: () => void;
  busy: boolean;
  label: string;
}) {
  return (
    <div className="form-actions">
      <button type="button" className="button light" onClick={close}>
        Cancel
      </button>
      <button type="submit" className="button purple" disabled={busy}>
        {busy ? "Saving…" : label}
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

function Opportunity({ close }: { close: () => void }) {
  const { ws, act } = useAtlas();
  return (
    <Modal title="Open a practical new door." wide close={close}>
      <p className="modal-intro">
        Add a role and its actual skill requirements. Matches are transparent
        checklist comparisons.
      </p>
      <form
        className="atlas-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          if (
            await act(
              {
                type: "addJob",
                job: {
                  title: text(f, "title"),
                  employerId:
                    ws.actor.role === "employer"
                      ? ws.actor.employerId!
                      : text(f, "employer"),
                  district: text(f, "district"),
                  skills: splitSkills(text(f, "skills")),
                  minPay: Number(text(f, "minPay")),
                  maxPay: Number(text(f, "maxPay")),
                },
              },
              "Opportunity added. Skill matches have been updated.",
            )
          )
            close();
        }}
      >
        <div className="form-grid">
          <label>
            Role title
            <input name="title" required maxLength={160} />
          </label>
          <label>
            District
            <input
              aria-label="District"
              name="district"
              required
              maxLength={160}
            />
          </label>
          {ws.actor.role === "admin" && (
            <label className="full-field">
              Employer
              <select name="employer" required>
                {ws.state.employers.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Minimum monthly pay (₹)
            <input name="minPay" type="number" required min="0" max="1000000" />
          </label>
          <label>
            Maximum monthly pay (₹)
            <input name="maxPay" type="number" required min="0" max="1000000" />
          </label>
        </div>
        <label>
          Required skills
          <small>
            Use comma-separated skill names. Matching ignores letter case.
          </small>
          <input
            name="skills"
            required
            maxLength={2000}
            placeholder="Electrical safety, Wiring, Inverter diagnostics"
          />
        </label>
        <FormFooter close={close} busy={ws.busy} label="Add opportunity" />
      </form>
    </Modal>
  );
}
