import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { personas } from "@relay/demo-seed";
import type { AuditEvent, Decision, Persona, Purpose } from "@relay/domain";
import { recordAuditEvent } from "@relay/relay-core";

type RecordInput = {
  product: AuditEvent["product"];
  action: string;
  purpose: Purpose;
  decision: Decision;
  summary: string;
};

type DemoContextValue = {
  persona: Persona;
  events: AuditEvent[];
  record: (input: RecordInput) => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

const initialEvents: AuditEvent[] = [
  recordAuditEvent({
    actorId: "system",
    product: "System",
    action: "WORKSPACE_READY",
    purpose: "AGGREGATE_ANALYTICS",
    decision: "allow",
    summary: "Policy, profile, and offline explanation resources loaded.",
  }),
];

export function DemoProvider({ actorId, children }: { actorId: string; children: ReactNode }) {
  const [events, setEvents] = useState(initialEvents);
  const persona = personas.find((item) => item.id === actorId);
  if (!persona) throw new Error(`Authenticated physician profile ${actorId} is not configured`);

  const value = useMemo<DemoContextValue>(() => ({
    persona,
    events,
    record: (input) => {
      setEvents((current) => [recordAuditEvent({ ...input, actorId: persona.id }), ...current]);
    },
  }), [events, persona]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("useDemo must be used inside DemoProvider");
  return value;
}
