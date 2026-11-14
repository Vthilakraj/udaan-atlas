import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  latestOutcome,
  inWork,
  type State,
  type Learner,
} from "../shared/model";
export const chartColors = [
  "#7749e9",
  "#a6d941",
  "#ff9978",
  "#5b9cf5",
  "#f8c752",
  "#e695ce",
  "#d8d7e8",
];
export function CourseChart({
  state,
  learners,
}: {
  state: State;
  learners: Learner[];
}) {
  const data = state.courses.map((c) => ({
    name: c.title.split(" ")[0],
    full: c.title,
    learners: learners.filter((l) => l.consent && l.courseId === c.id).length,
    working: learners.filter(
      (l) =>
        l.consent && l.courseId === c.id && inWork(latestOutcome(l)?.status),
    ).length,
  }));
  return (
    <div
      className="chart course-chart"
      role="img"
      aria-label={data
        .map((d) => `${d.full}: ${d.learners} trained, ${d.working} in work`)
        .join("; ")}
    >
      <ResponsiveContainer width="100%" height={245}>
        <BarChart
          data={data}
          barGap={7}
          margin={{ top: 20, right: 2, left: -28, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="#efedf5" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#90899f" }}
            dy={8}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#aba5b7" }}
          />
          <Tooltip
            cursor={{ fill: "#f5f2ff" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #eee8fa",
              fontSize: 12,
            }}
          />
          <Bar
            isAnimationActive={false}
            name="Completed training"
            dataKey="learners"
            fill="#e9dfff"
            radius={[6, 6, 0, 0]}
            maxBarSize={30}
          />
          <Bar
            isAnimationActive={false}
            name="Currently in work"
            dataKey="working"
            fill="#8051e9"
            radius={[6, 6, 0, 0]}
            maxBarSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function JourneyDonut({ learners }: { learners: Learner[] }) {
  const labels = [
    "Employed",
    "Self-employed",
    "Apprenticeship",
    "Seeking work",
    "Left job",
    "Further study",
    "No update",
  ];
  const data = labels
    .map((name, i) => ({
      name,
      value: learners.filter(
        (l) => l.consent && (latestOutcome(l)?.status || "No update") === name,
      ).length,
      color: chartColors[i],
    }))
    .filter((d) => d.value > 0);
  return (
    <div className="journey-donut">
      <div
        className="donut-drawing"
        role="img"
        aria-label={data.map((d) => `${d.name}: ${d.value}`).join("; ")}
      >
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie
              isAnimationActive={false}
              data={data}
              dataKey="value"
              innerRadius={63}
              outerRadius={86}
              paddingAngle={3}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #eee8fa",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <strong>{learners.filter((l) => l.consent).length}</strong>
          <span>learner journeys</span>
        </div>
      </div>
      <div className="donut-legend">
        {data.map((d) => (
          <div key={d.name}>
            <i style={{ background: d.color }} />
            <span>{d.name}</span>
            <strong>{d.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
