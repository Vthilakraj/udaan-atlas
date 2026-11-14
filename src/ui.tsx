import { useEffect, useRef, type ReactNode } from "react";
import { X, ArrowUpRight, Sparkles } from "lucide-react";
export const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
export const prettyDate = (key: string) =>
  new Date(`${key.slice(0, 10)}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
export function Logo() {
  return (
    <span className="logo">
      <span className="logo-symbol">
        <svg viewBox="0 0 34 34" aria-hidden="true">
          <path
            d="M5 21V10h6v11c0 7 12 7 12 0V10h6v11c0 15-24 15-24 0"
            fill="currentColor"
          />
          <path d="m17 0 2 4 5 1-4 3 1 5-4-2-4 2 1-5-4-3 5-1z" fill="#d9fd5e" />
        </svg>
      </span>
      <span>
        udaan
        <span className="logo-atlas">
          atlas<span className="logo-star">✳</span>
        </span>
      </span>
    </span>
  );
}
export function Avatar({
  name,
  color = "#eee7ff",
  large = false,
}: {
  name: string;
  color?: string;
  large?: boolean;
}) {
  return (
    <span
      className={`avatar ${large ? "large" : ""}`}
      style={{ background: color }}
    >
      {name
        .split(" ")
        .map((n) => n.charAt(0))
        .slice(0, 2)
        .join("")}
    </span>
  );
}
export function Badge({
  children,
  tone = "violet",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Status({ status }: { status: string }) {
  return (
    <Badge
      tone={
        status === "Employed"
          ? "green"
          : status === "Self-employed"
            ? "violet"
            : status === "Apprenticeship"
              ? "blue"
              : status === "Left job"
                ? "coral"
                : status === "Seeking work"
                  ? "amber"
                  : "gray"
      }
    >
      <i />
      {status}
    </Badge>
  );
}
export function EvidenceTag({ label }: { label: string }) {
  return (
    <span
      className={`evidence-tag ${label === "Employer confirmed" ? "confirmed" : label === "Needs review" ? "disputed" : ""}`}
    >
      <span>
        {label === "Employer confirmed"
          ? "✦"
          : label === "Needs review"
            ? "!"
            : "◌"}
      </span>
      {label}
    </span>
  );
}
export function Modal({
  title,
  children,
  close,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onClose = useRef(close);
  onClose.current = close;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const box = ref.current!;
    const focusable = () =>
      Array.from(
        box.querySelectorAll<HTMLElement>(
          "button,input,select,textarea,a[href]",
        ),
      ).filter((e) => !e.hasAttribute("disabled"));
    focusable()[0]?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose.current();
      if (e.key === "Tab") {
        const items = focusable(),
          first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-shade"
      onClick={(e) => {
        if (e.currentTarget === e.target) close();
      }}
    >
      <div
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        ref={ref}
      >
        <header>
          <h2 id="dialog-title">{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={close}
          >
            <X size={21} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
export function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="empty">
      <Sparkles size={35} />
      <h3>{title}</h3>
      <p>{detail}</p>
    </div>
  );
}
export function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}
export function ArrowCircle() {
  return (
    <span className="arrow-circle">
      <ArrowUpRight size={17} />
    </span>
  );
}
