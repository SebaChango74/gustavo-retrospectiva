export function Arrow() {
  return (
    <span className="arrow" aria-hidden="true">
      →
    </span>
  );
}

export function LockIcon() {
  return <span aria-hidden="true">◆</span>;
}

export function ShareIcon() {
  return <span aria-hidden="true">↗</span>;
}

export function SectionHeading({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {action && (
        <button onClick={onAction}>
          {action} <Arrow />
        </button>
      )}
    </div>
  );
}

export function PeronometroLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={compact ? "peronometro-logo compact" : "peronometro-logo"}
      aria-label="Peronómetro"
    >
      <span className="meter-mark">
        <i />
      </span>
      <span className="logo-words">
        <b>PERONÓ</b>
        <b>METRO</b>
      </span>
    </div>
  );
}

const MONTHS_AR = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

export function dayOf(iso: string): string {
  const d = new Date(iso);
  return String(d.getDate()).padStart(2, "0");
}

export function monthOf(iso: string): string {
  return MONTHS_AR[new Date(iso).getMonth()];
}

export function timeOf(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function dateLabel(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`;
}
