import { dayKey, shiftDay, type State } from "./model";
export function createSeed(today = dayKey(), empty = false): State {
  const courses = [
    {
      id: "solar",
      title: "Solar Installation",
      sector: "Green energy",
      skills: ["Electrical safety", "Panel installation", "Wiring"],
      color: "#fc9b70",
    },
    {
      id: "digital",
      title: "Digital Operations",
      sector: "Digital services",
      skills: ["Spreadsheets", "Data entry", "Customer support"],
      color: "#a99aff",
    },
    {
      id: "health",
      title: "Healthcare Assistance",
      sector: "Healthcare",
      skills: ["Patient care", "First aid", "Medical records"],
      color: "#6dd7bc",
    },
    {
      id: "cnc",
      title: "CNC Machining",
      sector: "Manufacturing",
      skills: ["Machine safety", "Technical drawing", "CNC operation"],
      color: "#83baff",
    },
  ];
  const employers = [
    { id: "grid", name: "NovaGrid Energy", color: "#fff0d9" },
    { id: "people", name: "PeopleWorks Digital", color: "#eee7ff" },
    { id: "care", name: "Aster Care Services", color: "#dff7ed" },
    { id: "precision", name: "PrecisionWorks", color: "#e3efff" },
  ];
  const districts = [
    "Pune",
    "Nagpur",
    "Nashik",
    "Mumbai",
    "Chhatrapati Sambhajinagar",
    "Kolhapur",
  ];
  const providers = [
    { id: "p1", name: "Horizon Skills Foundation" },
    { id: "p2", name: "Maharashtra Learning Collective" },
    { id: "p3", name: "NextStep Training Centre" },
  ];
  const state: State = {
    version: 1,
    revision: 0,
    learners: [],
    followups: [],
    evidence: [],
    courses,
    employers,
    providers,
    audit: [],
    jobs: courses.map((c, i) => ({
      id: `job-${i}`,
      title: [
        "Solar Service Technician",
        "Operations Associate",
        "Patient Care Assistant",
        "CNC Operator",
      ][i],
      employerId: employers[i].id,
      district: districts[i],
      skills: [
        ...c.skills,
        [
          "Inverter diagnostics",
          "Business communication",
          "Infection control",
          "G-code programming",
        ][i],
      ],
      minPay: [18000, 16000, 17000, 19000][i],
      maxPay: [26000, 22000, 24000, 28000][i],
    })),
  };
  if (empty) return state;
  const first = [
    "Aarohi",
    "Rohan",
    "Sana",
    "Aditya",
    "Meera",
    "Kabir",
    "Isha",
    "Omkar",
    "Fatima",
    "Vedant",
    "Priya",
    "Arjun",
    "Neha",
    "Sahil",
    "Ananya",
    "Yash",
    "Zoya",
    "Nikhil",
    "Riya",
    "Tejas",
    "Aditi",
    "Harsh",
    "Sakshi",
    "Dev",
  ];
  const last = [
    "Patil",
    "Shaikh",
    "Deshmukh",
    "Jadhav",
    "Kulkarni",
    "More",
    "Shinde",
    "Pawar",
  ];
  for (let i = 0; i < 48; i++) {
    const c = courses[i % 4];
    const employer = employers[i % 4];
    const trainedOn = shiftDay(today, -(220 - i * 2));
    const id = `UA-${String(1001 + i)}`;
    const status = (
      [
        "Employed",
        "Employed",
        "Employed",
        "Self-employed",
        "Apprenticeship",
        "Seeking work",
        "Left job",
        "Seeking work",
        "Further study",
        "Employed",
      ] as const
    )[i % 10];
    const hasOutcome = i % 10 !== 9;
    const latestDate = shiftDay(today, -[7, 14, 21, 45, 105, 12][i % 6]);
    const l: State["learners"][number] = {
      id,
      name: `${first[i % first.length]} ${last[(i + Math.floor(i / first.length)) % last.length]}`,
      email: `learner${i + 1}@example.test`,
      district: districts[i % 6],
      courseId: c.id,
      providerId: providers[i % 3].id,
      gender: i % 2 ? "Man" : "Woman",
      trainedOn,
      baselineIncome:
        i % 5 === 0 ? null : i % 3 === 0 ? 0 : 6500 + (i % 4) * 1000,
      consent: true,
      skills: i % 3 === 0 ? c.skills.slice(0, 2) : [...c.skills],
      color: ["#eee7ff", "#ffe5d8", "#d9f5ea", "#e1ecff", "#f8e1ed", "#eff4c9"][
        i % 6
      ],
      outcomes: [],
    };
    if (hasOutcome) {
      if (i % 4 === 0)
        l.outcomes.push({
          id: `out-${i}-old`,
          date: shiftDay(trainedOn, 35),
          status: i % 8 === 0 ? "Employed" : "Seeking work",
          income: i % 8 === 0 ? 12000 : 0,
          employerId: i % 8 === 0 ? employer.id : "",
          role: i % 8 === 0 ? state.jobs[i % 4].title : "",
          note: "First post-training check-in.",
          skillsNeeded: [],
          source: "Learner",
        });
      l.outcomes.push({
        id: `out-${i}`,
        date: latestDate,
        status,
        income: ["Employed", "Self-employed", "Apprenticeship"].includes(status)
          ? 14000 + (i % 8) * 1500
          : 0,
        employerId: ["Employed", "Apprenticeship", "Left job"].includes(status)
          ? employer.id
          : "",
        role: ["Employed", "Apprenticeship", "Left job"].includes(status)
          ? state.jobs[i % 4].title
          : status === "Self-employed"
            ? "Independent service provider"
            : "",
        note:
          status === "Left job"
            ? "Contract ended. Interested in support to find the next role."
            : status === "Seeking work"
              ? "Looking for a role closer to home."
              : "Latest follow-up recorded with learner consent.",
        skillsNeeded: i % 3 === 0 ? [state.jobs[i % 4].skills.at(-1)!] : [],
        source: "Learner",
      });
    }
    state.learners.push(l);
    for (const n of [30, 90, 180, 365] as const) {
      const due = shiftDay(trainedOn, n);
      const completed = hasOutcome && due <= latestDate;
      state.followups.push({
        id: `fu-${i}-${n}`,
        learnerId: id,
        due,
        milestone: `${n}-day`,
        completed,
        note: completed ? "Outcome check-in completed." : "",
      });
    }
    if (
      hasOutcome &&
      i % 3 !== 0 &&
      ["Employed", "Apprenticeship"].includes(status)
    )
      state.evidence.push({
        id: `ev-${i}`,
        learnerId: id,
        outcomeId: `out-${i}`,
        verdict: i % 13 === 0 ? "Mismatch" : "Confirmed",
        note:
          i % 13 === 0
            ? "Reported employment dates need clarification."
            : "Role and monthly pay confirmed by the linked employer.",
        at: new Date(`${latestDate}T13:00:00Z`).toISOString(),
        actor: `employer-${employer.id}`,
        source: "Employer",
      });
  }
  state.audit = [
    {
      id: "welcome",
      at: new Date(`${today}T09:00:00Z`).toISOString(),
      actor: "Demo workspace",
      action: "Fictional sample cohort loaded",
      learnerId: "",
    },
  ];
  return state;
}
