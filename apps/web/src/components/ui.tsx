import type { ReactNode } from "react";
import { Check, Database, LockKeyhole } from "lucide-react";

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="page-heading">
      <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>
      {action}
    </div>
  );
}

export function ProvenanceBadge({ children, tone = "mint" }: { children: ReactNode; tone?: "mint" | "blue" | "gray" }) {
  return <span className={`provenance ${tone}`}><Database size={12} />{children}</span>;
}

export function StatusBadge({ children, tone }: { children: ReactNode; tone: "success" | "review" | "blocked" | "neutral" }) {
  return <span className={`status-badge ${tone}`}>{tone === "success" && <Check size={12} />}{children}</span>;
}

export function DemoNotice() {
  return <div className="demo-notice"><Sparkles size={16} /><span><strong>Demo</strong> · Synthetic data only</span></div>;
}

export function LockedValue({ revealed, value }: { revealed: boolean; value?: string }) {
  return <div className={revealed ? "locked-value revealed" : "locked-value"}><LockKeyhole size={18} />{revealed ? (value ?? "Approved email is unavailable") : "Contact details remain hidden"}</div>;
}
